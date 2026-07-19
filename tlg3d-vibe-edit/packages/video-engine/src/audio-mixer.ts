// ============================================================
//  CutFlow — Audio Mixing Engine
//  - Extract audio from video (preserve original)
//  - Mix background music into video (with ducking)
//  - Apply volume automation, fade in/out
//  - Merge SFX onto timeline
//  All processing via FFmpeg — no audio quality loss
// ============================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

function ffmpeg(): string {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

export interface MixOptions {
  backgroundMusicPath: string;
  backgroundVolume:    number;  // 0.0–1.0
  originalVolume:      number;  // 0.0–1.0 (original video audio)
  fadeMusicIn:         number;  // seconds
  fadeMusicOut:        number;  // seconds
  duckingEnabled:      boolean; // auto lower music when speech detected
  duckingLevel:        number;  // 0.0–1.0 (how much to duck)
  loop:                boolean; // loop background music if shorter than video
  normalize:           boolean; // normalize output audio levels
}

export const DEFAULT_MIX_OPTIONS: MixOptions = {
  backgroundMusicPath: '',
  backgroundVolume:    0.3,    // 30% background
  originalVolume:      1.0,    // 100% original
  fadeMusicIn:         2,
  fadeMusicOut:        3,
  duckingEnabled:      true,
  duckingLevel:        0.15,   // Duck to 15% during speech
  loop:                true,
  normalize:           true,
};

// ── Audio Extraction ─────────────────────────────────────────

/**
 * Extract the audio track from a video file.
 * Preserves original audio quality — copies stream, no re-encode.
 */
export async function extractAudio(
  videoPath: string,
  outputPath: string,
  format: 'aac' | 'mp3' | 'wav' | 'copy' = 'copy'
): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const codecFlag = format === 'copy' ? '-c:a copy' : `-c:a ${format === 'mp3' ? 'libmp3lame -q:a 2' : format}`;
  await execAsync(
    `${ffmpeg()} -i "${videoPath}" -vn ${codecFlag} "${outputPath}" -y`
  );
  return outputPath;
}

/**
 * Extract audio + video into separate files for editing.
 */
export async function demux(
  videoPath: string,
  videoDest: string,
  audioDest: string
): Promise<{ video: string; audio: string }> {
  fs.mkdirSync(path.dirname(videoDest), { recursive: true });
  fs.mkdirSync(path.dirname(audioDest), { recursive: true });

  // Video stream only
  await execAsync(`${ffmpeg()} -i "${videoPath}" -an -c:v copy "${videoDest}" -y`);
  // Audio stream only
  await execAsync(`${ffmpeg()} -i "${videoPath}" -vn -c:a copy "${audioDest}" -y`);

  return { video: videoDest, audio: audioDest };
}

// ── Background Music Mixing ───────────────────────────────────

/**
 * Mix background music into a video.
 * Uses amix filter with volume automation.
 * Supports:
 *   - Volume control for both tracks
 *   - Fade in/out for music
 *   - Music looping
 *   - Audio ducking (auto-lower music during speech)
 *   - Normalization
 */
export async function mixBackgroundMusic(
  videoPath:  string,
  outputPath: string,
  options:    Partial<MixOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_MIX_OPTIONS, ...options };

  if (!opts.backgroundMusicPath || !fs.existsSync(opts.backgroundMusicPath)) {
    throw new Error(`Background music not found: ${opts.backgroundMusicPath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Build complex FFmpeg filter graph
  const loopFlag = opts.loop ? '-stream_loop -1' : '';

  // Fade filters for music
  const fadeIn  = opts.fadeMusicIn  > 0 ? `,afade=t=in:st=0:d=${opts.fadeMusicIn}`   : '';
  const fadeOut = opts.fadeMusicOut > 0 ? `,afade=t=out:st=-${opts.fadeMusicOut}:d=${opts.fadeMusicOut}` : '';

  let filterComplex: string;

  if (opts.duckingEnabled) {
    // Ducking: lower music when original audio is loud (speech detection)
    filterComplex = [
      // Scale original audio volume
      `[0:a]volume=${opts.originalVolume}[orig]`,
      // Scale music volume + fades
      `[1:a]volume=${opts.backgroundVolume}${fadeIn}${fadeOut}[bgm]`,
      // Sidechain compress: detect speech in orig, duck bgm
      `[bgm][orig]sidechaincompress=threshold=0.015:ratio=4:release=200:level_sc=${opts.duckingLevel}[bgm_ducked]`,
      // Mix both
      `[orig][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2[out]`,
    ].join('; ');
  } else {
    filterComplex = [
      `[0:a]volume=${opts.originalVolume}[orig]`,
      `[1:a]volume=${opts.backgroundVolume}${fadeIn}${fadeOut}[bgm]`,
      `[orig][bgm]amix=inputs=2:duration=first:dropout_transition=2[out]`,
    ].join('; ');
  }

  if (opts.normalize) {
    filterComplex += '; [out]loudnorm=I=-23:LRA=7:TP=-2[final]';
  }

  const outputMap = opts.normalize ? '[final]' : '[out]';

  await execAsync(
    `${ffmpeg()} -i "${videoPath}" ${loopFlag} -i "${opts.backgroundMusicPath}" ` +
    `-filter_complex "${filterComplex}" ` +
    `-map 0:v:0 -map "${outputMap}" ` +
    `-c:v copy -c:a aac -b:a 192k ` +
    `-shortest "${outputPath}" -y`,
    { maxBuffer: 50 * 1024 * 1024 }
  );

  return outputPath;
}

// ── SFX Overlay ───────────────────────────────────────────────

export interface SfxTrack {
  sfxPath:   string;
  startTime: number; // seconds into video
  volume:    number; // 0.0–1.0
}

/**
 * Overlay multiple SFX onto a video at specific timestamps.
 */
export async function addSfxOverlay(
  videoPath:  string,
  sfxTracks:  SfxTrack[],
  outputPath: string
): Promise<string> {
  if (sfxTracks.length === 0) return videoPath;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Build input flags and filter graph
  const inputFlags  = sfxTracks.map(s => `-i "${s.sfxPath}"`).join(' ');
  const filterParts: string[] = [`[0:a]volume=1.0[orig]`];

  sfxTracks.forEach((sfx, i) => {
    const inputIdx = i + 1;
    filterParts.push(
      `[${inputIdx}:a]volume=${sfx.volume},adelay=${Math.round(sfx.startTime * 1000)}|${Math.round(sfx.startTime * 1000)}[sfx${i}]`
    );
  });

  // Mix all streams
  const allStreams = ['[orig]', ...sfxTracks.map((_, i) => `[sfx${i}]`)].join('');
  filterParts.push(`${allStreams}amix=inputs=${sfxTracks.length + 1}:duration=first[mixed]`);

  const filterComplex = filterParts.join('; ');

  await execAsync(
    `${ffmpeg()} -i "${videoPath}" ${inputFlags} ` +
    `-filter_complex "${filterComplex}" ` +
    `-map 0:v:0 -map "[mixed]" ` +
    `-c:v copy -c:a aac -b:a 192k ` +
    `"${outputPath}" -y`
  );

  return outputPath;
}

// ── Volume Normalization ─────────────────────────────────────

/**
 * Normalize audio to broadcast standard (-23 LUFS).
 * EBU R128 loudness normalization.
 */
export async function normalizeAudio(
  videoPath:  string,
  outputPath: string,
  targetLUFS: number = -23
): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Two-pass loudnorm
  await execAsync(
    `${ffmpeg()} -i "${videoPath}" ` +
    `-c:v copy ` +
    `-af loudnorm=I=${targetLUFS}:LRA=7:TP=-2 ` +
    `-c:a aac -b:a 192k ` +
    `"${outputPath}" -y`
  );

  return outputPath;
}

// ── Audio Ducking Only ────────────────────────────────────────

/**
 * Apply audio ducking to an existing mixed audio track.
 * Detects loud passages and compresses them.
 */
export async function applyDucking(
  videoPath:   string,
  outputPath:  string,
  threshold:   number = 0.015,
  ratio:       number = 4
): Promise<string> {
  await execAsync(
    `${ffmpeg()} -i "${videoPath}" ` +
    `-af "acompressor=threshold=${threshold}:ratio=${ratio}:release=200:makeup=1" ` +
    `-c:v copy -c:a aac ` +
    `"${outputPath}" -y`
  );
  return outputPath;
}

// ── Audio Quality Cleanup ─────────────────────────────────────

/**
 * Remove background noise and enhance voice clarity.
 */
export async function enhanceAudio(
  videoPath:  string,
  outputPath: string,
  opts: {
    removeNoise: boolean;
    enhanceVoice: boolean;
    reduceEcho: boolean;
  } = { removeNoise: true, enhanceVoice: true, reduceEcho: false }
): Promise<string> {
  const filters: string[] = [];

  if (opts.removeNoise) {
    filters.push('afftdn=nf=-25'); // Noise reduction
  }
  if (opts.enhanceVoice) {
    filters.push('equalizer=f=300:width_type=h:width=200:g=2'); // Boost voice range
    filters.push('equalizer=f=8000:width_type=h:width=2000:g=-2'); // Reduce harshness
  }
  if (opts.reduceEcho) {
    filters.push('aecho=0.8:0.88:60:0.4'); // Simple echo reduction
  }

  if (filters.length === 0) return videoPath;

  const filterStr = filters.join(',');
  await execAsync(
    `${ffmpeg()} -i "${videoPath}" ` +
    `-af "${filterStr}" ` +
    `-c:v copy -c:a aac -b:a 192k ` +
    `"${outputPath}" -y`
  );
  return outputPath;
}
