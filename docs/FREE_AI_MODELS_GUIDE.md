# CutFlow — Free AI Model Providers Guide

> **Can't afford API keys?** No problem. CutFlow is designed to work with completely free AI models. This guide lists every free option available so you can start using CutFlow's AI features without spending a dime.

---

## 🏆 Tier 1: Completely Free, No Credit Card Required

These providers offer **permanent free tiers** with no credit card needed. Just sign up, get a key, and paste it into CutFlow's settings.

### 1. 🦙 Ollama (LOCAL — Best Option)
- **Cost:** Completely free, forever
- **Sign-up:** None needed — runs on YOUR machine
- **How:** Download from [ollama.ai](https://ollama.ai), run `ollama pull phi3` or `ollama pull llama3`
- **Limits:** None! Only limited by your hardware
- **Privacy:** 100% offline, your data never leaves your computer
- **Best models for CutFlow:**
  - `phi3` — Great for 8GB VRAM (fastest)
  - `llama3` — Best quality for 12GB+ VRAM
  - `gemma:2b` — Ultra-lightweight for 4-6GB VRAM
  - `mistral:7b` — Excellent balance of speed and quality

> **💡 CutFlow Pro Tip:** Ollama is CutFlow's default. If you have 8GB+ VRAM, you don't need ANY cloud API at all. Everything runs locally and privately.

---

### 2. 🌐 OpenRouter (CLOUD — Best Free Cloud Option)
- **Cost:** Free for models with the `:free` suffix
- **Sign-up:** [openrouter.ai](https://openrouter.ai) — No credit card needed
- **Limits:** ~50 requests/day free (1,000/day if you deposit $10 one-time)
- **Free models available right now:**
  - `nvidia/nemotron-3-super-120b-a12b:free` — Powerful 120B model
  - `nvidia/nemotron-3-nano-30b-a3b:free` — Fast and capable
  - `google/gemma-4-31b-it:free` — Google's latest open model
  - `qwen/qwen3-next-80b-a3b-instruct:free` — Strong coding/writing
  - `openai/gpt-oss-120b:free` — OpenAI's open-source model
  - `cohere/north-mini-code:free` — Great for code generation
- **How to use in CutFlow:**
  1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
  2. Create a free API key
  3. In CutFlow Settings → LLM Provider → Select "OpenRouter"
  4. Paste your key
  5. Set model to any `:free` model above

> **💡 Pro Tip:** Use `openrouter/free` as the model name and OpenRouter will automatically pick the best available free model for your request.

---

### 3. ⚡ Groq (CLOUD — Fastest Free Inference)
- **Cost:** Free permanent developer tier
- **Sign-up:** [console.groq.com](https://console.groq.com) — No credit card needed
- **Limits:** ~30 requests/minute, ~6,000 tokens/minute
- **Speed:** Extremely fast (LPU hardware) — great for real-time editing commands
- **Free models:**
  - `llama-3.3-70b-versatile` — Best overall quality
  - `llama-3.1-8b-instant` — Ultra-fast for simple tasks
  - `gemma2-9b-it` — Google's Gemma on Groq speed
- **How to use in CutFlow:**
  1. Go to [console.groq.com/keys](https://console.groq.com/keys)
  2. Create API key
  3. In CutFlow Settings → LLM Provider → Select "Groq"
  4. Paste your key

---

### 4. 🧠 Cerebras (CLOUD — Highest Free Daily Limit)
- **Cost:** Free tier available
- **Sign-up:** [cloud.cerebras.ai](https://cloud.cerebras.ai) — No credit card needed
- **Limits:** ~1,000,000 tokens/day (the most generous free tier!)
- **Speed:** Very fast (custom Wafer-Scale Engine chips)
- **Free models:**
  - `llama-3.3-70b` — High-quality general purpose
  - `llama-3.1-8b` — Fast and lightweight
- **How to use in CutFlow:**
  1. Sign up at Cerebras Cloud
  2. Get your API key
  3. In CutFlow Settings → LLM Provider → Select "Cerebras"
  4. Paste your key

> **💡 Best for:** Heavy batch processing (Auto B-Roll, Script Generation, Semantic Search) because of the massive 1M token/day limit.

---

### 5. 🌟 Google AI Studio (CLOUD — Gemini Flash)
- **Cost:** Free tier (Gemini Flash models)
- **Sign-up:** [aistudio.google.com](https://aistudio.google.com) — Google account required
- **Limits:** ~1,500 requests/day, ~1,000,000 tokens/day
- **Free models:**
  - `gemini-2.5-flash` — Fast, good quality
  - `gemini-2.5-flash-lite` — Ultra-fast, lightweight
- **How to use in CutFlow:**
  1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
  2. Create an API key (DO NOT link a billing account if you want to stay free!)
  3. In CutFlow Settings → LLM Provider → Select "Google AI"
  4. Paste your key

> **⚠️ Warning:** If you link a billing account to your Google Cloud project, the free tier disappears. Keep it unlinked for free usage.

---

### 6. 🤗 HuggingFace (CLOUD — Thousands of Models)
- **Cost:** Free Serverless Inference API
- **Sign-up:** [huggingface.co](https://huggingface.co) — No credit card needed
- **Limits:** Rate-limited (a few hundred requests/hour)
- **Models:** Access to thousands of open-source models
- **How to use in CutFlow:**
  1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
  2. Create a free access token
  3. In CutFlow Settings → LLM Provider → Select "HuggingFace"
  4. Paste your token

---

### 7. 💎 Cohere (CLOUD — Trial Key)
- **Cost:** Free Trial API key (permanent for prototyping)
- **Sign-up:** [dashboard.cohere.com](https://dashboard.cohere.com) — No credit card needed
- **Limits:** Rate-limited (good for individual use)
- **Free models:**
  - `command-r-plus` — Strong reasoning and generation
  - `command-r` — Fast general purpose
- **How to use in CutFlow:**
  1. Sign up at Cohere Dashboard
  2. Get your Trial API key
  3. In CutFlow Settings → LLM Provider → Select "Cohere"
  4. Paste your key

---

### 8. 🔥 Mistral AI (CLOUD — Free Experiment Plan)
- **Cost:** Free "Experiment" plan
- **Sign-up:** [console.mistral.ai](https://console.mistral.ai) — No credit card needed
- **Limits:** Generous monthly token limits for experimentation
- **Free models:**
  - `mistral-small-latest` — Fast and efficient
  - `open-mistral-nemo` — Open-source quality
- **How to use in CutFlow:**
  1. Sign up at Mistral Console
  2. Create API key under "Experiment" plan
  3. In CutFlow Settings → LLM Provider → Select "Mistral"
  4. Paste your key

---

## 🥈 Tier 2: Cheap Pay-As-You-Go (If You Can Spare a Few Dollars)

These aren't free, but they're incredibly cheap if you can put in a small deposit.

| Provider | Min Deposit | What You Get |
|---|---|---|
| **DeepSeek** | $5 top-up | Extremely cheap tokens (~$0.14/M input tokens). Could last months. |
| **OpenRouter** | $10 one-time | Unlocks 1,000 free requests/day + access to all paid models at cost. |
| **Together AI** | $5 top-up | Access to Llama, DeepSeek, and dozens of open models at low cost. |

---

## 📋 Quick Recommendation Matrix

| Your Situation | Best Free Option | Why |
|---|---|---|
| **I have a decent GPU (8GB+ VRAM)** | 🦙 Ollama (Local) | Zero cost, zero limits, full privacy |
| **I have no GPU / weak GPU** | 🌐 OpenRouter Free | Best variety of free cloud models |
| **I need speed for real-time editing** | ⚡ Groq | Fastest inference, great for live commands |
| **I do heavy batch processing** | 🧠 Cerebras | 1M tokens/day — the most generous limit |
| **I want a big-brand model** | 🌟 Google AI Studio | Gemini Flash is free and powerful |
| **I want maximum model variety** | 🤗 HuggingFace | Thousands of models to experiment with |

---

## 🔧 How to Configure in CutFlow

### Desktop App (GPUI)
1. Launch CutFlow
2. Complete the Setup Wizard → Step 3: "AI Model Router Config"
3. Select your preferred provider
4. Paste your free API key
5. CutFlow will automatically test the connection

### Web App
1. Copy `.env.example` to `.env.local`
2. Set the appropriate key:
```env
# Pick ONE of these (leave the rest blank):
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxx
CEREBRAS_API_KEY=csk-xxxxxxxxxx
MISTRAL_API_KEY=xxxxxxxxxx
COHERE_API_KEY=xxxxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxx

# For local Ollama (no key needed):
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
```

### Fallback Chain
CutFlow automatically falls back through providers if one is down:
```
Your Configured Provider → OpenRouter Free → Local Ollama → Hardcoded Fallback
```

---

## ❓ FAQ

**Q: Do I need ANY API key to use CutFlow?**
A: No! If you install Ollama and pull a model (`ollama pull phi3`), everything works 100% offline with zero API keys.

**Q: Which free provider is best for video editing AI?**
A: For real-time commands (like "make it cinematic"), use **Groq** (fastest). For batch jobs (like generating scripts), use **Cerebras** (highest limit). For variety, use **OpenRouter**.

**Q: Will free providers always be free?**
A: The providers listed above have maintained permanent free tiers for over a year. However, limits and availability can change. CutFlow's fallback system ensures your workflow continues even if a provider changes its policy.

**Q: Can I use multiple free providers at once?**
A: Yes! Set your primary provider in CutFlow settings. If it hits rate limits, CutFlow's resilient router will automatically cascade to the next available provider.

---

*Guide maintained by SerThrocken — The Looking Glass 3D (TLG3D LLC)*
*Last updated: July 2026*
