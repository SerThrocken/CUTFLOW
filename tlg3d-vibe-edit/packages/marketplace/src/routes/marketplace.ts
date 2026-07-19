// ============================================================
//  TLG3D Marketplace — Full API Routes
//  Browse, search, install, uninstall, rate, purchase skills
// ============================================================

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { skillLoader } from '../skill-loader';
import { validateSkillManifest } from '../skill-manifest';
import type { SkillManifest, InstalledSkill } from '../skill-manifest';

const router = express.Router();

const SKILLS_DIR      = process.env.SKILLS_DIR      || './data/skills';
const INSTALLED_FILE  = process.env.INSTALLED_FILE  || './data/installed_skills.json';

// ── MongoDB Schemas ───────────────────────────────────────────

const SkillSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  name:            String,
  version:         String,
  description:     String,
  longDescription: String,
  author:          String,
  category:        String,
  tags:            [String],
  icon:            String,
  screenshots:     [String],
  pricing:         mongoose.Schema.Types.Mixed,
  runtime:         String,
  entrypoint:      String,
  configSchema:    mongoose.Schema.Types.Mixed,
  permissions:     [String],
  platforms:       [String],
  minAppVersion:   String,
  downloads:       { type: Number, default: 0 },
  rating:          { type: Number, default: 0 },
  ratingCount:     { type: Number, default: 0 },
  verified:        { type: Boolean, default: false },
  featured:        { type: Boolean, default: false },
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now },
  bundleUrl:       String,   // URL to download the skill bundle
  checksum:        String,   // SHA256 of bundle for verification
});

const ReviewSchema = new mongoose.Schema({
  skillId:   { type: String, required: true },
  userId:    { type: String, required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  title:     String,
  body:      String,
  createdAt: { type: Date, default: Date.now },
});

const PurchaseSchema = new mongoose.Schema({
  skillId:     { type: String, required: true },
  userId:      { type: String, required: true },
  price:       Number,
  currency:    String,
  purchasedAt: { type: Date, default: Date.now },
  receipt:     String,
});

const Skill    = mongoose.models.Skill    || mongoose.model('Skill',    SkillSchema);
const Review   = mongoose.models.Review   || mongoose.model('Review',   ReviewSchema);
const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);

// ── Helper: load installed skills ────────────────────────────

function loadInstalled(): InstalledSkill[] {
  if (!fs.existsSync(INSTALLED_FILE)) return [];
  return JSON.parse(fs.readFileSync(INSTALLED_FILE, 'utf-8'));
}

function saveInstalled(skills: InstalledSkill[]) {
  fs.mkdirSync(path.dirname(INSTALLED_FILE), { recursive: true });
  fs.writeFileSync(INSTALLED_FILE, JSON.stringify(skills, null, 2));
}

// ── GET /api/marketplace/skills ───────────────────────────────
// Browse all skills with optional filters

router.get('/skills', async (req, res) => {
  try {
    const {
      category, search, featured, verified,
      sort = 'downloads', page = '1', limit = '24',
    } = req.query;

    const query: any = {};
    if (category)  query.category = category;
    if (featured)  query.featured = true;
    if (verified)  query.verified = true;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search as string, 'i')] } },
        { author:      { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap: Record<string, any> = {
      downloads: { downloads: -1 },
      rating:    { rating: -1 },
      newest:    { createdAt: -1 },
      name:      { name: 1 },
    };

    const skip  = (parseInt(page as string) - 1) * parseInt(limit as string);
    const total = await Skill.countDocuments(query);
    const skills = await Skill
      .find(query)
      .sort(sortMap[sort as string] || sortMap.downloads)
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean();

    const installed = loadInstalled().map(s => s.skillId);

    res.json({
      skills: skills.map(s => ({
        ...s,
        installed: installed.includes(s.id),
      })),
      total,
      page:      parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/marketplace/skills/featured ─────────────────────

router.get('/skills/featured', async (req, res) => {
  try {
    const skills = await Skill.find({ featured: true }).limit(8).lean();
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/marketplace/skills/categories ───────────────────

router.get('/skills/categories', async (req, res) => {
  try {
    const agg = await Skill.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ categories: agg });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/marketplace/skills/:id ──────────────────────────

router.get('/skills/:id', async (req, res) => {
  try {
    const skill = await Skill.findOne({ id: req.params.id }).lean();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const reviews   = await Review.find({ skillId: req.params.id }).sort({ createdAt: -1 }).limit(20).lean();
    const installed = loadInstalled().find(s => s.skillId === req.params.id);

    res.json({ skill, reviews, installed: installed || null });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/install ─────────────────

router.post('/skills/:id/install', async (req, res) => {
  try {
    const { userId, config = {} } = req.body;
    const skill = await Skill.findOne({ id: req.params.id }).lean() as any;
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // Check if paid — verify purchase
    if (skill.pricing?.type === 'paid' || skill.pricing?.type === 'one-time') {
      const purchase = await Purchase.findOne({ skillId: skill.id, userId });
      if (!purchase) {
        return res.status(402).json({ error: 'Purchase required', skillId: skill.id });
      }
    }

    // Create skill directory
    const skillDir = path.join(SKILLS_DIR, skill.id);
    fs.mkdirSync(skillDir, { recursive: true });

    // Write manifest
    fs.writeFileSync(
      path.join(skillDir, 'manifest.json'),
      JSON.stringify(skill, null, 2)
    );

    // In production: download bundle from skill.bundleUrl and extract
    // For now: write a placeholder index.js if none exists
    const entryPath = path.join(skillDir, 'index.js');
    if (!fs.existsSync(entryPath)) {
      fs.writeFileSync(entryPath, `
// Skill: ${skill.name}
// Auto-installed by TLG3D Marketplace
async function execute(ctx) {
  ctx.log('${skill.name} executing...');
  return { success: true, message: '${skill.name} completed' };
}
module.exports = { execute };
      `.trim());
    }

    // Register as installed
    const installed = loadInstalled().filter(s => s.skillId !== skill.id);
    installed.push({
      skillId:     skill.id,
      version:     skill.version,
      installedAt: new Date().toISOString(),
      enabled:     true,
      config,
      localPath:   skillDir,
    });
    saveInstalled(installed);

    // Load into runtime
    await skillLoader.loadSkill(skill.id);

    // Increment download count
    await Skill.updateOne({ id: skill.id }, { $inc: { downloads: 1 } });

    res.json({
      success: true,
      message: `${skill.name} installed successfully`,
      skillId: skill.id,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/uninstall ───────────────

router.post('/skills/:id/uninstall', async (req, res) => {
  try {
    const { userId } = req.body;
    const skillId    = req.params.id;

    // Unload from runtime
    skillLoader.unloadSkill(skillId);

    // Remove from installed list
    const installed = loadInstalled().filter(s => s.skillId !== skillId);
    saveInstalled(installed);

    // Remove files
    const skillDir = path.join(SKILLS_DIR, skillId);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: `${skillId} uninstalled` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/toggle ──────────────────

router.post('/skills/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    const installed   = loadInstalled();
    const skill       = installed.find(s => s.skillId === req.params.id);

    if (!skill) return res.status(404).json({ error: 'Skill not installed' });

    skill.enabled = enabled;
    saveInstalled(installed);

    if (!enabled) {
      skillLoader.unloadSkill(req.params.id);
    } else {
      await skillLoader.loadSkill(req.params.id);
    }

    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── PUT /api/marketplace/skills/:id/config ───────────────────

router.put('/skills/:id/config', async (req, res) => {
  try {
    const { config } = req.body;
    const installed  = loadInstalled();
    const skill      = installed.find(s => s.skillId === req.params.id);

    if (!skill) return res.status(404).json({ error: 'Skill not installed' });

    skill.config = { ...skill.config, ...config };
    saveInstalled(installed);

    // Hot-reload with new config
    await skillLoader.reloadSkill(req.params.id);

    res.json({ success: true, config: skill.config });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/review ──────────────────

router.post('/skills/:id/review', async (req, res) => {
  try {
    const { userId, rating, title, body } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ error: 'userId and rating required' });
    }

    // Upsert review
    await Review.findOneAndUpdate(
      { skillId: req.params.id, userId },
      { skillId: req.params.id, userId, rating, title, body, createdAt: new Date() },
      { upsert: true }
    );

    // Recalculate average rating
    const agg = await Review.aggregate([
      { $match: { skillId: req.params.id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (agg.length > 0) {
      await Skill.updateOne(
        { id: req.params.id },
        { rating: Math.round(agg[0].avg * 10) / 10, ratingCount: agg[0].count }
      );
    }

    res.json({ success: true, rating });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/purchase ────────────────

router.post('/skills/:id/purchase', async (req, res) => {
  try {
    const { userId, receipt } = req.body;
    const skill = await Skill.findOne({ id: req.params.id }).lean() as any;
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // In production: verify receipt with App Store / Play Store / Stripe
    await Purchase.create({
      skillId:     req.params.id,
      userId,
      price:       skill.pricing?.price || 0,
      currency:    skill.pricing?.currency || 'USD',
      purchasedAt: new Date(),
      receipt,
    });

    res.json({ success: true, message: 'Purchase recorded', skillId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/marketplace/installed ───────────────────────────

router.get('/installed', (req, res) => {
  try {
    const installed = loadInstalled();
    res.json({ installed, count: installed.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/skills/:id/run ─────────────────────

router.post('/skills/:id/run', async (req, res) => {
  try {
    const { userId, projectId, projectPath, config = {} } = req.body;

    const result = await skillLoader.executeSkill(req.params.id, {
      userId,
      projectId,
      projectPath,
      config,
      llmRouter:  null,
      ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
      dataDir:    process.env.DATA_DIR    || './data',
      emit:       (event, payload) => {},
      log:        (msg) => console.log(`[skill:${req.params.id}]`, msg),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/marketplace/skills/:id/updates ──────────────────

router.get('/skills/:id/updates', async (req, res) => {
  try {
    const installed = loadInstalled().find(s => s.skillId === req.params.id);
    if (!installed) return res.status(404).json({ error: 'Not installed' });

    const remote = await Skill.findOne({ id: req.params.id }).lean() as any;
    const hasUpdate = remote && remote.version !== installed.version;

    res.json({
      hasUpdate,
      installedVersion: installed.version,
      latestVersion:    remote?.version,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /api/marketplace/seed ───────────────────────────────
// Seed the default TLG3D skills into the database

router.post('/seed', async (req, res) => {
  try {
    const { MARKETPLACE_SKILLS } = await import('../default-skills');
    let seeded = 0;

    for (const skill of MARKETPLACE_SKILLS) {
      await Skill.findOneAndUpdate(
        { id: skill.id },
        { ...skill, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      seeded++;
    }

    res.json({ success: true, seeded });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
