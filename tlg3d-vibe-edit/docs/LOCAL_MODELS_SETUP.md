# Local Model Setup Guide — CutFlow

## Overview

TLG3D supports running AI models **completely offline** on your local machine using **Ollama**. This guide covers setup for:

- **GPU:** RTX 3060 (12GB VRAM minimum)
- **CPU:** Intel i7 8th gen or newer / AMD Ryzen 5 3600+
- **RAM:** 16GB+ recommended

---

## System Requirements

### Minimum (RTX 3060 + i7 8th Gen)

- **GPU VRAM:** 12 GB
- **System RAM:** 16 GB
- **Disk Space:** 50 GB (for 5-6 models)
- **CPU:** i7-8700K or equivalent

### Recommended (RTX 3080+ + i7 12th Gen+)

- **GPU VRAM:** 24 GB
- **System RAM:** 32 GB
- **Disk Space:** 100 GB
- **CPU:** i7-12700K or newer

---

## Step 1: Install Ollama

### macOS

```bash
# Download from ollama.ai or use Homebrew
brew install ollama

# Start Ollama
ollama serve
```

### Linux (Ubuntu/Debian)

```bash
# Download and install
curl -fsSL https://ollama.ai/install.sh | sh

# Start as service
systemctl start ollama
systemctl enable ollama

# Or run directly
ollama serve
```

### Windows

1. Download from https://ollama.ai/download/windows
2. Run installer
3. Ollama will start automatically
4. Verify: Open PowerShell and run `ollama --version`

---

## Step 2: Verify GPU Support

### NVIDIA GPU

```bash
# Check CUDA is available
ollama list

# If models download and run fast (~30+ tokens/sec), GPU acceleration is working
```

### macOS (Metal GPU)

Metal acceleration is automatic on M1/M2/M3 Macs.

### Check VRAM

```bash
# Show current GPU memory usage
nvidia-smi

# NVIDIA
NVIDIA-SMI command shows VRAM allocation
```

---

## Step 3: Download Recommended Models

### Model Selection by Use Case

**For Video Script Generation (Recommended):**
```bash
ollama pull mistral:7b-instruct-q4_K_M
# Size: 3.8 GB | Speed: 35 tokens/sec | VRAM: 5 GB
```

**For Fast Scripts (Lightweight):**
```bash
ollama pull phi:2-q4_K_M
# Size: 1.6 GB | Speed: 52 tokens/sec | VRAM: 3 GB
```

**For High-Quality Output:**
```bash
ollama pull llama2:13b-chat-q4_K_M
# Size: 7.6 GB | Speed: 22 tokens/sec | VRAM: 9 GB
```

**For Vision/Scene Analysis:**
```bash
ollama pull llava:7b-v1.5-q4_K_M
# Size: 4.9 GB | Speed: 25 tokens/sec | VRAM: 6 GB
```

**For Semantic Search:**
```bash
ollama pull nomic-embed-text:v1.5.Q8_0
# Size: 274 MB | Speed: N/A | VRAM: 1 GB
```

### View Downloaded Models

```bash
ollama list

# Output:
# NAME                          ID              SIZE      MODIFIED
# mistral:7b-instruct-q4_K_M   abc123def456    3.8 GB    2 hours ago
# phi:2-q4_K_M                 xyz789abc123    1.6 GB    1 hour ago
```

---

## Step 4: Configure TLG3D to Use Local Models

### Update `.env`

```env
# Use local models
LLM_PROVIDER=local
OLLAMA_BASE_URL=http://localhost:11434

# Or set fallback to cloud
LLM_PRIMARY=local
LLM_FALLBACK=openrouter
OPENROUTER_API_KEY=sk-or-...  # For fallback only
```

### In Node.js/API

```typescript
import EnhancedLLMRouter from '@tlg3d/llm-router/enhanced-llm-router';

// Use local model directly
const script = await EnhancedLLMRouter.chat(
  'local',
  'mistral:7b-instruct-q4_K_M',
  [{ role: 'user', content: 'Generate a 30-second promo script' }],
  { temperature: 0.7, maxTokens: 1500 }
);

// Or use with fallback to cloud
const result = await EnhancedLLMRouter.chatWithFallback(
  'mistral:7b-instruct-q4_K_M',  // Try local first
  'openrouter',                   // Fallback to cloud
  'meta-llama/llama-2-70b-chat',
  messages,
  options
);
```

---

## Step 5: Monitor Model Performance

### Check Real-Time Performance

```bash
# Terminal 1: Start Ollama in debug mode
OLLAMA_DEBUG=1 ollama serve

# Terminal 2: Generate in another terminal and watch output
```

### Benchmark Models

```bash
# Time how fast a model responds
time ollama run mistral:7b-instruct-q4_K_M "Write a short video script"

# Expected output (RTX 3060):
# real    0m8.234s
# user    0m2.111s
# sys     0m1.034s
```

### Memory Usage

```bash
# Check GPU memory
nvidia-smi

# Watch real-time
watch -n 1 nvidia-smi
```

---

## Recommended Model Configurations

### RTX 3060 + i7 8th Gen (12GB VRAM, 16GB RAM)

**Setup 1: Speed-Focused**
```bash
ollama pull phi:2-q4_K_M              # 1.6 GB | Fast
ollama pull mistral:7b-instruct-q4_K_M # 3.8 GB | Balanced
```
Total: 5.4 GB VRAM | Recommended

**Setup 2: Quality-Focused**
```bash
ollama pull mistral:7b-instruct-q4_K_M # 3.8 GB | Balanced
ollama pull neural-chat:7b-q4_K_M      # 3.9 GB | Dialogue
```
Total: 7.7 GB VRAM | Tight fit

### RTX 3080+ + i7 12th Gen (24GB VRAM, 32GB RAM)

**Setup: Premium Quality**
```bash
ollama pull llama2:13b-chat-q4_K_M     # 7.6 GB | High quality
ollama pull mistral:7b-instruct-q4_K_M # 3.8 GB | Fast
ollama pull llava:7b-v1.5-q4_K_M       # 4.9 GB | Vision
ollama pull nomic-embed-text:Q8_0       # 0.3 GB | Embeddings
```
Total: 16.6 GB VRAM | Comfortable

---

## Common Issues & Fixes

### Issue: "Ollama service not running"

```bash
# Start Ollama
ollama serve

# Or check if it's running
curl http://localhost:11434/api/tags
```

### Issue: Model downloads very slow

```bash
# Check internet connection
ping ollama.ai

# Try manual download from HuggingFace
# Then add to Ollama manually (advanced)
```

### Issue: Out of VRAM errors

```bash
# Reduce model size by using lower quantization
# Instead of Q4, try Q3:
ollama pull mistral:7b-instruct-q3_K_M

# Or use smaller model
ollama pull phi:2-q4_K_M
```

### Issue: GPU not being used

```bash
# Set CUDA_VISIBLE_DEVICES explicitly
export CUDA_VISIBLE_DEVICES=0
ollama serve

# Or for AMD GPU (ROCm)
export ROCR_VISIBLE_DEVICES=0
ollama serve
```

---

## Model Comparison

| Model | Size | Speed | Quality | VRAM | Best For |
|-------|------|-------|---------|------|----------|
| Phi 2 | 1.6GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 3GB | Quick scripts |
| Mistral 7B | 3.8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 5GB | **Recommended** |
| Neural Chat 7B | 3.9GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 5GB | Dialogue |
| Llama 2 13B | 7.6GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 9GB | Best quality |
| LLaVA 7B Vision | 4.9GB | ⭐⭐⭐ | ⭐⭐⭐⭐ | 6GB | Scene analysis |

---

## Advanced: Multiple GPUs

### NVIDIA Multi-GPU Setup

```bash
# Set which GPU to use (0-indexed)
export CUDA_VISIBLE_DEVICES=0,1
ollama serve

# Run one model per GPU (manual distribution)
# Terminal 1
CUDA_VISIBLE_DEVICES=0 ollama run mistral:7b

# Terminal 2
CUDA_VISIBLE_DEVICES=1 ollama run llama2:13b
```

---

## Cleanup & Uninstall

### Remove Downloaded Models

```bash
# List models
ollama list

# Remove specific model
ollama rm mistral:7b-instruct-q4_K_M

# Remove all models
ollama list | awk '{print $1}' | xargs -I {} ollama rm {}
```

### Uninstall Ollama

```bash
# macOS
brew uninstall ollama

# Ubuntu
sudo apt remove ollama

# Windows
Control Panel → Programs → Uninstall a Program → Ollama
```

---

## Next Steps

1. **Install Ollama** → Follow Step 1
2. **Download Mistral 7B** → `ollama pull mistral:7b-instruct-q4_K_M`
3. **Update .env** → Set `LLM_PROVIDER=local`
4. **Test in TLG3D Dashboard** → Go to Settings → Local Models
5. **Generate First Script** → Use Discord `!script` command

---

## Performance Tips

- **Smaller quantization** = Faster inference, lower VRAM, slightly lower quality
- **Run one model at a time** to avoid VRAM conflicts
- **Use Q4 quantization** for best speed/quality balance
- **Monitor VRAM** while generating to optimize models

---

## Resources

- **Ollama Docs:** https://ollama.ai/docs
- **Model Library:** https://ollama.ai/library
- **HuggingFace Models:** https://huggingface.co/TheBloke (quantized models)
- **GGUF Format:** https://huggingface.co/docs/transformers/gguf

---

**Questions?** Open an issue: https://github.com/serthrocken/cutflow/issues
