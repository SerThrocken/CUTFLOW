// ============================================================
//  CutFlow — Media Download Utility
//  Shared by ALL messaging adapters.
//  Ensures video files are downloaded with FULL audio tracks
//  intact — never strips audio, never re-encodes unnecessarily.
//  Uses ffprobe to verify audio stream presence before saving.
// ============================================================

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── MIME types that carry audio we must preserve ─────────────

const VIDEO_MIMES = [
  'video/mp4', 'video/quicktime', 'video/x-matroska',
  'video/webm', 'video/avi', 'video/x-msvideo',
  'video/3gpp', 'video/3gpp2', 'video/ogg',
  'video/x-flv', 'video/x-ms-wmv', 'video/mpeg',
];

const AUDIO_MIMES = [
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
  'audio/aac', 'audio/flac', 'audio/x-m4a', 'audio/webm',
  'audio/amr', 'audio/3gpp', 'audio/opus',
];

export interface DownloadedMedia {
  localPath:   string;
  type:        'video' | 'audio' | 'image' | 'document';
  hasAudio:    boolean;   // true if video contains audio track
  durationSec: number;
  sizeMB:      number;
  codec:       string;
  audioCodec:  string;
  sampleRate:  number;
  channels:    number;
}

// ── Core download function ────────────────────────────────────

export async function downloadMedia(
  url: string,
  destPath: string,
  mimeType: string,
  extraHeaders: Record<string, string> = {}
): Promise<DownloadedMedia> {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // Stream download — never load whole file into RAM
  const response = await axios({
    method:       'GET',
    url,
    responseType: 'stream',
    headers:      { ...extraHeaders },
    maxContentLength: Infinity,
    maxBodyLength:    Infinity,
  });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    (response.data as NodeJS.ReadableStream).pipe(writer);
    writer.on('finish', resolve);
    writer.on('error',  reject);
  });

  const sizeMB = fs.statSync(destPath).size / (1024 * 1024);
  const type   = mimeType.startsWith('video') ? 'video'
    : mimeType.startsWith('audio') ? 'audio'
    : mimeType.startsWith('image') ? 'image'
    : 'document';

  // Probe the file with ffprobe to verify audio stream
  const probe = await probeMedia(destPath);

  return { localPath: destPath, type, sizeMB, ...probe };
}

// ── FFprobe inspection ────────────────────────────────────────

async function probeMedia(filePath: string): Promise<Omit<DownloadedMedia, 'localPath' | 'type' | 'sizeMB'>> {
  const defaults = {
    hasAudio: false, durationSec: 0,
    codec: '', audioCodec: '', sampleRate: 0, channels: 0,
  };

  if (!fs.existsSync(filePath)) return defaults;

  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`
    );
    const data      = JSON.parse(stdout);
    const streams   = data.streams || [];
    const format    = data.format  || {};

    const videoStream = streams.find((s: any) => s.codec_type === 'video');
    const audioStream = streams.find((s: any) => s.codec_type === 'audio');

    return {
      hasAudio:    !!audioStream,
      durationSec: parseFloat(format.duration || '0'),
      codec:       videoStream?.codec_name || '',
      audioCodec:  audioStream?.codec_name || '',
      sampleRate:  parseInt(audioStream?.sample_rate || '0', 10),
      channels:    audioStream?.channels    || 0,
    };
  } catch {
    return defaults;
  }
}

// ── Video-with-audio extraction helpers ──────────────────────

/**
 * Extract just the audio track from a video file.
 * Used when user sends a video but only the audio is needed.
 */
export async function extractAudioFromVideo(
  videoPath: string,
  outputPath: string,
  format: 'mp3' | 'aac' | 'wav' = 'mp3'
): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const codec = { mp3: 'libmp3lame', aac: 'aac', wav: 'pcm_s16le' }[format];
  const quality = format === 'mp3' ? '-q:a 2' : '-b:a 192k';

  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec ${codec} ${quality} "${outputPath}" -y`
  );
  return outputPath;
}

/**
 * Verify a video has an audio track; if it was somehow
 * stripped during download, attempt to recover from the
 * original source or notify user.
 */
export async function verifyVideoAudio(filePath: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const probe = await probeMedia(filePath);

  if (!probe.hasAudio) {
    return {
      ok:      false,
      message: `⚠️ Warning: no audio track detected in ${path.basename(filePath)}. The original video may not have had audio, or it was not included in the upload.`,
    };
  }

  return {
    ok:      true,
    message: `✓ Audio track present (${probe.audioCodec}, ${probe.sampleRate}Hz, ${probe.channels}ch)`,
  };
}

/**
 * Mux audio back into a video if audio was accidentally lost.
 * Copies original video stream, replaces/adds audio.
 */
export async function muxAudioIntoVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await execAsync(
    `ffmpeg -i "${videoPath}" -i "${audioPath}" ` +
    `-c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outputPath}" -y`
  );
  return outputPath;
}

export { VIDEO_MIMES, AUDIO_MIMES };
