// ============================================================
//  TLG3D Marketplace — Default Skills Catalog
//  12 production-ready skills across all categories
// ============================================================

import type { SkillManifest } from './skill-manifest';

export const MARKETPLACE_SKILLS: SkillManifest[] = [

  // ── 1. Auto Reframe ────────────────────────────────────────
  {
    id:          'auto-reframe',
    name:        'Auto Reframe',
    version:     '1.0.0',
    description: 'Automatically reframe videos for any aspect ratio — 9:16, 1:1, 4:5, 16:9',
    longDescription: `**Auto Reframe** uses AI subject tracking to intelligently crop and reframe
your video for any social media platform. Perfect for repurposing landscape footage as TikTok,
Instagram Reels, or YouTube Shorts.

**Features:**
- Subject-aware smart crop (keeps faces and action in frame)
- Supports 9:16, 1:1, 4:5, 16:9, and custom ratios
- Smooth motion tracking — no jarring cuts
- Batch process entire project timeline`,
    author:      'TLG3D Team',
    category:    'ai-video',
    tags:        ['reframe', 'crop', 'tiktok', 'shorts', 'reels', 'aspect-ratio', 'portrait'],
    icon:        '🎯',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'aspectRatio', label: 'Target Aspect Ratio', type: 'select',
        options: [
          { label: '9:16 (TikTok / Reels)', value: '9:16' },
          { label: '1:1 (Instagram Square)', value: '1:1' },
          { label: '4:5 (Instagram Portrait)', value: '4:5' },
          { label: '16:9 (YouTube)', value: '16:9' },
        ],
        defaultValue: '9:16', required: true,
      },
      {
        key: 'trackingMode', label: 'Tracking Mode', type: 'select',
        options: [
          { label: 'Face Detection', value: 'face' },
          { label: 'Motion Tracking', value: 'motion' },
          { label: 'Center Crop', value: 'center' },
        ],
        defaultValue: 'face',
      },
      {
        key: 'smoothness', label: 'Tracking Smoothness', type: 'range',
        min: 1, max: 10, step: 1, defaultValue: 7,
        description: 'Higher = smoother pan, lower = tighter tracking',
      },
    ],
  },

  // ── 2. AI Script to Storyboard ─────────────────────────────
  {
    id:          'script-to-storyboard',
    name:        'Script to Storyboard',
    version:     '1.0.0',
    description: 'Convert any video script into a visual storyboard with shot suggestions',
    longDescription: `**Script to Storyboard** reads your generated script and uses AI to break it
into shots, suggest camera angles, describe visuals, and output a full storyboard PDF.

**Features:**
- Parse scripts into individual scenes and shots
- AI-suggested camera angles (close-up, wide, POV, etc.)
- Visual description for each shot
- Export to PDF storyboard or JSON for further editing
- Works with TLG3D script generator output`,
    author:      'TLG3D Team',
    category:    'ai-video',
    tags:        ['storyboard', 'script', 'planning', 'shots', 'pre-production'],
    icon:        '🎬',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'network', 'llm'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'style', label: 'Storyboard Style', type: 'select',
        options: [
          { label: 'Detailed (more AI prompts)', value: 'detailed' },
          { label: 'Simple (shot descriptions only)', value: 'simple' },
        ],
        defaultValue: 'detailed',
      },
      {
        key: 'exportFormat', label: 'Export Format', type: 'select',
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Markdown', value: 'md' },
          { label: 'PDF', value: 'pdf' },
        ],
        defaultValue: 'json',
      },
    ],
  },

  // ── 3. Viral Caption Generator ─────────────────────────────
  {
    id:          'viral-captions',
    name:        'Viral Caption Generator',
    version:     '1.2.0',
    description: 'Auto-generate animated captions styled like viral TikTok and Reels videos',
    longDescription: `**Viral Caption Generator** transcribes your video audio and renders
animated word-by-word captions in popular viral styles — bold, colorful, and perfectly timed.

**Caption Styles:**
- TikTok Bold (yellow + white, word pop)
- MrBeast (oversized, multi-color)
- Podcast (clean subtitle strip)
- Aesthetic (minimal, pastel)
- Horror (shaky, red highlight)
- Custom (bring your own colors and fonts)

**Features:**
- Whisper AI transcription (local or API)
- Word-level timing for karaoke-style animations
- Emoji auto-insertion
- Profanity filter (optional)
- Multi-language support`,
    author:      'TLG3D Team',
    category:    'text-captions',
    tags:        ['captions', 'subtitles', 'tiktok', 'viral', 'animated', 'transcription'],
    icon:        '💬',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg', 'network'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'style', label: 'Caption Style', type: 'select',
        options: [
          { label: 'TikTok Bold', value: 'tiktok-bold' },
          { label: 'MrBeast', value: 'mrbeast' },
          { label: 'Podcast Clean', value: 'podcast' },
          { label: 'Aesthetic', value: 'aesthetic' },
          { label: 'Horror', value: 'horror' },
          { label: 'Custom', value: 'custom' },
        ],
        defaultValue: 'tiktok-bold', required: true,
      },
      {
        key: 'primaryColor', label: 'Primary Color', type: 'color',
        defaultValue: '#FFFF00',
      },
      {
        key: 'secondaryColor', label: 'Secondary Color', type: 'color',
        defaultValue: '#FFFFFF',
      },
      {
        key: 'fontSize', label: 'Font Size', type: 'range',
        min: 20, max: 80, step: 2, defaultValue: 48,
      },
      {
        key: 'position', label: 'Caption Position', type: 'select',
        options: [
          { label: 'Center', value: 'center' },
          { label: 'Bottom', value: 'bottom' },
          { label: 'Top', value: 'top' },
        ],
        defaultValue: 'center',
      },
      {
        key: 'emojiMode', label: 'Auto-insert Emojis', type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'profanityFilter', label: 'Profanity Filter', type: 'boolean',
        defaultValue: false,
      },
    ],
  },

  // ── 4. Beat Sync Edit ──────────────────────────────────────
  {
    id:          'beat-sync-editor',
    name:        'Beat Sync Editor',
    version:     '1.0.0',
    description: 'Automatically cut and sync video clips to the beat of any music track',
    longDescription: `**Beat Sync Editor** analyzes the BPM and beat timestamps of a music track,
then automatically cuts your video clips at every beat, drop, or phrase boundary.

**Features:**
- Beat detection (tempo + downbeat + phrase)
- Auto-cut on every beat, half-beat, or phrase
- Flash / zoom / glitch effects on drops
- Multiple sync modes: hard cut, crossfade, zoom-punch
- Works with any audio file or project voiceover`,
    author:      'TLG3D Team',
    category:    'ai-audio',
    tags:        ['beat-sync', 'music', 'bpm', 'auto-cut', 'rhythm', 'edit'],
    icon:        '🎵',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg'],
    platforms:   ['windows', 'macos', 'linux'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'audioFile', label: 'Music Track', type: 'file',
        description: 'MP3 or WAV file to sync to',
        required: true,
      },
      {
        key: 'syncMode', label: 'Sync Mode', type: 'select',
        options: [
          { label: 'Hard Cut', value: 'hard' },
          { label: 'Crossfade', value: 'crossfade' },
          { label: 'Zoom Punch', value: 'zoom' },
          { label: 'Flash', value: 'flash' },
        ],
        defaultValue: 'hard',
      },
      {
        key: 'cutFrequency', label: 'Cut Every', type: 'select',
        options: [
          { label: 'Every Beat', value: 'beat' },
          { label: 'Every 2 Beats', value: '2beat' },
          { label: 'Every Bar (4 beats)', value: 'bar' },
          { label: 'Every Phrase (8 beats)', value: 'phrase' },
        ],
        defaultValue: 'beat',
      },
      {
        key: 'dropEffect', label: 'Drop Effect', type: 'select',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Flash White', value: 'flash-white' },
          { label: 'Zoom Burst', value: 'zoom-burst' },
          { label: 'Glitch', value: 'glitch' },
          { label: 'Shake', value: 'shake' },
        ],
        defaultValue: 'zoom-burst',
      },
    ],
  },

  // ── 5. AI Background Remover ───────────────────────────────
  {
    id:          'ai-background-remover',
    name:        'AI Background Remover',
    version:     '1.0.0',
    description: 'Remove or replace video backgrounds using AI segmentation — no green screen needed',
    longDescription: `**AI Background Remover** uses neural segmentation to detect and remove the
background from any video frame-by-frame. No green screen. No chroma key setup.

**Features:**
- Frame-by-frame AI segmentation
- Replace background with solid color, image, or video
- Edge feathering for natural look
- GPU-accelerated processing (CUDA / Metal)
- Outputs transparent WEBM or with custom background`,
    author:      'TLG3D Team',
    category:    'ai-video',
    tags:        ['background', 'remove', 'green-screen', 'segmentation', 'chroma-key', 'ai'],
    icon:        '✂️',
    screenshots: [],
    pricing:     { type: 'paid', price: 4.99, currency: 'USD' },
    runtime:     'python',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg', 'gpu', 'network'],
    platforms:   ['windows', 'macos', 'linux'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'backgroundType', label: 'Background Type', type: 'select',
        options: [
          { label: 'Transparent', value: 'transparent' },
          { label: 'Solid Color', value: 'color' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Blur Original', value: 'blur' },
        ],
        defaultValue: 'transparent', required: true,
      },
      {
        key: 'backgroundColor', label: 'Background Color', type: 'color',
        defaultValue: '#000000',
      },
      {
        key: 'backgroundFile', label: 'Background File (image or video)', type: 'file',
      },
      {
        key: 'edgeFeather', label: 'Edge Feather (px)', type: 'range',
        min: 0, max: 20, step: 1, defaultValue: 3,
      },
      {
        key: 'quality', label: 'Processing Quality', type: 'select',
        options: [
          { label: 'Fast (lower quality)', value: 'fast' },
          { label: 'Balanced', value: 'balanced' },
          { label: 'High Quality (slower)', value: 'high' },
        ],
        defaultValue: 'balanced',
      },
    ],
  },

  // ── 6. Voice Clone Voiceover ───────────────────────────────
  {
    id:          'voice-clone-voiceover',
    name:        'Voice Clone Voiceover',
    version:     '1.0.0',
    description: 'Clone any voice from a 30-second sample and generate unlimited voiceovers',
    longDescription: `**Voice Clone Voiceover** lets you record or upload a 30-second voice sample,
clone it using AI, then generate any text as audio in that voice.

**Features:**
- 30-second sample is enough
- Supports emotion control (neutral, excited, sad, whisper)
- Multi-language output
- Uses ElevenLabs or local TTS model
- Auto-syncs to video timeline`,
    author:      'TLG3D Team',
    category:    'ai-audio',
    tags:        ['voice-clone', 'tts', 'voiceover', 'elevenlabs', 'ai-audio'],
    icon:        '🎙️',
    screenshots: [],
    pricing:     { type: 'subscription', pricePerMonth: 9.99, currency: 'USD' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'network'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    false,
    configSchema: [
      {
        key: 'voiceSamplePath', label: 'Voice Sample (30s audio)', type: 'file',
        required: true,
      },
      {
        key: 'emotion', label: 'Emotion', type: 'select',
        options: [
          { label: 'Neutral', value: 'neutral' },
          { label: 'Excited', value: 'excited' },
          { label: 'Calm', value: 'calm' },
          { label: 'Whisper', value: 'whisper' },
          { label: 'Sad', value: 'sad' },
        ],
        defaultValue: 'neutral',
      },
      {
        key: 'speed', label: 'Speaking Speed', type: 'range',
        min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0,
      },
    ],
  },

  // ── 7. Social Media Auto Publisher ────────────────────────
  {
    id:          'social-auto-publisher',
    name:        'Social Media Auto Publisher',
    version:     '1.0.0',
    description: 'Schedule and auto-post finished videos to TikTok, Instagram, YouTube, and X',
    longDescription: `**Social Media Auto Publisher** connects to your social media accounts and
automatically posts completed video exports on your schedule.

**Supported Platforms:**
- TikTok (direct upload via API)
- Instagram (Reels + Feed)
- YouTube (Shorts + regular upload)
- X / Twitter (video posts)
- Facebook (Reels + posts)

**Features:**
- Schedule posts for optimal engagement times
- Auto-generate captions from video script
- Platform-specific formatting (aspect ratio, length limits)
- Hashtag suggestions via AI
- Post to multiple platforms simultaneously`,
    author:      'TLG3D Team',
    category:    'social',
    tags:        ['tiktok', 'instagram', 'youtube', 'publish', 'schedule', 'social-media'],
    icon:        '📤',
    screenshots: [],
    pricing:     { type: 'paid', price: 9.99, currency: 'USD' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'network', 'social'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'platforms', label: 'Post To', type: 'select',
        options: [
          { label: 'All Platforms', value: 'all' },
          { label: 'TikTok Only', value: 'tiktok' },
          { label: 'Instagram Only', value: 'instagram' },
          { label: 'YouTube Only', value: 'youtube' },
          { label: 'X / Twitter Only', value: 'twitter' },
        ],
        defaultValue: 'all', required: true,
      },
      {
        key: 'scheduleType', label: 'Post Timing', type: 'select',
        options: [
          { label: 'Post Immediately', value: 'immediate' },
          { label: 'Best Time (AI picks)', value: 'ai-optimal' },
          { label: 'Scheduled (pick date/time)', value: 'scheduled' },
        ],
        defaultValue: 'ai-optimal',
      },
      {
        key: 'autoCaption', label: 'Auto-Generate Caption', type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'autoHashtags', label: 'AI Hashtag Suggestions', type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'hashtagCount', label: 'Number of Hashtags', type: 'range',
        min: 0, max: 30, step: 1, defaultValue: 10,
      },
    ],
  },

  // ── 8. LUT Color Grader Pro ────────────────────────────────
  {
    id:          'lut-color-grader-pro',
    name:        'LUT Color Grader Pro',
    version:     '1.0.0',
    description: 'Apply professional film LUTs to any video — includes 50+ cinematic presets',
    longDescription: `**LUT Color Grader Pro** applies professional Look-Up Tables (LUTs) to your
videos for cinematic film aesthetics. Includes 50+ curated LUTs across multiple styles.

**Included LUT Packs:**
- Cinematic Film (10 LUTs) — inspired by major film stocks
- Golden Hour (8 LUTs) — warm, golden tones
- Moody Dark (8 LUTs) — deep shadows, muted tones
- Pastel Dream (6 LUTs) — soft, airy aesthetics
- Neon Night (6 LUTs) — vivid, cyberpunk look
- Clean Commercial (6 LUTs) — bright, professional
- B&W Classics (6 LUTs) — black and white film looks

**Features:**
- Import custom .cube LUT files
- Intensity control (0–100%)
- Preview in real-time
- Blend multiple LUTs`,
    author:      'TLG3D Team',
    category:    'color',
    tags:        ['lut', 'color-grade', 'cinematic', 'film', 'presets', 'color'],
    icon:        '🎨',
    screenshots: [],
    pricing:     { type: 'one-time', price: 7.99, currency: 'USD' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg'],
    platforms:   ['windows', 'macos', 'linux'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    false,
    configSchema: [
      {
        key: 'lutPreset', label: 'LUT Preset', type: 'select',
        options: [
          { label: 'Cinematic Orange & Teal', value: 'cinematic-ot' },
          { label: 'Golden Hour Warm', value: 'golden-hour' },
          { label: 'Moody Blue Shadow', value: 'moody-blue' },
          { label: 'Clean Commercial', value: 'clean-commercial' },
          { label: 'Pastel Aesthetic', value: 'pastel-dream' },
          { label: 'Neon Cyberpunk', value: 'neon-night' },
          { label: 'Classic B&W', value: 'bw-classic' },
          { label: 'Custom .cube File', value: 'custom' },
        ],
        defaultValue: 'cinematic-ot', required: true,
      },
      {
        key: 'customLutFile', label: 'Custom LUT File (.cube)', type: 'file',
      },
      {
        key: 'intensity', label: 'LUT Intensity (%)', type: 'range',
        min: 0, max: 100, step: 5, defaultValue: 80,
      },
    ],
  },

  // ── 9. AI Thumbnail Generator ──────────────────────────────
  {
    id:          'ai-thumbnail-generator',
    name:        'AI Thumbnail Generator',
    version:     '1.0.0',
    description: 'Generate click-worthy YouTube and social media thumbnails from your video frames',
    longDescription: `**AI Thumbnail Generator** extracts the best frames from your video,
adds compelling text overlays, and generates multiple thumbnail options for A/B testing.

**Features:**
- Extract top 5 best frames (AI-scored by visual quality + subject clarity)
- Add title text with custom fonts and glow effects
- Emoji and arrow overlays
- Generate 3 variants automatically
- Export at 1280x720 (YouTube) or platform-specific sizes
- Integrates with social publisher skill`,
    author:      'TLG3D Team',
    category:    'utility',
    tags:        ['thumbnail', 'youtube', 'click-through', 'title', 'preview', 'image'],
    icon:        '🖼️',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg', 'network'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    false,
    configSchema: [
      {
        key: 'titleText', label: 'Thumbnail Title', type: 'string',
        description: 'Leave blank to auto-generate from script',
      },
      {
        key: 'style', label: 'Thumbnail Style', type: 'select',
        options: [
          { label: 'YouTube Bold', value: 'youtube-bold' },
          { label: 'Minimal Clean', value: 'minimal' },
          { label: 'Reaction Face', value: 'reaction' },
          { label: 'Dark Cinematic', value: 'cinematic' },
        ],
        defaultValue: 'youtube-bold',
      },
      {
        key: 'variants', label: 'Generate Variants', type: 'range',
        min: 1, max: 5, step: 1, defaultValue: 3,
      },
      {
        key: 'includeEmoji', label: 'Include Emojis', type: 'boolean',
        defaultValue: true,
      },
    ],
  },

  // ── 10. Noise & Audio Cleanup ──────────────────────────────
  {
    id:          'audio-noise-cleaner',
    name:        'Audio Noise Cleaner',
    version:     '1.0.0',
    description: 'Remove background noise, hum, wind, and echo from any video audio track',
    longDescription: `**Audio Noise Cleaner** applies spectral noise reduction to remove
unwanted background sounds from your video's audio track.

**Removes:**
- Background hum (fans, AC, equipment)
- Wind and outdoor noise
- Room echo / reverb
- Microphone hiss
- Click and pop sounds

**Features:**
- Automatic noise profile detection
- Manual noise sample selection
- Adjustable reduction strength
- Preview before/after
- Non-destructive — keeps original as backup`,
    author:      'TLG3D Team',
    category:    'ai-audio',
    tags:        ['noise', 'audio', 'cleanup', 'background', 'hum', 'echo', 'reverb'],
    icon:        '🔇',
    screenshots: [],
    pricing:     { type: 'free' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg'],
    platforms:   ['windows', 'macos', 'linux'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    false,
    configSchema: [
      {
        key: 'reductionStrength', label: 'Noise Reduction Strength', type: 'range',
        min: 1, max: 10, step: 1, defaultValue: 6,
        description: 'Higher removes more noise but may affect voice quality',
      },
      {
        key: 'noiseType', label: 'Primary Noise Type', type: 'select',
        options: [
          { label: 'Auto Detect', value: 'auto' },
          { label: 'Background Hum', value: 'hum' },
          { label: 'Wind', value: 'wind' },
          { label: 'Room Echo', value: 'echo' },
          { label: 'Hiss', value: 'hiss' },
        ],
        defaultValue: 'auto',
      },
      {
        key: 'keepOriginalTrack', label: 'Keep Original Track as Backup', type: 'boolean',
        defaultValue: true,
      },
    ],
  },

  // ── 11. Multi-Cam Sync ─────────────────────────────────────
  {
    id:          'multi-cam-sync',
    name:        'Multi-Cam Sync',
    version:     '1.0.0',
    description: 'Automatically sync footage from multiple cameras using audio waveform matching',
    longDescription: `**Multi-Cam Sync** takes footage from 2–8 cameras and syncs them all to a
common timeline using audio waveform fingerprinting — no clapperboard needed.

**Features:**
- Sync up to 8 camera angles simultaneously
- Audio waveform fingerprinting (millisecond accuracy)
- Visual multi-cam timeline view
- One-click angle switching
- Export as multi-angle project or flattened edit`,
    author:      'TLG3D Team',
    category:    'utility',
    tags:        ['multi-cam', 'sync', 'multi-angle', 'waveform', 'production'],
    icon:        '📷',
    screenshots: [],
    pricing:     { type: 'paid', price: 14.99, currency: 'USD' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'ffmpeg'],
    platforms:   ['windows', 'macos', 'linux'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    false,
    configSchema: [
      {
        key: 'cameraFiles', label: 'Camera Files', type: 'file',
        description: 'Select all camera angle files',
        required: true,
      },
      {
        key: 'syncMethod', label: 'Sync Method', type: 'select',
        options: [
          { label: 'Audio Waveform (Recommended)', value: 'waveform' },
          { label: 'Timecode', value: 'timecode' },
          { label: 'Manual Offset', value: 'manual' },
        ],
        defaultValue: 'waveform',
      },
    ],
  },

  // ── 12. Analytics & Engagement Predictor ──────────────────
  {
    id:          'engagement-predictor',
    name:        'Engagement Predictor',
    version:     '1.0.0',
    description: 'AI predicts engagement score and gives editing tips to maximize views and retention',
    longDescription: `**Engagement Predictor** analyzes your finished video and predicts its
likely engagement performance across platforms, then gives specific suggestions to improve it.

**Analyzes:**
- First 3-second hook strength
- Pacing and cut frequency
- Caption placement and readability
- Audio levels and clarity
- Thumbnail appeal (if generated)
- Call-to-action effectiveness

**Outputs:**
- Overall engagement score (0–100)
- Platform-specific scores (TikTok, YouTube, Instagram)
- Top 5 improvements with priority
- Side-by-side comparison after edits`,
    author:      'TLG3D Team',
    category:    'analytics',
    tags:        ['analytics', 'engagement', 'retention', 'views', 'optimization', 'ai'],
    icon:        '📊',
    screenshots: [],
    pricing:     { type: 'subscription', pricePerMonth: 4.99, currency: 'USD' },
    runtime:     'node',
    entrypoint:  'index.js',
    permissions: ['filesystem', 'network', 'llm'],
    platforms:   ['windows', 'macos', 'linux', 'ios', 'android'],
    minAppVersion: '0.1.0',
    verified:    true,
    featured:    true,
    configSchema: [
      {
        key: 'targetPlatform', label: 'Target Platform', type: 'select',
        options: [
          { label: 'All Platforms', value: 'all' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'X / Twitter', value: 'twitter' },
        ],
        defaultValue: 'all', required: true,
      },
      {
        key: 'audienceAge', label: 'Target Audience Age', type: 'select',
        options: [
          { label: 'Gen Z (13–25)', value: 'gen-z' },
          { label: 'Millennial (26–40)', value: 'millennial' },
          { label: 'Gen X (41–55)', value: 'gen-x' },
          { label: 'All Ages', value: 'all' },
        ],
        defaultValue: 'all',
      },
      {
        key: 'contentType', label: 'Content Type', type: 'select',
        options: [
          { label: 'Entertainment', value: 'entertainment' },
          { label: 'Educational', value: 'educational' },
          { label: 'Product / Brand', value: 'brand' },
          { label: 'Vlog / Personal', value: 'vlog' },
        ],
        defaultValue: 'entertainment',
      },
    ],
  },
];
