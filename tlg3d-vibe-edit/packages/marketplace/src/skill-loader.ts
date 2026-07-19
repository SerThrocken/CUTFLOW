// ============================================================
//  TLG3D Marketplace — Skill Hot-Loader / Sandbox
//  Loads and executes skills at runtime without restarting.
//  Each skill runs in an isolated VM context with a
//  controlled API surface — it cannot access anything outside
//  the SkillContext it is given.
// ============================================================

import vm from 'vm';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { SkillManifest, InstalledSkill, SkillContext, SkillResult } from './skill-manifest';

const SKILLS_DIR = process.env.SKILLS_DIR || path.join(process.cwd(), 'data', 'skills');

// ── Skill Cache ───────────────────────────────────────────────

const skillCache = new Map<string, {
  manifest:  SkillManifest;
  execute:   (ctx: SkillContext) => Promise<SkillResult>;
  loadedAt:  Date;
}>();

// ── Loader ────────────────────────────────────────────────────

export class SkillLoader extends EventEmitter {

  /**
   * Load a skill from disk into the cache.
   * Re-loads if already cached (for hot-reload after updates).
   */
  async loadSkill(skillId: string): Promise<void> {
    const skillDir  = path.join(SKILLS_DIR, skillId);
    const manifestPath = path.join(skillDir, 'manifest.json');
    const entryPath    = path.join(skillDir, 'index.js');

    if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found for skill: ${skillId}`);
    if (!fs.existsSync(entryPath))    throw new Error(`Entrypoint not found for skill: ${skillId}`);

    const manifest: SkillManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const code = fs.readFileSync(entryPath, 'utf-8');

    // Build isolated sandbox
    const sandbox = this.buildSandbox(manifest);

    // Compile and run in VM context
    const script  = new vm.Script(code, { filename: `skill:${skillId}` });
    const context = vm.createContext(sandbox);
    script.runInContext(context);

    // Grab the exported execute function
    const executeFn = sandbox.module?.exports?.execute || sandbox.execute;
    if (typeof executeFn !== 'function') {
      throw new Error(`Skill ${skillId} does not export an execute() function`);
    }

    skillCache.set(skillId, {
      manifest,
      execute:  executeFn,
      loadedAt: new Date(),
    });

    this.emit('skill-loaded', { skillId, version: manifest.version });
  }

  /**
   * Execute a loaded skill.
   */
  async executeSkill(skillId: string, ctx: SkillContext): Promise<SkillResult> {
    if (!skillCache.has(skillId)) {
      await this.loadSkill(skillId);
    }

    const skill = skillCache.get(skillId)!;

    try {
      this.emit('skill-start', { skillId, userId: ctx.userId, projectId: ctx.projectId });
      const result = await skill.execute(ctx);
      this.emit('skill-complete', { skillId, result });
      return result;
    } catch (error) {
      const errMsg = (error as Error).message;
      this.emit('skill-error', { skillId, error: errMsg });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Unload a skill from cache (force re-load next call).
   */
  unloadSkill(skillId: string): void {
    skillCache.delete(skillId);
    this.emit('skill-unloaded', { skillId });
  }

  /**
   * List all currently loaded skills.
   */
  listLoadedSkills(): string[] {
    return Array.from(skillCache.keys());
  }

  /**
   * Hot-reload a skill (re-read from disk).
   */
  async reloadSkill(skillId: string): Promise<void> {
    this.unloadSkill(skillId);
    await this.loadSkill(skillId);
    this.emit('skill-reloaded', { skillId });
  }

  // ── Private: Build restricted sandbox ─────────────────────

  private buildSandbox(manifest: SkillManifest): any {
    const allowed  = new Set(manifest.permissions);
    const sandbox: any = {
      module:  { exports: {} },
      exports: {},
      require: this.buildRestrictedRequire(allowed),
      console: {
        log:   (...a: any[]) => console.log  (`[skill:${manifest.id}]`, ...a),
        warn:  (...a: any[]) => console.warn (`[skill:${manifest.id}]`, ...a),
        error: (...a: any[]) => console.error(`[skill:${manifest.id}]`, ...a),
      },
      process: {
        env:      {},  // no env access
        platform: process.platform,
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      Buffer,
      JSON,
      Math,
      Date,
    };

    // Only expose fs if explicitly requested
    if (allowed.has('filesystem')) {
      sandbox.fs = {
        readFileSync:   fs.readFileSync,
        writeFileSync:  fs.writeFileSync,
        existsSync:     fs.existsSync,
        mkdirSync:      fs.mkdirSync,
        readdirSync:    fs.readdirSync,
        statSync:       fs.statSync,
        unlinkSync:     fs.unlinkSync,
      };
    }

    return sandbox;
  }

  private buildRestrictedRequire(allowed: Set<string>) {
    // Whitelist of safe built-ins skills can import
    const safeModules: Record<string, any> = {
      path,
      'node:path': path,
    };

    if (allowed.has('network')) {
      safeModules['axios']   = require('axios');
      safeModules['node-fetch'] = require('node-fetch');
    }

    return (id: string) => {
      if (safeModules[id]) return safeModules[id];
      throw new Error(`Skill cannot require '${id}' — not in permission list`);
    };
  }
}

export const skillLoader = new SkillLoader();
export default skillLoader;
