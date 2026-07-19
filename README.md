# 🎬 CutFlow — AI-Powered Video Production Studio

> **"Stop editing. Start directing."**
>
> CutFlow is the world's first fully agentic AI video production studio. You don't just use tools — you hire a digital film crew. Our exclusive Director Agent manages a team of AI sub-agents to script your video, source royalty-free B-roll, perform emotion-aware jump cuts, and color grade your footage based on the vibe. Whether you're streaming edits from your phone to your desktop or letting the Auto-Highlights agent turn your 3-hour podcast into viral shorts, CutFlow gives you back your most valuable asset: **Time.**

<p align="center">
  <strong>Built by <a href="https://github.com/SerThrocken">SerThrocken</a> — The Looking Glass 3D (TLG3D LLC)</strong>
</p>

---

## ✨ Feature Highlights

### 🤖 Agentic AI Engine
| Agent | What It Does | Tier |
|---|---|---|
| **Director Agent** | Orchestrates all sub-agents with HP/grading system and 3-min anti-loop check-ins | Pro |
| **Auto B-Roll Fetcher** | Uses LLM to generate search queries from your script, fetches clips from Pexels API | Pro |
| **Smart Jump-Cut** | Detects silence regions, uses AI to classify "dramatic pause" vs "dead air", auto-trims | Pro |
| **Instruction-Guided Editor** | Type natural language ("make it cinematic and add subtitles") → auto-applies operations | Pro |
| **Auto Highlights & Shorts** | Finds the most engaging segments, crops to 9:16, adds subtitles for TikTok/Reels | Pro |
| **Vibe Color Grading** | Autonomously analyzes footage and selects the best color grade + audio EQ preset | Pro |
| **Semantic Video Search** | Natural-language search across your project clips using LLM-powered indexing | Pro |
| **Thumbnail Generator** | Extracts the best frame, enhances it, adds AI-generated clickable title text | Pro |
| **Style Personas** | One-click preset bundles (MrBeast, Documentary, Vlog, Horror, Gaming, etc.) | Free |
| **Script & Idea Generator** | AI brainstorms video concepts, titles, hooks, and full scripts | Free |
| **Music Director AI** | Recommends mood, BPM, instruments, SFX placement, and ducking strategy | Free |

### 🎨 Visual Effects & Filters
10 production-grade FFmpeg filter chains: VHS, Film Grain, Dreamy, Cyberpunk, Noir, Sepia, Teal & Orange, Vignette, Bloom, Sharpen.

### 🎵 Audio Engine
- Procedural SFX generator (whoosh, impact, riser, drop, glitch, notification, ambient, transition)
- Mood-based music synthesis (epic, chill, hype, sad, corporate, lofi, action, horror)
- AI noise reduction, voice isolation, audio ducking, beat-sync detection

### 🎬 Video Processing
- Scene detection, motion smoothing (vidstab), Ken Burns zoom, speed ramping
- Auto-reframe (16:9 → 9:16 / 1:1 / 4:5), shape dissolve transitions
- Background removal (chromakey), object removal (delogo), generative extend
- LUT application, color matching across clips, intro/outro animation generator (8 styles)

### 📱 Teleprompter
Auto-scrolling teleprompter with adjustable WPM tempo and voice-activated scroll mode.

### 🔌 Universal LLM Router
Supports 40+ providers out of the box:
- **Local:** Ollama (phi3, llama3, gemma, mistral, etc.)
- **Cloud:** OpenRouter, OpenAI, Anthropic, Google, Mistral, Groq, DeepSeek, Cerebras, Cohere, HuggingFace, Fireworks, and more
- Automatic VRAM-aware model selection for local models
- Resilient cascading fallback if a provider is down

### 💬 Messaging Integration
Accept editing commands from Discord, Telegram, Slack, WhatsApp, Signal, SMS, iMessage, Email, Instagram DM, Facebook Messenger, X/Twitter DM, LINE, Viber, and WeChat.

---

## 💰 Pricing

| Tier | Price | What You Get |
|---|---|---|
| **Free** | $0 | Local LLMs, basic effects, script generator, personas, teleprompter |
| **Pro** | $9.99/mo | Director Agent, Auto B-Roll, Smart Jump-Cut, Semantic Search, Universal API Router, Auto Highlights |
| **Studio** | $199.99 lifetime | Everything in Pro, forever. Priority support. |

> 7-day free Pro trial on first install. Hardware-locked to prevent abuse.

### 🔥 How CutFlow Compares

| Feature | CutFlow (Free) | CutFlow Pro | CapCut | DaVinci Resolve | Premiere Pro |
|---|---|---|---|---|---|
| Price | **$0** | **$9.99/mo** | Free (paywalled) | Free | $22.99/mo |
| AI Video Editing | ✅ Natural language | ✅ Full Director | ❌ | ❌ | ❌ |
| Runs Offline | ✅ | ✅ | ❌ | ✅ | ❌ |
| Auto B-Roll Sourcing | ❌ | ✅ | ❌ | ❌ | ❌ |
| Smart Jump-Cut (AI) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Auto TikTok Shorts | ❌ | ✅ | ✅ (paid) | ❌ | ❌ |
| Open Source | ✅ | ✅ | ❌ | ❌ | ❌ |
| Your Data is Private | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## 🖥️ System Requirements

| | Minimum | Recommended |
|---|---|---|
| **RAM** | 16 GB DDR4 | 32–64 GB DDR5 |
| **VRAM** | 8 GB | 12+ GB |
| **GPU** | NVIDIA GTX 1070+ / AMD RX 580+ | NVIDIA RTX 3060+ / RTX 4070+ |
| **OS** | Windows 10+ / macOS 12+ / Linux | Windows 11 / macOS 14+ |
| **Disk** | 10 GB free | SSD with 50+ GB free |
| **Tools** | FFmpeg installed and on PATH | FFmpeg + Ollama running |

---

## 🚀 Getting Started

### Prerequisites
- [Rust toolchain](https://rustup.rs/) (for the native desktop app)
- [Bun](https://bun.sh/) (for the web app)
- [FFmpeg](https://ffmpeg.org/download.html) (required — must be on PATH)
- [Ollama](https://ollama.ai/) (optional — for local AI models)
- [Docker](https://docs.docker.com/get-docker/) (optional — for database/Redis)

### Quick Start (Desktop)

```bash
# Clone the repo
git clone https://github.com/SerThrocken/CUTFLOW.git
cd CUTFLOW

# Build the native desktop app
cd apps/desktop
cargo build --release

# Run CutFlow
./target/release/cutflow
```

### Quick Start (Web)

```bash
# Copy environment config
cp apps/web/.env.example apps/web/.env.local

# Start database (optional)
docker compose up -d db redis serverless-redis-http

# Install dependencies and start
bun install
bun dev:web
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
CUTFLOW/
├── apps/
│   ├── desktop/          # Native GPUI desktop app (Rust)
│   │   └── src/
│   │       ├── main.rs           # App entry, UI rendering
│   │       ├── agents.rs         # All AI agent implementations
│   │       ├── ollama.rs         # Universal LLM router (40+ providers)
│   │       ├── ffmpeg.rs         # FFmpeg integration & HW acceleration
│   │       ├── security.rs       # Licensing, trial, dev backdoor
│   │       ├── gpu.rs            # GPU detection & CUDA/NVENC
│   │       ├── system_info.rs    # System diagnostics
│   │       ├── process_manager.rs # Background service manager
│   │       └── checkpoint.rs     # Project save/restore
│   ├── web/              # Next.js web application
│   └── android/          # Android mobile app (Kotlin)
├── rust/                 # Shared platform-agnostic core (WASM)
├── tlg3d-vibe-edit/      # Vibe Edit monorepo
│   ├── packages/
│   │   ├── core/         # Setup wizard, dashboard, themes
│   │   ├── agents/       # TypeScript agent wrappers
│   │   ├── llm-router/   # Enhanced LLM routing
│   │   ├── marketplace/  # Skill marketplace
│   │   ├── messaging/    # Multi-platform messaging hub
│   │   └── video-engine/ # Python/FFmpeg video pipeline
│   └── apps/
│       ├── desktop-native/  # Vite + React desktop UI
│       └── mobile/          # React Native mobile app
├── docs/                 # Architecture documentation
└── docker-compose.yml    # Database & service orchestration
```

---

## 🔐 Security

- **License Validation:** Server-side license key verification with hardware fingerprinting
- **Device ID:** SHA-256 hash of OS + CPU + machine identity to prevent trial abuse
- **Memory Obfuscation:** XOR encryption for sensitive credentials in the compiled binary
- **7-Day Trial Lock:** Hardware-locked trial prevents multiple account creation
- **Paywall Integrity:** Server-side Pro feature validation (no local config bypasses)

---

## 📖 Documentation

| Document | Description |
|---|---|
| [`CHANGELOG.md`](CHANGELOG.md) | Release history and feature updates by SerThrocken |
| [`docs/MASTER_SETUP_GUIDE.md`](docs/MASTER_SETUP_GUIDE.md) | **Must read!** Complete Cloud setup, Discord webhook, and PayPal/Patreon guide |
| [`docs/FREE_AI_MODELS_GUIDE.md`](docs/FREE_AI_MODELS_GUIDE.md) | **Start here!** Free API providers so you can use CutFlow without spending a dime |
| [`docs/AGENT_ARCHITECTURE.md`](docs/AGENT_ARCHITECTURE.md) | Director Agent & sub-agent system deep dive |
| [`docs/PATREON_PAYPAL_SETUP.md`](docs/PATREON_PAYPAL_SETUP.md) | Payment integration walkthrough (for developers) |
| [`docs/QUICK_START.md`](tlg3d-vibe-edit/docs/QUICK_START.md) | 5-minute getting started guide |
| [`docs/SETUP_WIZARD_GUIDE.md`](tlg3d-vibe-edit/docs/SETUP_WIZARD_GUIDE.md) | Interactive setup wizard walkthrough |
| [`docs/LOCAL_MODELS_SETUP.md`](tlg3d-vibe-edit/docs/LOCAL_MODELS_SETUP.md) | How to install and configure Ollama for local AI |
| [`docs/LOCAL_MODELS_FEATURES.md`](tlg3d-vibe-edit/docs/LOCAL_MODELS_FEATURES.md) | All local model-powered features explained |
| [`docs/PROJECT_QUEUE_SYSTEM.md`](tlg3d-vibe-edit/docs/PROJECT_QUEUE_SYSTEM.md) | Batch rendering and project queue system |
| [`docs/SETUP_AND_DEVELOPMENT.md`](tlg3d-vibe-edit/docs/SETUP_AND_DEVELOPMENT.md) | Development environment setup |

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](.github/CONTRIBUTING.md) for details.

**Focus areas:** Timeline features, agent improvements, performance, mobile UX, new visual effects.

---

## 📄 License

[MIT LICENSE](LICENSE)

---

<p align="center">
  <strong>CutFlow</strong> — by SerThrocken (The Looking Glass 3D)<br/>
  <em>"Stop editing. Start directing."</em>
</p>
