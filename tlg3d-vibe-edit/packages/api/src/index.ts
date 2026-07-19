// ============================================================
//  CutFlow — Full API Server (index.ts)
//  Wires all routes together: projects, audio, models,
//  marketplace, messaging, scripts, video, users
// ============================================================

import express        from 'express';
import cors           from 'cors';
import mongoose       from 'mongoose';
import dotenv         from 'dotenv';
import path           from 'path';
import fs             from 'fs';
import http           from 'http';
import { Server }     from 'socket.io';

dotenv.config();

// ── Routes ───────────────────────────────────────────────────
import projectsRouter    from './routes/projects';
import audioRouter       from './routes/audio';
import modelsRouter      from './routes/models';

// ── LLM Router ───────────────────────────────────────────────
import LLMRouter         from '../../llm-router/src/enhanced-llm-router';

// ── Marketplace ───────────────────────────────────────────────
import marketplaceRouter from '../../marketplace/src/routes/marketplace';
import skillLoader       from '../../marketplace/src/skill-loader';

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const PORT       = parseInt(process.env.PORT        || '3000', 10);
const MONGODB_URI = process.env.MONGODB_URI          || 'mongodb://localhost:27017/cutflow';
const DATA_DIR    = process.env.DATA_DIR             || './data/users';

// ── Ensure data directories exist ────────────────────────────
[DATA_DIR, './data/skills', './tmp'].forEach(dir =>
  fs.mkdirSync(dir, { recursive: true })
);

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// ── MongoDB ──────────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB error:', err));

// ── MongoDB Schemas ───────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  userId:      { type: String, required: true, unique: true },
  platform:    String,
  username:    String,
  displayName: String,
  email:       String,
  createdAt:   { type: Date, default: Date.now },
  settings:    { type: mongoose.Schema.Types.Mixed, default: {} },
});

const ProjectSchema = new mongoose.Schema({
  projectId:   { type: String, required: true, unique: true },
  userId:      { type: String, required: true, index: true },
  projectName: String,
  description: String,
  status:      { type: String, default: 'draft' },
  progress:    { type: Number, default: 0 },
  resolution:  { type: String, default: '1080p' },
  fps:         { type: Number, default: 30 },
  assets:      { type: [mongoose.Schema.Types.Mixed], default: [] },
  audioTracks: { type: [mongoose.Schema.Types.Mixed], default: [] },
  timeline:    { type: mongoose.Schema.Types.Mixed, default: {} },
  settings:    { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

const RenderJobSchema = new mongoose.Schema({
  jobId:      { type: String, required: true, unique: true },
  projectId:  String,
  userId:     String,
  status:     { type: String, default: 'pending' },
  progress:   { type: Number, default: 0 },
  outputPath: String,
  resolution: String,
  startedAt:  Date,
  completedAt:Date,
  error:      String,
  createdAt:  { type: Date, default: Date.now },
});

const User      = mongoose.models.User      || mongoose.model('User',      UserSchema);
const Project   = mongoose.models.Project   || mongoose.model('Project',   ProjectSchema);
const RenderJob = mongoose.models.RenderJob || mongoose.model('RenderJob', RenderJobSchema);

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status:    'ok',
  app:       'CutFlow API',
  version:   '0.1.0',
  timestamp: new Date().toISOString(),
}));

// ── Mount route modules ───────────────────────────────────────
app.use('/api/projects',   projectsRouter);
app.use('/api/audio',      audioRouter);
app.use('/api/models',     modelsRouter);
app.use('/api/marketplace',marketplaceRouter);

// ── User Management ───────────────────────────────────────────

app.post('/api/users/register', async (req, res) => {
  try {
    const { userId, platform, username, displayName, email } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await User.findOneAndUpdate(
      { userId },
      { userId, platform, username, displayName, email },
      { upsert: true, new: true }
    );

    // Create user data directory: {platform}_{userId}/
    const userDir = path.join(DATA_DIR, `${platform || 'unknown'}_${userId}`);
    ['projects', 'conversations', 'incoming', 'outgoing', 'audio_library', 'settings']
      .forEach(sub => fs.mkdirSync(path.join(userDir, sub), { recursive: true }));

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/users/:userId/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    await User.findOneAndUpdate({ userId: req.params.userId }, { settings });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Script Generation ─────────────────────────────────────────

app.post('/api/scripts/generate', async (req, res) => {
  try {
    const { userId, prompt, provider = 'openrouter', model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const selectedModel = model || 'meta-llama/llama-3-8b-instruct';

    const script = await LLMRouter.chat(
      provider,
      selectedModel,
      [
        { role: 'system', content: 'You are a professional video scriptwriter for TLG3D\'s CutFlow. Generate engaging, well-structured video scripts with scene descriptions, dialogue, and timing notes.' },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.7, maxTokens: 2000 }
    );

    // Save script to user folder
    if (userId) {
      const userDir    = path.join(DATA_DIR, userId);
      const scriptPath = path.join(userDir, `script_${Date.now()}.txt`);
      fs.mkdirSync(userDir, { recursive: true });
      fs.writeFileSync(scriptPath, script);
    }

    res.json({ script, provider, model: selectedModel });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Voiceover (ElevenLabs) ────────────────────────────────────

app.post('/api/audio/voiceover', async (req, res) => {
  try {
    const { userId, text, voice = '21m00Tcm4TlvDq8ikWAM', speed = 1.0 } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'ElevenLabs API key not configured' });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method:  'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(400).json({ error: `ElevenLabs: ${err}` });
    }

    const audioBuffer = await response.arrayBuffer();
    const audio       = Buffer.from(audioBuffer).toString('base64');

    // Save to user folder
    if (userId) {
      const userDir  = path.join(DATA_DIR, userId, 'incoming');
      const voPath   = path.join(userDir, `voiceover_${Date.now()}.mp3`);
      fs.mkdirSync(userDir, { recursive: true });
      fs.writeFileSync(voPath, Buffer.from(audioBuffer));
    }

    res.json({ audio, mimeType: 'audio/mpeg' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Subtitle Generation ───────────────────────────────────────

app.post('/api/subtitles/generate', async (req, res) => {
  try {
    const { userId, videoPath, language = 'en' } = req.body;
    if (!videoPath) return res.status(400).json({ error: 'videoPath required' });

    // Use Whisper via OpenAI API or local
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const FormData = (await import('form-data')).default;
      const axios    = (await import('axios')).default;
      const form     = new FormData();
      form.append('file',     fs.createReadStream(videoPath));
      form.append('model',    'whisper-1');
      form.append('language', language);
      form.append('response_format', 'srt');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        { headers: { ...form.getHeaders(), Authorization: `Bearer ${openaiKey}` } }
      );

      res.json({ subtitles: response.data, format: 'srt' });
    } else {
      // Fallback: placeholder
      res.json({
        subtitles: '1\n00:00:00,000 --> 00:00:05,000\n[CutFlow auto-caption placeholder]\n\n',
        format: 'srt',
        message: 'Set OPENAI_API_KEY for real transcription',
      });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Video Processing Proxy → Video Engine ────────────────────

const VIDEO_ENGINE = process.env.VIDEO_ENGINE_URL || 'http://localhost:5000';

const proxyToVideoEngine = async (req: express.Request, res: express.Response, endpoint: string) => {
  try {
    const axios    = (await import('axios')).default;
    const response = await axios.post(`${VIDEO_ENGINE}${endpoint}`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: err.response?.data?.error || err.message });
  }
};

app.post('/api/video/transition',    (req, res) => proxyToVideoEngine(req, res, '/api/video/transition'));
app.post('/api/video/color-grade',   (req, res) => proxyToVideoEngine(req, res, '/api/video/color-grade'));
app.post('/api/video/detect-scenes', (req, res) => proxyToVideoEngine(req, res, '/api/video/detect-scenes'));
app.post('/api/video/concatenate',   (req, res) => proxyToVideoEngine(req, res, '/api/video/concatenate'));
app.post('/api/video/render',        (req, res) => proxyToVideoEngine(req, res, '/api/video/render'));

// ── File Download (for sharing) ───────────────────────────────

app.get('/api/files/download', (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Dashboard Metrics ─────────────────────────────────────────

app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const [totalProjects, totalUsers] = await Promise.all([
      Project.countDocuments(),
      User.countDocuments(),
    ]);

    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const activeProjects    = await Project.countDocuments({ status: { $in: ['in_progress', 'processing'] } });

    // Storage used
    let storageBytes = 0;
    if (fs.existsSync(DATA_DIR)) {
      const getAllFiles = (dir: string): string[] => {
        try {
          return fs.readdirSync(dir).flatMap(f => {
            const fp = path.join(dir, f);
            return fs.statSync(fp).isDirectory() ? getAllFiles(fp) : [fp];
          });
        } catch { return []; }
      };
      storageBytes = getAllFiles(DATA_DIR).reduce((s, f) => {
        try { return s + fs.statSync(f).size; } catch { return s; }
      }, 0);
    }

    res.json({
      totalProjects,
      totalUsers,
      completedProjects,
      activeProjects,
      videosProcessed: completedProjects,
      storageUsed:     Math.min(100, Math.round((storageBytes / (5 * 1024 * 1024 * 1024)) * 100)),
      storageBytes,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Setup Complete ────────────────────────────────────────────

app.post('/api/setup/complete', async (req, res) => {
  try {
    const config     = req.body;
    const configPath = path.join('./data', 'setup_config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Messaging send endpoint (called by messaging service) ────

app.post('/api/messaging/deliver', async (req, res) => {
  try {
    const { platform, platformId, type, content, caption } = req.body;

    // Forward to messaging service
    const axios = (await import('axios')).default;
    const msgServiceUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3003';

    await axios.post(`${msgServiceUrl}/api/messaging/send`, {
      platform, platformId, type, content, caption,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── WebSocket — Real-time progress updates ────────────────────

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('subscribe', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`[WS] ${socket.id} subscribed to user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Helper to broadcast progress to user's room
export const broadcastProgress = (userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data);
};

// ── Error handler ─────────────────────────────────────────────

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start server ──────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🚀 CutFlow API running on port ${PORT}`);
  console.log(`   📁 Data directory: ${DATA_DIR}`);
  console.log(`   🌐 http://localhost:${PORT}/health\n`);
});

export default app;
