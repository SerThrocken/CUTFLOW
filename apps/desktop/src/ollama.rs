// ============================================================
//  CutFlow — Universal LLM Provider Abstraction
//  Supports: Ollama, OpenRouter, OpenAI, Anthropic, Google
//            Gemini, Groq, Together AI, Mistral, DeepSeek,
//            Fireworks, Perplexity, HuggingFace, LM Studio,
//            or ANY OpenAI-compatible endpoint.
// ============================================================

use serde::{Deserialize, Serialize};

/// Supported LLM provider backends.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum LlmProvider {
    Ollama,
    OpenAI,
    OpenRouter,
    Anthropic,
    GoogleGemini,
    Groq,
    TogetherAI,
    Mistral,
    DeepSeek,
    Fireworks,
    Perplexity,
    HuggingFace,
    LmStudio,
    JanAi,
    Gpt4All,
    LocalAi,
    KoboldCpp,
    LlamaCpp,
    Vllm,
    TabbyApi,
    Oobabooga,
    Cohere,
    Ai21,
    DeepInfra,
    OrcaRouter,
    Moonshot,
    Cerebras,
    SambaNova,
    NvidiaNim,
    StepFun,
    MuleRouter,
    MiniMax,
    AlibabaDashScope,
    Pollinations,
    Glhf,
    Lepton,
    Hyperbolic,
    Novita,
    Nebius,
    Custom,
}

impl LlmProvider {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "ai21"            => Self::Ai21,
            "alibaba" | "dashscope" => Self::AlibabaDashScope,
            "anthropic"       => Self::Anthropic,
            "cerebras"        => Self::Cerebras,
            "cohere"          => Self::Cohere,
            "deepinfra"       => Self::DeepInfra,
            "deepseek"        => Self::DeepSeek,
            "fireworks"       => Self::Fireworks,
            "gemini" | "google" | "google_gemini" => Self::GoogleGemini,
            "glhf"            => Self::Glhf,
            "gpt4all"         => Self::Gpt4All,
            "groq"            => Self::Groq,
            "huggingface" | "hf" => Self::HuggingFace,
            "hyperbolic"      => Self::Hyperbolic,
            "jan" | "janai" | "jan_ai" => Self::JanAi,
            "kobold" | "koboldcpp" => Self::KoboldCpp,
            "lepton"          => Self::Lepton,
            "llamacpp" | "llama_cpp" => Self::LlamaCpp,
            "lmstudio" | "lm_studio" => Self::LmStudio,
            "localai" | "local_ai" => Self::LocalAi,
            "minimax"         => Self::MiniMax,
            "mistral"         => Self::Mistral,
            "moonshot" | "kimi" => Self::Moonshot,
            "mulerouter"      => Self::MuleRouter,
            "nebius"          => Self::Nebius,
            "novita"          => Self::Novita,
            "nvidia" | "nvidianim" | "nim" => Self::NvidiaNim,
            "ollama"          => Self::Ollama,
            "openai"          => Self::OpenAI,
            "openrouter"      => Self::OpenRouter,
            "orcarouter"      => Self::OrcaRouter,
            "perplexity"      => Self::Perplexity,
            "pollinations" | "pollination" => Self::Pollinations,
            "sambanova" | "samba" => Self::SambaNova,
            "stepfun"         => Self::StepFun,
            "tabby" | "tabbyapi" => Self::TabbyApi,
            "together" | "togetherai" | "together_ai" => Self::TogetherAI,
            "vllm"            => Self::Vllm,
            _                 => Self::Custom,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Ai21         => "AI21 Labs",
            Self::AlibabaDashScope => "Alibaba DashScope",
            Self::Anthropic    => "Anthropic (Claude)",
            Self::Cerebras     => "Cerebras",
            Self::Cohere       => "Cohere",
            Self::DeepInfra    => "DeepInfra",
            Self::DeepSeek     => "DeepSeek",
            Self::Fireworks    => "Fireworks AI",
            Self::Glhf         => "GLHF.chat",
            Self::GoogleGemini => "Google Gemini",
            Self::Gpt4All      => "GPT4All (Local)",
            Self::Groq         => "Groq",
            Self::HuggingFace  => "HuggingFace",
            Self::Hyperbolic   => "Hyperbolic",
            Self::JanAi        => "Jan.ai (Local)",
            Self::KoboldCpp    => "KoboldCpp (Local)",
            Self::Lepton       => "Lepton AI",
            Self::LlamaCpp     => "llama.cpp (Local)",
            Self::LmStudio     => "LM Studio (Local)",
            Self::LocalAi      => "LocalAI (Local)",
            Self::MiniMax      => "MiniMax",
            Self::Mistral      => "Mistral",
            Self::Moonshot     => "Kimi Moonshot",
            Self::MuleRouter   => "MuleRouter",
            Self::Nebius       => "Nebius AI",
            Self::Novita       => "Novita AI",
            Self::NvidiaNim    => "Nvidia NIM",
            Self::Ollama       => "Ollama (Local)",
            Self::OpenAI       => "OpenAI",
            Self::OpenRouter   => "OpenRouter",
            Self::OrcaRouter   => "OrcaRouter",
            Self::Oobabooga    => "Oobabooga (Local)",
            Self::Perplexity   => "Perplexity",
            Self::Pollinations => "Pollinations.ai (Free)",
            Self::SambaNova    => "SambaNova",
            Self::StepFun      => "StepFun",
            Self::TabbyApi     => "TabbyAPI (Local)",
            Self::TogetherAI   => "Together AI",
            Self::Vllm         => "vLLM (Local/Cloud)",
            Self::Custom       => "Custom Endpoint",
        }
    }

    /// Returns the default base URL for this provider.
    pub fn default_base_url(&self) -> &'static str {
        match self {
            Self::Ai21         => "https://api.ai21.com",
            Self::AlibabaDashScope => "https://dashscope.aliyuncs.com/compatible-mode/v1",
            Self::Anthropic    => "https://api.anthropic.com",
            Self::Cerebras     => "https://api.cerebras.ai/v1",
            Self::Cohere       => "https://api.cohere.ai",
            Self::DeepInfra    => "https://api.deepinfra.com/v1/openai",
            Self::DeepSeek     => "https://api.deepseek.com",
            Self::Fireworks    => "https://api.fireworks.ai/inference",
            Self::Glhf         => "https://api.glhf.chat/v1",
            Self::GoogleGemini => "https://generativelanguage.googleapis.com",
            Self::Gpt4All      => "http://localhost:4891",
            Self::Groq         => "https://api.groq.com/openai",
            Self::HuggingFace  => "https://api-inference.huggingface.co",
            Self::Hyperbolic   => "https://api.hyperbolic.xyz/v1",
            Self::JanAi        => "http://localhost:1337",
            Self::KoboldCpp    => "http://localhost:5001",
            Self::Lepton       => "https://api.lepton.ai/v1",
            Self::LlamaCpp     => "http://localhost:8080",
            Self::LmStudio     => "http://localhost:1234",
            Self::LocalAi      => "http://localhost:8080",
            Self::MiniMax      => "https://api.minimax.chat/v1",
            Self::Mistral      => "https://api.mistral.ai",
            Self::Moonshot     => "https://api.moonshot.cn/v1",
            Self::MuleRouter   => "https://api.mulerouter.com/v1",
            Self::Nebius       => "https://api.nebius.ai/v1",
            Self::Novita       => "https://api.novita.ai/v1",
            Self::NvidiaNim    => "https://integrate.api.nvidia.com/v1",
            Self::Ollama       => "http://localhost:11434",
            Self::OpenAI       => "https://api.openai.com",
            Self::OpenRouter   => "https://openrouter.ai/api",
            Self::OrcaRouter   => "https://api.orcarouter.com/v1",
            Self::Oobabooga    => "http://localhost:5000",
            Self::Perplexity   => "https://api.perplexity.ai",
            Self::Pollinations => "https://text.pollinations.ai/openai",
            Self::SambaNova    => "https://api.sambanova.ai/v1",
            Self::StepFun      => "https://api.stepfun.com/v1",
            Self::TabbyApi     => "http://localhost:5000",
            Self::TogetherAI   => "https://api.together.xyz",
            Self::Vllm         => "http://localhost:8000",
            Self::Custom       => "http://localhost:8080",
        }
    }

    /// Returns the default model name for this provider.
    pub fn default_model(&self) -> &'static str {
        match self {
            Self::Ai21         => "jamba-1.5-mini",
            Self::AlibabaDashScope => "qwen-plus",
            Self::Anthropic    => "claude-3-haiku-20240307",
            Self::Cerebras     => "llama3.1-8b",
            Self::Cohere       => "command-r-plus",
            Self::DeepInfra    => "meta-llama/Meta-Llama-3-8B-Instruct",
            Self::DeepSeek     => "deepseek-chat",
            Self::Fireworks    => "accounts/fireworks/models/llama-v3-8b-instruct",
            Self::Glhf         => "hf:meta-llama/Meta-Llama-3.1-8B-Instruct",
            Self::GoogleGemini => "gemini-1.5-flash",
            Self::Gpt4All      => "all-MiniLM-L6-v2",
            Self::Groq         => "llama-3.1-8b-instant",
            Self::HuggingFace  => "meta-llama/Meta-Llama-3-8B-Instruct",
            Self::Hyperbolic   => "meta-llama/Meta-Llama-3.1-8B-Instruct",
            Self::JanAi        => "mistral-ins-7b-q4",
            Self::KoboldCpp    => "kobold",
            Self::Lepton       => "llama3-8b-instruct",
            Self::LlamaCpp     => "llama",
            Self::LmStudio     => "local-model",
            Self::LocalAi      => "gpt-3.5-turbo",
            Self::MiniMax      => "abab6.5-chat",
            Self::Mistral      => "mistral-small-latest",
            Self::Moonshot     => "moonshot-v1-8k",
            Self::MuleRouter   => "meta-llama/Meta-Llama-3-8B-Instruct",
            Self::Nebius       => "meta-llama/Meta-Llama-3.1-8B-Instruct",
            Self::Novita       => "meta-llama/llama-3.1-8b-instruct",
            Self::NvidiaNim    => "meta/llama-3.1-8b-instruct",
            Self::Ollama       => "llama3",
            Self::OpenAI       => "gpt-4o-mini",
            Self::OpenRouter   => "meta-llama/llama-3-8b-instruct",
            Self::OrcaRouter   => "meta-llama/Meta-Llama-3-8B-Instruct",
            Self::Oobabooga    => "model",
            Self::Perplexity   => "llama-3.1-sonar-small-128k-online",
            Self::Pollinations => "openai",
            Self::SambaNova    => "Meta-Llama-3.1-8B-Instruct",
            Self::StepFun      => "step-1-8k",
            Self::TabbyApi     => "model",
            Self::TogetherAI   => "meta-llama/Llama-3-8b-chat-hf",
            Self::Vllm         => "meta-llama/Meta-Llama-3-8B-Instruct",
            Self::Custom       => "default",
        }
    }

    /// Whether this provider uses the OpenAI-compatible chat/completions API.
    pub fn uses_openai_format(&self) -> bool {
        match self {
            Self::Ollama       => false,
            Self::Anthropic    => false,
            Self::GoogleGemini => false,
            Self::HuggingFace  => false,
            Self::KoboldCpp    => false, // Custom API or legacy format
            Self::Cohere       => false, // Cohere v1 API
            // OpenAI-compatible formats (including Jan, GPT4All, LocalAI, vLLM, LM Studio, etc.)
            _ => true,
        }
    }

    /// Returns all providers sorted alphabetically by their display name (for UI API Key spots).
    pub fn get_all_alphabetically() -> Vec<Self> {
        let mut providers = vec![
            Self::Ai21, Self::AlibabaDashScope, Self::Anthropic, Self::Cerebras, Self::Cohere,
            Self::DeepInfra, Self::DeepSeek, Self::Fireworks, Self::Glhf, Self::GoogleGemini,
            Self::Gpt4All, Self::Groq, Self::HuggingFace, Self::Hyperbolic, Self::JanAi,
            Self::KoboldCpp, Self::Lepton, Self::LlamaCpp, Self::LmStudio, Self::LocalAi,
            Self::MiniMax, Self::Mistral, Self::Moonshot, Self::MuleRouter, Self::Nebius,
            Self::Novita, Self::NvidiaNim, Self::Ollama, Self::OpenAI, Self::OpenRouter,
            Self::Oobabooga, Self::OrcaRouter, Self::Perplexity, Self::Pollinations,
            Self::SambaNova, Self::StepFun, Self::TabbyApi, Self::TogetherAI, Self::Vllm,
            Self::Custom,
        ];
        providers.sort_by(|a, b| a.display_name().cmp(b.display_name()));
        providers
    }
}

/// Full provider configuration (persisted in settings).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider:     LlmProvider,
    pub api_key:      String,      // empty for local providers
    pub base_url:     String,      // allow override
    pub model:        String,      // allow override
    pub temperature:  f64,
    pub max_tokens:   u32,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            provider:    LlmProvider::Ollama,
            api_key:     String::new(),
            base_url:    LlmProvider::Ollama.default_base_url().into(),
            model:       LlmProvider::Ollama.default_model().into(),
            temperature: 0.7,
            max_tokens:  2048,
        }
    }
}

impl LlmConfig {
    /// Create config for a named provider, filling in sensible defaults.
    pub fn for_provider(name: &str) -> Self {
        let provider = LlmProvider::from_str(name);
        Self {
            base_url: provider.default_base_url().into(),
            model:    provider.default_model().into(),
            provider,
            ..Default::default()
        }
    }

    /// Create config with an API key pre-filled.
    pub fn for_provider_with_key(name: &str, api_key: &str) -> Self {
        let mut cfg = Self::for_provider(name);
        cfg.api_key = api_key.to_string();
        cfg
    }
}

// ============================================================
//  RESILIENT ROUTER — Cascading Failover with Local Fallback
//  Tries providers in priority order. If all fail, auto-downloads
//  a local model via Ollama as the absolute last resort.
// ============================================================

use std::sync::{Arc, Mutex};

/// A prioritized chain of LLM provider configs for automatic failover.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResilientRouter {
    /// Ordered list of providers to try (index 0 = highest priority).
    pub chain: Vec<LlmConfig>,
    /// Which provider was last used successfully (for sticky routing).
    pub last_success_idx: Option<usize>,
    /// Log of failover events for transparency.
    pub failover_log: Vec<String>,
    /// The recommended local model to auto-download as final fallback.
    pub fallback_local_model: String,
}

impl Default for ResilientRouter {
    fn default() -> Self {
        Self {
            chain: vec![LlmConfig::default()],  // Ollama by default
            last_success_idx: None,
            failover_log: vec![],
            fallback_local_model: "phi3".into(),  // Small, fast, good quality
        }
    }
}

impl ResilientRouter {
    /// Build a router from a set of API keys. Auto-populates provider configs.
    /// Providers with keys are prioritized first; local Ollama is always last.
    pub fn from_api_keys(keys: &std::collections::HashMap<String, String>) -> Self {
        let mut chain = vec![];

        // Priority order for cloud providers (fastest/cheapest first)
        let priority_order = [
            "groq", "deepseek", "openrouter", "together_ai", "fireworks",
            "mistral", "openai", "anthropic", "gemini", "perplexity",
            "huggingface",
        ];

        for provider_name in &priority_order {
            if let Some(key) = keys.get(*provider_name) {
                if !key.is_empty() {
                    chain.push(LlmConfig::for_provider_with_key(provider_name, key));
                }
            }
        }

        // LM Studio (local, no key needed) — if running
        chain.push(LlmConfig::for_provider("lmstudio"));

        // Ollama (always present as final fallback)
        chain.push(LlmConfig::default());

        Self {
            chain,
            last_success_idx: None,
            failover_log: vec![],
            fallback_local_model: "phi3".into(),
        }
    }

    /// Add or update a provider in the chain.
    pub fn add_provider(&mut self, name: &str, api_key: &str) {
        // Remove existing entry for this provider
        let provider = LlmProvider::from_str(name);
        self.chain.retain(|c| c.provider != provider);
        // Insert before the local fallbacks (Ollama/LM Studio are at the end)
        let insert_pos = self.chain.len().saturating_sub(2);
        self.chain.insert(insert_pos, LlmConfig::for_provider_with_key(name, api_key));
    }
}

/// Thread-safe shared router instance.
pub type SharedRouter = Arc<Mutex<ResilientRouter>>;

pub fn new_shared_router() -> SharedRouter {
    Arc::new(Mutex::new(ResilientRouter::default()))
}

/// The main resilient generate function. Tries each provider in the chain,
/// auto-rerouting on failure. If ALL providers fail, attempts to download
/// the recommended local model via Ollama and retries.
pub async fn generate_resilient(
    router: &SharedRouter,
    system: &str,
    prompt: &str,
) -> Result<String, String> {
    let chain = {
        let r = router.lock().unwrap();
        r.chain.clone()
    };

    let mut errors = vec![];

    // Try sticky route first (last known good provider)
    let last_idx = router.lock().unwrap().last_success_idx;
    if let Some(idx) = last_idx {
        if idx < chain.len() {
            match generate(&chain[idx], system, prompt).await {
                Ok(result) if !result.trim().is_empty() => {
                    return Ok(result);
                }
                Ok(_) => {
                    errors.push(format!("[{}] Empty response", chain[idx].provider.display_name()));
                }
                Err(e) => {
                    let msg = format!("[{}] Failed: {}", chain[idx].provider.display_name(), e);
                    errors.push(msg.clone());
                    router.lock().unwrap().failover_log.push(msg);
                    router.lock().unwrap().last_success_idx = None;
                }
            }
        }
    }

    // Try each provider in priority order
    for (idx, cfg) in chain.iter().enumerate() {
        // Skip sticky route if already tried
        if last_idx == Some(idx) { continue; }

        // Skip providers that need API keys but don't have one
        // (except local providers which don't need keys)
        let needs_key = cfg.provider != LlmProvider::Ollama
            && cfg.provider != LlmProvider::LmStudio;
        if needs_key && cfg.api_key.is_empty() {
            continue;
        }

        match generate(cfg, system, prompt).await {
            Ok(result) if !result.trim().is_empty() => {
                // Success! Update sticky route.
                let mut r = router.lock().unwrap();
                r.last_success_idx = Some(idx);
                if !errors.is_empty() {
                    r.failover_log.push(format!(
                        "✅ Rerouted to {} after {} failures",
                        cfg.provider.display_name(),
                        errors.len()
                    ));
                }
                return Ok(result);
            }
            Ok(_) => {
                errors.push(format!("[{}] Empty response", cfg.provider.display_name()));
            }
            Err(e) => {
                let msg = format!("[{}] {}", cfg.provider.display_name(), e);
                errors.push(msg.clone());
                router.lock().unwrap().failover_log.push(format!("⚠️ {}", msg));
            }
        }
    }

    // ALL PROVIDERS FAILED — attempt local model auto-download via Ollama
    let fallback_model = router.lock().unwrap().fallback_local_model.clone();
    router.lock().unwrap().failover_log.push(format!(
        "🔻 All {} cloud providers failed. Attempting local fallback: {}",
        errors.len(), fallback_model
    ));

    // Check if Ollama is running
    if check_ollama_running().await {
        // Check if model is already downloaded
        let models = list_ollama_models().await.unwrap_or_default();
        let model_present = models.iter().any(|m| m.starts_with(&fallback_model));

        if !model_present {
            // Auto-pull the model
            router.lock().unwrap().failover_log.push(format!(
                "📥 Auto-downloading '{}' for local fallback...", fallback_model
            ));
            let _ = pull_ollama_model(&fallback_model, |_progress| {}).await;
        }

        // Try generating with the local model
        let local_cfg = LlmConfig {
            provider: LlmProvider::Ollama,
            api_key: String::new(),
            base_url: "http://localhost:11434".into(),
            model: fallback_model.clone(),
            temperature: 0.7,
            max_tokens: 2048,
        };

        match generate(&local_cfg, system, prompt).await {
            Ok(result) if !result.trim().is_empty() => {
                router.lock().unwrap().failover_log.push(format!(
                    "✅ Local fallback '{}' succeeded", fallback_model
                ));
                return Ok(result);
            }
            Ok(_) => {
                errors.push(format!("[Local:{}] Empty response", fallback_model));
            }
            Err(e) => {
                errors.push(format!("[Local:{}] {}", fallback_model, e));
            }
        }
    } else {
        errors.push("Ollama not running for local fallback".into());
    }

    // Absolute failure — return all error details
    Err(format!(
        "All LLM providers exhausted ({} attempted):\n{}",
        errors.len(),
        errors.join("\n")
    ))
}

/// Get a copy of the failover log for the UI.
pub fn get_failover_log(router: &SharedRouter) -> Vec<String> {
    router.lock().unwrap().failover_log.clone()
}

// ============================================================
//  Universal Generate — routes to any backend
// ============================================================

pub async fn generate(cfg: &LlmConfig, system: &str, prompt: &str) -> Result<String, String> {
    match cfg.provider {
        LlmProvider::Ollama | LlmProvider::LmStudio => {
            generate_ollama(cfg, system, prompt).await
        }
        LlmProvider::Anthropic => {
            generate_anthropic(cfg, system, prompt).await
        }
        LlmProvider::GoogleGemini => {
            generate_gemini(cfg, system, prompt).await
        }
        LlmProvider::HuggingFace => {
            generate_huggingface(cfg, system, prompt).await
        }
        // All OpenAI-compatible providers
        _ => {
            generate_openai_compat(cfg, system, prompt).await
        }
    }
}

// ── Ollama / LM Studio ───────────────────────────────────────

async fn generate_ollama(cfg: &LlmConfig, system: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/generate", cfg.base_url.trim_end_matches('/'));
    let body = serde_json::json!({
        "model":  cfg.model,
        "prompt": prompt,
        "system": system,
        "stream": false,
        "options": {
            "temperature": cfg.temperature,
            "num_predict": cfg.max_tokens,
        }
    });

    let resp = client.post(&url)
        .json(&body)
        .timeout(std::time::Duration::from_secs(120))
        .send().await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama {} error: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json["response"].as_str().unwrap_or("").to_string())
}

// ── OpenAI-Compatible (OpenAI, OpenRouter, Groq, Together, Mistral, etc.) ──

async fn generate_openai_compat(cfg: &LlmConfig, system: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/v1/chat/completions", cfg.base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": cfg.model,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user",   "content": prompt }
        ],
        "temperature": cfg.temperature,
        "max_tokens":  cfg.max_tokens,
    });

    let mut req = client.post(&url)
        .json(&body)
        .timeout(std::time::Duration::from_secs(120));

    if !cfg.api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", cfg.api_key));
    }

    // OpenRouter-specific headers
    if cfg.provider == LlmProvider::OpenRouter {
        req = req.header("HTTP-Referer", "https://cutflow.SerThrocken (The Looking Glass 3D).com")
                 .header("X-Title", "CutFlow by SerThrocken (The Looking Glass 3D)");
    }

    let resp = req.send().await
        .map_err(|e| format!("{} request failed: {}", cfg.provider.display_name(), e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("{} {} error: {}", cfg.provider.display_name(), status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("");
    Ok(content.to_string())
}

// ── Anthropic (Claude) ───────────────────────────────────────

async fn generate_anthropic(cfg: &LlmConfig, system: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/v1/messages", cfg.base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": cfg.model,
        "max_tokens": cfg.max_tokens,
        "system": system,
        "messages": [
            { "role": "user", "content": prompt }
        ]
    });

    let resp = client.post(&url)
        .json(&body)
        .header("x-api-key", &cfg.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .timeout(std::time::Duration::from_secs(120))
        .send().await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic {} error: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let content = json["content"][0]["text"]
        .as_str()
        .unwrap_or("");
    Ok(content.to_string())
}

// ── Google Gemini ─────────────────────────────────────────────

async fn generate_gemini(cfg: &LlmConfig, system: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/v1beta/models/{}:generateContent?key={}",
        cfg.base_url.trim_end_matches('/'),
        cfg.model,
        cfg.api_key
    );

    let body = serde_json::json!({
        "system_instruction": {
            "parts": [{ "text": system }]
        },
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "temperature": cfg.temperature,
            "maxOutputTokens": cfg.max_tokens,
        }
    });

    let resp = client.post(&url)
        .json(&body)
        .timeout(std::time::Duration::from_secs(120))
        .send().await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Gemini {} error: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let content = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("");
    Ok(content.to_string())
}

// ── HuggingFace Inference API ─────────────────────────────────

async fn generate_huggingface(cfg: &LlmConfig, _system: &str, prompt: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/models/{}",
        cfg.base_url.trim_end_matches('/'),
        cfg.model
    );

    let body = serde_json::json!({
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": cfg.max_tokens,
            "temperature": cfg.temperature,
        }
    });

    let mut req = client.post(&url)
        .json(&body)
        .timeout(std::time::Duration::from_secs(120));

    if !cfg.api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", cfg.api_key));
    }

    let resp = req.send().await
        .map_err(|e| format!("HuggingFace request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("HuggingFace {} error: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    // HF returns array of { "generated_text": "..." }
    let content = json[0]["generated_text"]
        .as_str()
        .unwrap_or("");
    Ok(content.to_string())
}

// ============================================================
//  Backward compatibility — keep old ollama:: interface working
// ============================================================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OllamaModel {
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OllamaGenerateRequest {
    pub model:  String,
    pub prompt: String,
    pub system: Option<String>,
}

pub async fn check_ollama_running() -> bool {
    reqwest::get("http://localhost:11434/api/tags")
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

pub async fn list_ollama_models() -> Result<Vec<String>, String> {
    let resp = reqwest::get("http://localhost:11434/api/tags")
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;

    let models = resp["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|m| m["name"].as_str().map(String::from))
        .collect();

    Ok(models)
}

/// Legacy wrapper — routes through the universal generate function.
pub async fn ollama_generate(req: OllamaGenerateRequest) -> Result<String, String> {
    let cfg = LlmConfig {
        provider:    LlmProvider::Ollama,
        api_key:     String::new(),
        base_url:    "http://localhost:11434".into(),
        model:       req.model,
        temperature: 0.7,
        max_tokens:  2048,
    };
    generate(&cfg, &req.system.unwrap_or_default(), &req.prompt).await
}

pub async fn pull_ollama_model<F>(name: &str, mut on_progress: F) -> Result<(), String>
where
    F: FnMut(serde_json::Value) + Send + 'static,
{
    use futures_util::StreamExt;
    let client = reqwest::Client::new();
    let resp = client
        .post("http://localhost:11434/api/pull")
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        if let Ok(bytes) = chunk {
            if let Ok(text) = std::str::from_utf8(&bytes) {
                for line in text.lines() {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                        on_progress(json);
                    }
                }
            }
        }
    }

    Ok(())
}

/// List all supported provider names for UI display.
pub fn list_all_providers() -> Vec<(&'static str, &'static str)> {
    vec![
        ("ai21",         "AI21 Labs"),
        ("alibaba",      "Alibaba DashScope"),
        ("anthropic",    "Anthropic (Claude)"),
        ("cerebras",     "Cerebras"),
        ("cohere",       "Cohere"),
        ("custom",       "Custom Endpoint"),
        ("deepinfra",    "DeepInfra"),
        ("deepseek",     "DeepSeek"),
        ("fireworks",    "Fireworks AI"),
        ("gemini",       "Google Gemini"),
        ("glhf",         "GLHF.chat"),
        ("gpt4all",      "GPT4All (Local)"),
        ("groq",         "Groq"),
        ("huggingface",  "HuggingFace"),
        ("hyperbolic",   "Hyperbolic"),
        ("jan",          "Jan.ai (Local)"),
        ("kobold",       "KoboldCpp (Local)"),
        ("lepton",       "Lepton AI"),
        ("llamacpp",     "llama.cpp (Local)"),
        ("lmstudio",     "LM Studio (Local)"),
        ("localai",      "LocalAI (Local)"),
        ("minimax",      "MiniMax"),
        ("mistral",      "Mistral"),
        ("moonshot",     "Kimi Moonshot"),
        ("mulerouter",   "MuleRouter"),
        ("nebius",       "Nebius AI"),
        ("novita",       "Novita AI"),
        ("nvidia",       "Nvidia NIM"),
        ("ollama",       "Ollama (Local)"),
        ("openai",       "OpenAI"),
        ("openrouter",   "OpenRouter"),
        ("orcarouter",   "OrcaRouter"),
        ("perplexity",   "Perplexity"),
        ("pollinations", "Pollinations.ai (Free)"),
        ("sambanova",    "SambaNova"),
        ("stepfun",      "StepFun"),
        ("tabby",        "TabbyAPI (Local)"),
        ("together_ai",  "Together AI"),
        ("vllm",         "vLLM (Local/Cloud)"),
    ]
}
