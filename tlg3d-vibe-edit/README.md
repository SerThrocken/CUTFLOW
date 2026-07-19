# CutFlow

**The Looking Glass 3D — Agentic AI Video Editing & Scripting Software**

![TLG3D Logo](./assets/tlg3d-logo.png)

## Overview

CutFlow is an intelligent, agent-driven video editing platform that automates scripting, editing, and publishing workflows through natural language commands. Designed for content creators, it integrates with multiple messaging platforms (Discord, Telegram, Slack, SMS/RCS, iMessage) and supports orchestration across diverse AI model providers.

### Key Features

- **Agentic Video Editing**: AI-powered scene detection, transitions, effects, and color grading
- **Script Generation**: Automatic script creation from prompts, integrated with video assets
- **Multi-Channel Messaging**: Discord, Telegram, Slack, SMS/RCS, iMessage integration
- **Per-User Project Isolation**: Each user's files organized in dedicated directories by ID
- **Multi-Provider LLM Support**: OpenRouter, Mistral, HuggingFace, Groq, DeepSeek, Cerebras, and 20+ more
- **Video Processing**: FFmpeg-based timeline manipulation, effects, transitions
- **Voiceover & Subtitles**: ElevenLabs integration for TTS; subtitle generation with timestamps
- **Automated Skills**: Scene detection, color correction, motion smoothing, style transfer

## Tech Stack

- **Backend**: Node.js + Express / Python + FastAPI
- **Video Processing**: FFmpeg, Fluent-ffmpeg
- **Database**: MongoDB (per-user document structure)
- **Messaging**: Discord.py/discord.js, python-telegram-bot, Slack SDK, Twilio (SMS/RCS)
- **LLM Orchestration**: LangChain + dynamic provider routing
- **Storage**: Cloudflare R2 / AWS S3
- **Deployment**: Docker + docker-compose

## Project Structure

```
cutflow/
├── packages/
│   ├── core/                      # Shared utilities & types
│   ├── api/                       # REST API (Node.js)
│   ├── video-engine/              # FFmpeg + editing logic (Python)
│   ├── messaging/                 # Messaging adapters
│   │   ├── discord-handler/
│   │   ├── telegram-handler/
│   │   ├── slack-handler/
│   │   ├── sms-rcs-handler/
│   │   └── imessage-handler/
│   ├── llm-router/                # LLM provider abstraction
│   └── agents/                    # Agentic automation skills
├── data/
│   └── users/                     # Per-user folders: {user_id}/
│       ├── {discord_id}/
│       ├── {telegram_id}/
│       └── {slack_user_id}/
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- FFmpeg 4.4+
- MongoDB 5.0+
- Docker & Docker Compose

### Installation

```bash
git clone https://github.com/serthrocken/cutflow.git
cd cutflow
npm install
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
```

### Environment Variables

```env
# Messaging
DISCORD_TOKEN=
DISCORD_PUBLIC_KEY=
TELEGRAM_TOKEN=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# LLM Providers
OPENROUTER_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
CEREBRAS_API_KEY=
COHERE_API_KEY=

# Storage & Database
MONGODB_URI=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=

# Voice & Subtitles
ELEVENLABS_API_KEY=

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
```

### Quick Start

```bash
docker-compose up -d
npm run dev
```

## API Documentation

See [docs/API.md](./docs/API.md) for complete API reference.

## Messaging Integration

Users can interact with TLG3D via:

- **Discord**: Commands in servers or DMs
- **Telegram**: Direct bot messages
- **Slack**: Slash commands and messages
- **SMS/RCS**: Text-based editing commands
- **iMessage**: Native macOS/iOS integration

Each user's requests are routed to their personal workspace folder.

## Agents & Automation

Built-in agents handle:

- **Scene Detection**: Automatic shot boundary detection
- **Script Writer**: Generate video scripts from prompts
- **Color Grader**: Automated color correction
- **Motion Smoother**: Stabilization and keyframe interpolation
- **Style Transfer**: Apply visual themes
- **Subtitle Generator**: Auto-caption with timestamps
- **Voiceover Synthesizer**: TTS with voice selection

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT - The Looking Glass 3D LLC

## Support

- GitHub Issues: https://github.com/serthrocken/cutflow/issues
- Discord: [Community Server TBD]
- Email: support@cutflow.dev

---

**Built with ❤️ by The Looking Glass 3D**
