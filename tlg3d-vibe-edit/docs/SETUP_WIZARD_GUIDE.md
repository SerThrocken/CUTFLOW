# Setup Wizard Guide — CutFlow

## Overview

The **Setup Wizard** walks you through configuring TLG3D from scratch. Takes ~15 minutes and covers everything you need to start editing videos with AI.

---

## 8-Step Wizard Flow

### Step 1️⃣: Welcome
**Get to know you**

- Enter your username (required)
- Optional: Display name, email
- Learn about key features

**Time:** ~2 minutes

---

### Step 2️⃣: System Detection
**Scan your hardware**

Automatically detects:
- GPU VRAM (RTX 3060 = 12GB)
- CPU cores & generation (i7 8th gen+)
- System RAM available
- OS type (Windows/macOS/Linux)

**Shows:**
- ✅ Support level (Minimum/Recommended/Optimal)
- ⚠️ Warnings if specs don't meet requirements
- 📦 Recommended models for your system

**Time:** ~1 minute

---

### Step 3️⃣: Messaging Platforms
**Connect Discord, Telegram, Slack, SMS**

Enable any/all of:
- **Discord** — Bot commands in servers/DMs
- **Telegram** — Direct bot messages
- **Slack** — Workspace integration
- **SMS/RCS** — Text-based (Twilio)

For each platform:
1. Click platform to expand
2. Get token from provider (links provided)
3. Paste token into field
4. Done!

**You can skip this** — Configure later in Settings

**Time:** ~5 minutes (or skip)

---

### Step 4️⃣: AI Models
**Choose local or cloud LLM provider**

**Local Option (Offline):**
- Run Ollama on your GPU
- No internet needed after download
- Free
- Requires Ollama installation

**Cloud Options:**
- OpenRouter — 100+ models, cheapest
- OpenAI — GPT-4, reliable
- Groq — Ultra-fast, free tier
- Mistral — Direct access
- Each requires API key

**Recommendation:**
- Optimal specs? → Try Local + Ollama
- Mid-range? → OpenRouter (cheap, fast)
- Production? → OpenAI or Groq

**Time:** ~3 minutes

---

### Step 5️⃣: Animation & Effects
**Set default video transitions and effects**

Choose:
1. **Transition Type** — Fade, Slide, Wipe, Dissolve, Zoom
2. **Transition Speed** — Slow (1.5s), Normal (1.0s), Fast (0.5s)
3. **Color Grading Preset** — Neutral, Warm, Cool, Cinematic
4. **Visual Effects** — Toggle color grading & particles

**Preview shows your selection**

**Time:** ~3 minutes

---

### Step 6️⃣: Editing Preferences
**Configure video defaults**

Choose:
1. **Resolution** — 720p, 1080p, 1440p, 4K
2. **Frame Rate** — 24, 30, or 60 FPS
3. **Auto Features** — Scene detection, color correction, subtitles

**Tip:** Use 1080p @ 30fps for balance of quality & performance

**Time:** ~2 minutes

---

### Step 7️⃣: Agentic Features
**Enable AI automation skills**

**Essential (Recommended):**
- ✅ Script Generation
- ✅ Voiceover Synthesis
- ✅ Scene Detection
- ✅ Auto Color Correction
- ✅ Subtitle Generation

**Advanced (Optional):**
- ⚡ Motion Smoothing (slower)
- ⚡ Style Transfer (experimental)
- ⚡ Auto Editing (advanced)

**Quick Presets:**
- **Standard** — Balanced setup (recommended)
- **Full Power** — All features on
- **Minimal** — Just essentials, fastest

**Note:** Can enable/disable anytime in Settings

**Time:** ~2 minutes

---

### Step 8️⃣: Theme & Finalization
**Choose your UI theme**

**Available Themes:**
- 🎨 **TLG3D Dark** — Professional (default)
- 🌞 **Light Mode** — Bright daytime theme
- ⚡ **Neon Vibrant** — High-contrast neon

**See:**
- Configuration summary
- What's next tips
- Quick start guides

**Time:** ~1 minute

---

## Key Features

### Smart Defaults
- Auto-detects your system capabilities
- Recommends models for your hardware
- Suggests balanced settings

### Skip Anytime
- Can skip any step except user setup
- All skipped steps can be configured later
- No forced configuration

### Validation
- Ensures at least one messaging platform or LLM provider
- Checks API key format
- Shows warnings for unsupported systems

### Progress Tracking
- Visual progress bar
- Step counter (X of 8)
- Estimated time per step

---

## After Setup

### ✅ You'll Have:
1. Configured LLM provider (local or cloud)
2. (Optional) Messaging platforms connected
3. Default animation & video settings
4. Selected agentic features
5. Chosen UI theme

### 🚀 Next Steps:
1. **Download Models** (if using local) → Settings → Local Models
2. **Connect Messaging** (if skipped) → Settings → Messaging
3. **Upload First Video** → Dashboard → Create Project
4. **Read Documentation** → Help → Guides & Tutorials

---

## Troubleshooting

### System Detection Failed
```
Try refreshing the page or checking browser console for errors
```

### API Key Not Working
```
1. Copy from provider again (don't paste previously copied)
2. Check for extra spaces
3. Verify key hasn't expired
```

### Can't Proceed to Next Step
```
Validation errors shown in red alerts
- At least one messaging platform OR LLM provider required
- User info fields must be filled
- API keys must be provided if required
```

### Want to Re-Run Setup
```
Go to Settings → Reset Setup Configuration
This will clear all setup data and re-show wizard
```

---

## Configuration Files

Setup configuration is saved to:
- **Database:** MongoDB collection `setup_configs`
- **Format:** JSON (encrypted)
- **Backups:** Auto-backed up daily

---

## Keyboard Shortcuts (During Wizard)

| Key | Action |
|-----|--------|
| `←` | Previous step |
| `→` | Next step |
| `Enter` | Complete (on final step) |
| `Esc` | Exit wizard (with warning) |

---

## Accessibility

- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Large text options
- ✅ Color-blind friendly

---

## FAQ

**Q: Do I have to complete all steps?**
A: No, you can skip most steps. Only username is required.

**Q: Can I change settings after setup?**
A: Yes, all settings can be modified in Settings anytime.

**Q: What if I don't have an API key?**
A: Use local models with Ollama, or use a free tier (Groq).

**Q: Can multiple users run the wizard?**
A: Yes, each user gets their own setup. Just log in separately.

**Q: Do I need internet for the wizard?**
A: Yes for initial setup, but not for local models after download.

---

## Contact & Support

- **Issues?** https://github.com/serthrocken/cutflow/issues
- **Questions?** https://github.com/serthrocken/cutflow/discussions
- **Email:** support@cutflow.dev

---

**Welcome to TLG3D! 🚀**

Built by The Looking Glass 3D | @serthrocken
