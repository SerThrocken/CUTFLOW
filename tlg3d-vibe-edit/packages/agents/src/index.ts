// ============================================================
//  CutFlow — Agents Package
//  All 8 agentic skills as standalone modules.
//  Each exports execute(ctx: SkillContext): Promise<SkillResult>
//  and can be loaded by the skill-loader sandbox at runtime.
// ============================================================

import type { SkillContext, SkillResult } from '../marketplace/src/skill-manifest';
import axios from 'axios';
import fs    from 'fs';
import path  from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ffmpeg    = () => process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe   = () => process.env.FFPROBE_PATH || 'ffprobe';

// ── 1. Script Generation Skill ────────────────────────────────

export async function scriptGenerationSkill(ctx: SkillContext): Promise<SkillResult> {
  const { prompt = 'Create a 60-second promotional video script', style = 'professional' } = ctx.config;

  ctx.log(`Generating script: "${prompt}"`);

  const systemPrompt = `You are a professional video scriptwriter for CutFlow by TLG3D.
Generate a well-structured ${style} video script with:
- Scene descriptions
- Dialogue / narration
- Timing notes (in seconds)
- Visual direction
Format clearly with [SCENE], [NARRATION], [VISUAL], [TIMING] markers.`;

  try {
    const script = await ctx.llmRouter.chat(
      process.env.LLM_PRIMARY_PROVIDER || 'openrouter',
      process.env.LLM_SCRIPT_MODEL     || 'meta-llama/llama-3-8b-instruct',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.7, maxTokens: 2000 }
    );

    // Save to project
    const scriptPath = path.join(ctx.projectPath, 'assets', 'scripts', `script_${Date.now()}.txt`);
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, script);

    ctx.emit('script-generated', { projectId: ctx.projectId, scriptPath });
    return { success: true, outputFiles: [scriptPath], data: { script } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── 2. Scene Detection Skill ──────────────────────────────────

export async function sceneDetectionSkill(ctx: SkillContext): Promise<SkillResult> {
  const { threshold = 0.3 } = ctx.config;
  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');

  if (!fs.existsSync(videoDir)) {
    return { success: false, error: 'No videos found in project' };
  }

  const videoFiles = fs.readdirSync(videoDir)
    .filter(f => /\.(mp4|mov|mkv|avi|webm)$/i.test(f));

  if (!videoFiles.length) {
    return { success: false, error: 'No video files found' };
  }

  const results: any[] = [];

  for (const file of videoFiles) {
    const videoPath = path.join(videoDir, file);
    ctx.log(`Detecting scenes in: ${file}`);

    try {
      const { stdout, stderr } = await execAsync(
        `${ffmpeg()} -i "${videoPath}" -vf "select='gt(scene\\,${threshold})',showinfo" -f null - 2>&1`
      );

      const output     = stderr + stdout;
      const timestamps: number[] = [];

      for (const line of output.split('\n')) {
        if (line.includes('pts_time:')) {
          const match = line.match(/pts_time:([\d.]+)/);
          if (match) timestamps.push(parseFloat(match[1]));
        }
      }

      // Also get total duration
      const probeOut = await execAsync(
        `${ffprobe()} -v error -show_format -show_streams -of json "${videoPath}"`
      );
      const probeData = JSON.parse(probeOut.stdout);
      const duration  = parseFloat(probeData.format?.duration || '0');

      results.push({ file, timestamps, duration, sceneCount: timestamps.length + 1 });
    } catch (err) {
      results.push({ file, error: (err as Error).message });
    }
  }

  // Save scene data to project
  const scenePath = path.join(ctx.projectPath, 'processing', 'scenes.json');
  fs.mkdirSync(path.dirname(scenePath), { recursive: true });
  fs.writeFileSync(scenePath, JSON.stringify(results, null, 2));

  ctx.emit('scenes-detected', { projectId: ctx.projectId, results });
  return {
    success:     true,
    outputFiles: [scenePath],
    data:        { scenes: results, totalScenes: results.reduce((s, r) => s + (r.sceneCount || 0), 0) },
  };
}

// ── 3. Auto Color Correction Skill ───────────────────────────

export async function autoColorCorrectionSkill(ctx: SkillContext): Promise<SkillResult> {
  const {
    preset   = 'cinematic',
    strength = 0.8,
  } = ctx.config;

  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');
  const outDir   = path.join(ctx.projectPath, 'processing');
  fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(videoDir)) {
    return { success: false, error: 'No videos directory in project' };
  }

  const videoFiles = fs.readdirSync(videoDir)
    .filter(f => /\.(mp4|mov|mkv|avi|webm)$/i.test(f));

  if (!videoFiles.length) {
    return { success: false, error: 'No video files found' };
  }

  const filterMap: Record<string, string> = {
    cinematic: `curves=r='0/0 0.25/0.22 0.75/0.8 1/1':g='0/0 0.5/0.48 1/1':b='0/0.05 1/0.95',eq=contrast=1.1:saturation=1.15`,
    warm:      `colorbalance=rs=0.15:gs=0.05:bs=-0.1,eq=saturation=1.1`,
    cool:      `colorbalance=rs=-0.1:gs=0:bs=0.15,eq=saturation=0.95`,
    vintage:   `hue=h=10:s=0.8,curves=r='0/0.05 1/0.95':b='0/0 1/0.85',vignette`,
    vivid:     `eq=saturation=1.4:contrast=1.1:brightness=0.02`,
    bw:        `colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3`,
    matte:     `curves=all='0/0.05 0.5/0.5 1/0.95'`,
    horror:    `colorchannelmixer=1.2:0:0:0:0:0.8:0:0:0:0:0.5:0,vignette`,
    neutral:   `eq=saturation=1.0:contrast=1.0`,
  };

  const filter = filterMap[preset] || filterMap.neutral;
  const outputs: string[] = [];

  for (const file of videoFiles) {
    const inputPath  = path.join(videoDir, file);
    const outputPath = path.join(outDir, `graded_${preset}_${file}`);

    ctx.log(`Applying ${preset} grade to: ${file}`);

    try {
      await execAsync(
        `${ffmpeg()} -i "${inputPath}" -vf "${filter}" ` +
        `-c:v libx264 -preset fast -crf 22 -c:a copy "${outputPath}" -y`
      );
      outputs.push(outputPath);
    } catch (err) {
      ctx.log(`Warning: Color grade failed for ${file}: ${(err as Error).message}`);
    }
  }

  ctx.emit('color-correction-complete', { projectId: ctx.projectId, outputs });
  return { success: true, outputFiles: outputs, data: { preset, filesProcessed: outputs.length } };
}

// ── 4. Subtitle Generation Skill ─────────────────────────────

export async function subtitleGenerationSkill(ctx: SkillContext): Promise<SkillResult> {
  const { language = 'en', style = 'tiktok-bold', fontSize = 48 } = ctx.config;

  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');
  if (!fs.existsSync(videoDir)) {
    return { success: false, error: 'No videos found in project' };
  }

  const videoFiles = fs.readdirSync(videoDir).filter(f => /\.(mp4|mov|mkv)$/i.test(f));
  if (!videoFiles.length) return { success: false, error: 'No video files found' };

  const outputs: string[] = [];
  const openaiKey = process.env.OPENAI_API_KEY;

  for (const file of videoFiles) {
    const videoPath  = path.join(videoDir, file);
    const srtPath    = path.join(ctx.projectPath, 'processing', `${path.basename(file, path.extname(file))}.srt`);
    const outputPath = path.join(ctx.projectPath, 'output', `captioned_${file}`);

    ctx.log(`Generating subtitles for: ${file}`);
    fs.mkdirSync(path.dirname(srtPath), { recursive: true });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    try {
      let srtContent = '';

      if (openaiKey) {
        // Use Whisper via OpenAI
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('file',            fs.createReadStream(videoPath));
        form.append('model',           'whisper-1');
        form.append('language',        language);
        form.append('response_format', 'srt');

        const res = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          form,
          { headers: { ...form.getHeaders(), Authorization: `Bearer ${openaiKey}` } }
        );
        srtContent = res.data;
      } else {
        // Placeholder SRT if no API key
        srtContent = `1\n00:00:00,000 --> 00:00:05,000\n[Auto-captions — set OPENAI_API_KEY for real transcription]\n\n`;
      }

      fs.writeFileSync(srtPath, srtContent);

      // Burn subtitles onto video with FFmpeg
      const fontColor = style === 'tiktok-bold' ? 'yellow' : style === 'horror' ? 'red' : 'white';
      const borderW   = style === 'tiktok-bold' ? 3 : style === 'mrbeast' ? 5 : 2;
      const fontName  = style === 'aesthetic' ? 'Georgia' : 'Arial';

      const subtitleFilter = `subtitles='${srtPath.replace(/\\/g, '/')}':force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=&H00${fontColor === 'yellow' ? 'FFFF00' : 'FFFFFF'}&,OutlineColour=&H00000000&,BorderStyle=3,Outline=${borderW},Shadow=0,Alignment=2,MarginV=30'`;

      await execAsync(
        `${ffmpeg()} -i "${videoPath}" -vf "${subtitleFilter}" -c:a copy "${outputPath}" -y`
      );

      outputs.push(outputPath);
    } catch (err) {
      ctx.log(`Subtitle generation failed for ${file}: ${(err as Error).message}`);
    }
  }

  ctx.emit('subtitles-generated', { projectId: ctx.projectId, outputs });
  return { success: true, outputFiles: outputs, data: { filesProcessed: outputs.length } };
}

// ── 5. Voiceover Synthesis Skill ──────────────────────────────

export async function voiceoverSynthesisSkill(ctx: SkillContext): Promise<SkillResult> {
  const {
    text   = '',
    voice  = '21m00Tcm4TlvDq8ikWAM',
    speed  = 1.0,
    scriptPath = '',
  } = ctx.config;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { success: false, error: 'ELEVENLABS_API_KEY not set' };

  // Use provided text or read from script file
  let content = text;
  if (!content && scriptPath && fs.existsSync(scriptPath)) {
    content = fs.readFileSync(scriptPath, 'utf-8');
    // Strip stage directions — only keep narration
    content = content.replace(/\[SCENE\][^\n]*/g, '')
                     .replace(/\[VISUAL\][^\n]*/g, '')
                     .replace(/\[TIMING\][^\n]*/g, '')
                     .replace(/\[.*?\]/g, '')
                     .trim();
  }

  if (!content) return { success: false, error: 'No text provided for voiceover' };

  ctx.log(`Synthesizing voiceover: "${content.slice(0, 60)}..."`);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method:  'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          text: content,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `ElevenLabs error: ${err}` };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioDir    = path.join(ctx.projectPath, 'assets', 'audio');
    fs.mkdirSync(audioDir, { recursive: true });

    const audioPath = path.join(audioDir, `voiceover_${Date.now()}.mp3`);
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

    ctx.emit('voiceover-generated', { projectId: ctx.projectId, audioPath });
    return { success: true, outputFiles: [audioPath], data: { duration: content.length / 15 } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── 6. Motion Smoothing Skill ─────────────────────────────────

export async function motionSmoothingSkill(ctx: SkillContext): Promise<SkillResult> {
  const { strength = 'medium', fps = 60 } = ctx.config;

  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');
  const outDir   = path.join(ctx.projectPath, 'processing');
  fs.mkdirSync(outDir, { recursive: true });

  const videoFiles = fs.existsSync(videoDir)
    ? fs.readdirSync(videoDir).filter(f => /\.(mp4|mov|mkv)$/i.test(f))
    : [];

  if (!videoFiles.length) return { success: false, error: 'No video files found' };

  // vidstab requires two-pass approach
  const shakiness = strength === 'strong' ? 10 : strength === 'medium' ? 5 : 2;
  const smoothing = strength === 'strong' ? 30 : strength === 'medium' ? 15 : 5;
  const outputs: string[] = [];

  for (const file of videoFiles) {
    const inputPath   = path.join(videoDir, file);
    const transformsPath = path.join(outDir, `${file}.trf`);
    const outputPath  = path.join(outDir, `smooth_${file}`);

    ctx.log(`Motion smoothing: ${file} (${strength})`);

    try {
      // Pass 1: analyse
      await execAsync(
        `${ffmpeg()} -i "${inputPath}" -vf "vidstabdetect=shakiness=${shakiness}:accuracy=15:result='${transformsPath}'" -f null - -y`
      );

      // Pass 2: apply stabilization + optional interpolation for smoother motion
      const interpFilter = fps > 30
        ? `minterpolate=fps=${fps}:mi_mode=mci:mc_mode=aobmc:vsbmc=1,`
        : '';

      await execAsync(
        `${ffmpeg()} -i "${inputPath}" -vf "${interpFilter}vidstabtransform=input='${transformsPath}':smoothing=${smoothing}:crop=black" ` +
        `-c:v libx264 -preset fast -crf 22 -c:a copy "${outputPath}" -y`
      );

      outputs.push(outputPath);
    } catch (err) {
      ctx.log(`Motion smoothing failed for ${file}: ${(err as Error).message}`);
    }
  }

  ctx.emit('motion-smoothing-complete', { projectId: ctx.projectId, outputs });
  return { success: true, outputFiles: outputs, data: { filesProcessed: outputs.length } };
}

// ── 7. Auto Editing Skill ─────────────────────────────────────

export async function autoEditingSkill(ctx: SkillContext): Promise<SkillResult> {
  const {
    style          = 'dynamic',
    targetDuration = 60,
    musicPath      = '',
  } = ctx.config;

  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');
  const outDir   = path.join(ctx.projectPath, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(videoDir)) return { success: false, error: 'No videos directory' };

  const videoFiles = fs.readdirSync(videoDir).filter(f => /\.(mp4|mov|mkv)$/i.test(f));
  if (!videoFiles.length) return { success: false, error: 'No video files found' };

  ctx.log(`Auto-editing ${videoFiles.length} clips into ${targetDuration}s ${style} edit`);

  try {
    // Step 1: probe all clips
    const clipInfos: { path: string; duration: number }[] = [];
    for (const file of videoFiles) {
      const fp  = path.join(videoDir, file);
      const out = await execAsync(
        `${ffprobe()} -v error -show_entries format=duration -of json "${fp}"`
      );
      const duration = parseFloat(JSON.parse(out.stdout).format?.duration || '10');
      clipInfos.push({ path: fp, duration });
    }

    const totalSource = clipInfos.reduce((s, c) => s + c.duration, 0);
    const ratio       = Math.min(1, targetDuration / totalSource);

    // Step 2: Trim each clip proportionally
    const trimmedDir = path.join(ctx.projectPath, 'processing', 'auto_edit_clips');
    fs.mkdirSync(trimmedDir, { recursive: true });
    const trimmedPaths: string[] = [];

    for (let i = 0; i < clipInfos.length; i++) {
      const clip      = clipInfos[i];
      const clipDur   = clip.duration * ratio;
      const outPath   = path.join(trimmedDir, `clip_${i}.mp4`);

      await execAsync(
        `${ffmpeg()} -i "${clip.path}" -t ${clipDur.toFixed(2)} ` +
        `-c:v libx264 -preset fast -crf 22 -c:a aac "${outPath}" -y`
      );
      trimmedPaths.push(outPath);
    }

    // Step 3: Concatenate
    const concatFile = path.join(ctx.projectPath, 'processing', 'concat.txt');
    fs.writeFileSync(concatFile, trimmedPaths.map(p => `file '${p}'`).join('\n'));

    const concatOutput = path.join(ctx.projectPath, 'processing', 'concat_raw.mp4');
    await execAsync(
      `${ffmpeg()} -f concat -safe 0 -i "${concatFile}" -c copy "${concatOutput}" -y`
    );

    // Step 4: Apply style-based color grade
    const gradeFilter: Record<string, string> = {
      dynamic:    `eq=contrast=1.1:saturation=1.2`,
      cinematic:  `curves=r='0/0 0.25/0.22 0.75/0.8 1/1':g='0/0 0.5/0.48 1/1':b='0/0.05 1/0.95'`,
      minimal:    `eq=saturation=0.9:contrast=1.0`,
      energetic:  `eq=saturation=1.4:contrast=1.2:brightness=0.02`,
    };

    const filter    = gradeFilter[style] || gradeFilter.dynamic;
    const finalPath = path.join(outDir, `auto_edit_${style}_${Date.now()}.mp4`);

    // Step 5: Add music if provided, then grade
    if (musicPath && fs.existsSync(musicPath)) {
      await execAsync(
        `${ffmpeg()} -i "${concatOutput}" -stream_loop -1 -i "${musicPath}" ` +
        `-vf "${filter}" ` +
        `-filter_complex "[0:a]volume=0.3[orig];[1:a]volume=0.4[bgm];[orig][bgm]amix=inputs=2:duration=first[mixed]" ` +
        `-map 0:v -map "[mixed]" -c:v libx264 -preset fast -crf 22 -c:a aac -shortest "${finalPath}" -y`
      );
    } else {
      await execAsync(
        `${ffmpeg()} -i "${concatOutput}" -vf "${filter}" ` +
        `-c:v libx264 -preset fast -crf 22 -c:a copy "${finalPath}" -y`
      );
    }

    ctx.emit('auto-edit-complete', { projectId: ctx.projectId, outputPath: finalPath });
    return { success: true, outputFiles: [finalPath], data: { style, duration: targetDuration } };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── 8. Engagement Predictor Skill ────────────────────────────

export async function engagementPredictorSkill(ctx: SkillContext): Promise<SkillResult> {
  const { targetPlatform = 'all', contentType = 'entertainment' } = ctx.config;

  const videoDir = path.join(ctx.projectPath, 'assets', 'videos');
  const videoFiles = fs.existsSync(videoDir)
    ? fs.readdirSync(videoDir).filter(f => /\.(mp4|mov|mkv)$/i.test(f))
    : [];

  ctx.log(`Predicting engagement for ${videoFiles.length} clips`);

  // Probe each video for signals
  const signals: any[] = [];
  for (const file of videoFiles) {
    const fp = path.join(videoDir, file);
    try {
      const out      = await execAsync(`${ffprobe()} -v error -show_streams -show_format -of json "${fp}"`);
      const data     = JSON.parse(out.stdout);
      const duration = parseFloat(data.format?.duration || '0');
      const hasAudio = data.streams?.some((s: any) => s.codec_type === 'audio') || false;
      signals.push({ file, duration, hasAudio });
    } catch {}
  }

  // Use LLM to evaluate and give recommendations
  const signalSummary = signals.map(s =>
    `- ${s.file}: ${s.duration.toFixed(1)}s, audio: ${s.hasAudio}`
  ).join('\n');

  const prompt = `You are a social media video engagement expert.
Analyze this video project for ${targetPlatform} (${contentType} content):

${signalSummary || 'No video files yet.'}

Provide:
1. Estimated engagement score (0-100) for each platform
2. Hook strength rating (0-10)
3. Pacing assessment
4. Top 5 specific improvement suggestions
5. Optimal post time recommendation

Format as structured analysis.`;

  let analysis = '';
  try {
    analysis = await ctx.llmRouter.chat(
      process.env.LLM_PRIMARY_PROVIDER || 'openrouter',
      'meta-llama/llama-3-8b-instruct',
      [
        { role: 'system', content: 'You are a video engagement analyst for TLG3D CutFlow.' },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.5, maxTokens: 1200 }
    );
  } catch (err) {
    analysis = 'LLM analysis unavailable — check your API key configuration.';
  }

  const reportPath = path.join(ctx.projectPath, 'processing', `engagement_report_${Date.now()}.txt`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, analysis);

  ctx.emit('engagement-report-ready', { projectId: ctx.projectId, reportPath });
  return { success: true, outputFiles: [reportPath], data: { analysis } };
}

// ── Skill registry export ─────────────────────────────────────

export const AGENTS = {
  'script-generation':    scriptGenerationSkill,
  'scene-detection':      sceneDetectionSkill,
  'auto-color-correction':autoColorCorrectionSkill,
  'subtitle-generation':  subtitleGenerationSkill,
  'voiceover-synthesis':  voiceoverSynthesisSkill,
  'motion-smoothing':     motionSmoothingSkill,
  'auto-editing':         autoEditingSkill,
  'engagement-predictor': engagementPredictorSkill,
};

export type AgentId = keyof typeof AGENTS;

export async function runAgent(id: AgentId, ctx: SkillContext): Promise<SkillResult> {
  const agent = AGENTS[id];
  if (!agent) return { success: false, error: `Agent not found: ${id}` };
  return agent(ctx);
}
