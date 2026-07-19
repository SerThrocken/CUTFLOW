// ============================================================
//  CutFlow — Audio Library API Routes
//  Browse RF library, search external platforms, mix audio
// ============================================================

import express from 'express';
import path    from 'path';
import fs      from 'fs';
import axios   from 'axios';

import {
  ROYALTY_FREE_LIBRARY,
  searchLibrary,
  getFeaturedTracks,
  getTracksByCategory,
  getAllCategories,
  CATEGORY_META,
  type MusicCategory,
} from '@cutflow/core/royalty-free-library';

import { musicSearchService } from '@cutflow/core/music-search';

import {
  mixBackgroundMusic,
  extractAudio,
  addSfxOverlay,
  normalizeAudio,
  enhanceAudio,
  type MixOptions,
} from '@cutflow/video-engine/audio-mixer';

const router = express.Router();

// ── Browse RF Library ─────────────────────────────────────────

router.get('/library', (req, res) => {
  try {
    const { category, search, featured } = req.query;

    let tracks = ROYALTY_FREE_LIBRARY;

    if (featured === 'true') {
      tracks = getFeaturedTracks();
    } else if (category && category !== 'all') {
      tracks = getTracksByCategory(category as MusicCategory);
    }

    if (search) {
      tracks = searchLibrary(search as string, category !== 'all' ? category as MusicCategory : undefined);
    }

    res.json({
      tracks,
      total:      tracks.length,
      categories: getAllCategories(),
      categoryMeta: CATEGORY_META,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Get Featured Tracks ───────────────────────────────────────

router.get('/library/featured', (req, res) => {
  res.json({ tracks: getFeaturedTracks() });
});

// ── Search External Music Platforms ──────────────────────────

router.get('/search', async (req, res) => {
  try {
    const { q, platform, limit = '5' } = req.query;

    if (!q) return res.status(400).json({ error: 'Query (q) is required' });

    let results: any;

    if (platform && platform !== 'all') {
      // Single platform search
      const tracks = await musicSearchService.search(
        platform as any,
        q as string,
        parseInt(limit as string, 10)
      );
      results = { [platform as string]: tracks };
    } else {
      // All platforms
      results = await musicSearchService.searchAll(q as string, parseInt(limit as string, 10));
    }

    res.json({ results, query: q });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Download Track from YouTube (yt-dlp) ─────────────────────

router.post('/download-youtube', async (req, res) => {
  try {
    const { userId, youtubeUrl } = req.body;
    if (!userId || !youtubeUrl) {
      return res.status(400).json({ error: 'userId and youtubeUrl required' });
    }

    const outputDir = path.join(
      process.env.DATA_DIR || './data',
      'users',
      userId,
      'audio_library'
    );

    const downloadedPath = await musicSearchService.downloadFromYouTube(youtubeUrl, outputDir);

    res.json({
      success:  true,
      path:     downloadedPath,
      filename: path.basename(downloadedPath),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Add Track to Project ──────────────────────────────────────

router.post('/add-to-project', async (req, res) => {
  try {
    const { projectId, trackId, trackUrl, trackTitle, trackArtist, userId } = req.body;

    if (!projectId || !trackUrl) {
      return res.status(400).json({ error: 'projectId and trackUrl required' });
    }

    // Download track to project audio folder
    const projectPath = path.join(
      process.env.DATA_DIR || './data',
      'users',
      userId || 'unknown',
      'projects',
      projectId,
      'assets',
      'audio'
    );
    fs.mkdirSync(projectPath, { recursive: true });

    const filename = `${trackId || 'track'}_${Date.now()}.mp3`;
    const destPath = path.join(projectPath, filename);

    // Download the file
    const response = await axios.get(trackUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(destPath, Buffer.from(response.data));

    // Update project metadata
    const projectDir    = path.join(projectPath, '..', '..');
    const metaPath      = path.join(projectDir, 'project.json');
    let   projectMeta   = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      : {};

    if (!projectMeta.audioTracks) projectMeta.audioTracks = [];
    projectMeta.audioTracks.push({
      id:       trackId,
      title:    trackTitle,
      artist:   trackArtist,
      path:     destPath,
      addedAt:  new Date().toISOString(),
    });

    fs.writeFileSync(metaPath, JSON.stringify(projectMeta, null, 2));

    res.json({ success: true, path: destPath, filename });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Mix Background Music ──────────────────────────────────────

router.post('/mix', async (req, res) => {
  try {
    const {
      userId,
      videoPath,
      musicPath,
      outputPath,
      backgroundVolume = 0.3,
      originalVolume   = 1.0,
      fadeMusicIn      = 2,
      fadeMusicOut     = 3,
      duckingEnabled   = true,
      duckingLevel     = 0.15,
      loop             = true,
      normalize        = true,
    } = req.body;

    if (!videoPath || !musicPath || !outputPath) {
      return res.status(400).json({ error: 'videoPath, musicPath, and outputPath required' });
    }

    const result = await mixBackgroundMusic(videoPath, outputPath, {
      backgroundMusicPath: musicPath,
      backgroundVolume:    parseFloat(backgroundVolume),
      originalVolume:      parseFloat(originalVolume),
      fadeMusicIn:         parseInt(fadeMusicIn, 10),
      fadeMusicOut:        parseInt(fadeMusicOut, 10),
      duckingEnabled:      !!duckingEnabled,
      duckingLevel:        parseFloat(duckingLevel),
      loop:                !!loop,
      normalize:           !!normalize,
    });

    res.json({ success: true, outputPath: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Extract Audio from Video ──────────────────────────────────

router.post('/extract', async (req, res) => {
  try {
    const { videoPath, outputPath, format = 'mp3' } = req.body;
    if (!videoPath || !outputPath) {
      return res.status(400).json({ error: 'videoPath and outputPath required' });
    }

    const result = await extractAudio(videoPath, outputPath, format);
    res.json({ success: true, outputPath: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Add SFX Overlay ───────────────────────────────────────────

router.post('/sfx', async (req, res) => {
  try {
    const { videoPath, outputPath, sfxTracks } = req.body;
    if (!videoPath || !outputPath || !sfxTracks) {
      return res.status(400).json({ error: 'videoPath, outputPath, and sfxTracks required' });
    }

    const result = await addSfxOverlay(videoPath, sfxTracks, outputPath);
    res.json({ success: true, outputPath: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Normalize Audio ───────────────────────────────────────────

router.post('/normalize', async (req, res) => {
  try {
    const { videoPath, outputPath, targetLUFS = -23 } = req.body;
    if (!videoPath || !outputPath) {
      return res.status(400).json({ error: 'videoPath and outputPath required' });
    }

    const result = await normalizeAudio(videoPath, outputPath, parseInt(targetLUFS, 10));
    res.json({ success: true, outputPath: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Enhance Audio ─────────────────────────────────────────────

router.post('/enhance', async (req, res) => {
  try {
    const { videoPath, outputPath, removeNoise = true, enhanceVoice = true, reduceEcho = false } = req.body;
    if (!videoPath || !outputPath) {
      return res.status(400).json({ error: 'videoPath and outputPath required' });
    }

    const result = await enhanceAudio(videoPath, outputPath, {
      removeNoise:  !!removeNoise,
      enhanceVoice: !!enhanceVoice,
      reduceEcho:   !!reduceEcho,
    });
    res.json({ success: true, outputPath: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
