# Quick Start Guide — CutFlow

## 60-Second Setup

```bash
# 1. Clone the repo
git clone https://github.com/serthrocken/cutflow.git
cd cutflow

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your API keys (minimal setup):
# - DISCORD_TOKEN (or TELEGRAM_TOKEN)
# - OPENROUTER_API_KEY (or GROQ_API_KEY)
# - MONGODB_URI (local: mongodb://localhost:27017/tlg3d)

# 4. Start with Docker
docker-compose up -d

# Services ready at:
# - API: http://localhost:3000
# - Video Engine: http://localhost:5000
```

## Features Overview

### 🎬 Video Editing
- FFmpeg-powered timeline editing
- Transitions (fade, slide, zoom, dissolve)
- Color grading presets (warm, cool, cinematic)
- Scene auto-detection
- Video concatenation

### 🤖 Agentic AI
- **Script Generation** — LLM-powered video scripts
- **Voiceover Synthesis** — ElevenLabs TTS integration
- **Subtitle Generation** — Auto-captions with timestamps
- **Color Correction** — Automated color grading
- **Motion Smoothing** — Stabilization & keyframe interpolation

### 💬 Messaging Platforms
- **Discord** — Commands: `!edit`, `!script <text>`, `!voiceover <text>`
- **Telegram** — Commands: `/script`, `/voiceover`, `/edit`
- **Slack** — Slash commands for editing workflows
- **SMS/RCS** — Text-based editing via Twilio
- **iMessage** — macOS/iOS native integration

### 🎨 Theme System
- **Pre-built themes:** Default Dark, Light Mode, Vibrant Neon
- **Full customization** — Colors, typography, spacing, shadows
- **Live preview** — See changes instantly
- **Per-user persistence** — Save custom themes to MongoDB

## File Organization

Each user gets a dedicated folder with their ID:

```
data/users/
├── discord_546994016559038474/        # Your Discord projects
│   ├── conversations.json
│   ├── project_1234567890/
│   │   ├── metadata.json
│   │   ├── assets/
│   │   ├── timeline.json
│   │   └── output/
│   ├── generated_script.txt
│   └── voiceover_1234567890.mp3
├── telegram_987654321/                # Wife's Telegram projects
│   ├── conversations.json
│   └── project_1234567891/
└── slack_U12345ABCD/                  # Slack user projects
```

## API Endpoints Quick Ref

```bash
# Scripts
POST /api/scripts/generate
  → Generates video scripts from prompts

# Audio
POST /api/audio/voiceover
  → Synthesizes voiceover audio (ElevenLabs)

# Video Processing
POST /api/video/transition
  → Apply fade/slide/zoom transitions

POST /api/video/color-grade
  → Apply color grading presets

POST /api/video/detect-scenes
  → Auto-detect scene boundaries

# Projects
POST /api/projects/create
  → Create new video project

GET /api/projects/:userId
  → List all user projects

# Users
POST /api/users/register
  → Register new user from messaging platform

GET /api/users/:userId
  → Get user profile
```

## Environment Variables (Essential)

```env
# At minimum, set these:

# One messaging platform
DISCORD_TOKEN=xoxb...
# OR
TELEGRAM_TOKEN=123456:ABC...
# OR
SLACK_BOT_TOKEN=xoxb...

# One LLM provider
OPENROUTER_API_KEY=sk-or-...
# OR
GROQ_API_KEY=gsk_...
# OR
MISTRAL_API_KEY=...

# Database
MONGODB_URI=mongodb://localhost:27017/tlg3d

# Optional: Voice synthesis
ELEVENLABS_API_KEY=sk_...

# Optional: Storage (Cloudflare R2)
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET_NAME=tlg3d-videos
```

## Common Tasks

### Generate a Script
```bash
curl -X POST http://localhost:3000/api/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "discord_546994016559038474",
    "prompt": "Create a 30-second product launch script"
  }'
```

### Generate Voiceover
```bash
curl -X POST http://localhost:3000/api/audio/voiceover \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "discord_546994016559038474",
    "text": "Welcome to TLG3D!"
  }'
```

### Apply Color Grade
```bash
curl -X POST http://localhost:5000/api/video/color-grade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "discord_546994016559038474",
    "input_video": "/path/to/video.mp4",
    "preset": "cinematic"
  }'
```

## Theme Customization

### Switch Theme (React/Next.js)
```tsx
import { THEME_PRESETS, generateThemeCSS } from '@tlg3d/core/theme';

// Apply theme to DOM
const themeCSS = generateThemeCSS(THEME_PRESETS['tlg3d-neon']);
const style = document.createElement('style');
style.textContent = themeCSS;
document.head.appendChild(style);
```

### Available Themes
- `tlg3d-default` — Professional dark with muted green/gold
- `tlg3d-light` — Light mode for daytime use
- `tlg3d-neon` — Dark with vibrant neon accents

## Troubleshooting

**MongoDB not connecting?**
```bash
# Make sure MongoDB is running
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo
```

**FFmpeg not found?**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

**Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001
```

**Discord bot not responding?**
- Ensure `DISCORD_TOKEN` is correct in `.env`
- Check bot has permissions in Discord server
- Verify message intents are enabled in Discord Developer Portal

## Next Steps

1. **Try Discord Integration:** Add bot to server, use `!help`
2. **Generate Your First Script:** Message the bot with `!script your_idea`
3. **Customize the Theme:** Visit dashboard, click 🎨 Theme button
4. **Explore Video Editing:** Upload a video to test transitions & color grading
5. **Read Full Docs:** Check `docs/SETUP_AND_DEVELOPMENT.md`

---

**The Looking Glass 3D | GitHub: @serthrocken**

Have questions? Open an issue: https://github.com/serthrocken/cutflow/issues
