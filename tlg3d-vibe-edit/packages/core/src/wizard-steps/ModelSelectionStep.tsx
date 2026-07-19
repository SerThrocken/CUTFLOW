// ===== WIZARD STEP 4: MODEL SELECTION =====

import React, { useState } from 'react';
import { Card, Button, Input, Badge, Alert, Radio } from '@tlg3d/core/ui-components';
import type { SetupWizardState, SystemInfo } from '@tlg3d/core/setup-wizard-types';

export const ModelSelectionStep: React.FC<{
  state: SetupWizardState;
  setState: (fn: (s: SetupWizardState) => SetupWizardState) => void;
  systemInfo: SystemInfo | null;
}> = ({ state, setState, systemInfo }) => {
  const [providerExpanded, setProviderExpanded] = useState<string | null>(null);

  const handleProviderChange = (provider: string) => {
    setState(prev => ({
      ...prev,
      llmConfig: { ...prev.llmConfig, primaryProvider: provider as any },
    }));
    setProviderExpanded(provider);
  };

  const handleAPIKeyChange = (provider: string, key: string) => {
    setState(prev => ({
      ...prev,
      llmConfig: {
        ...prev.llmConfig,
        apiKeys: { ...prev.llmConfig.apiKeys, [provider]: key },
      },
    }));
  };

  const handleLocalModelsToggle = () => {
    setState(prev => ({
      ...prev,
      llmConfig: { ...prev.llmConfig, localModelsEnabled: !prev.llmConfig.localModelsEnabled },
    }));
  };

  const providers = [
    {
      id: 'ai21',
      name: 'AI21 Labs',
      description: 'Jurassic and Jamba models directly',
      icon: '🦁',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'alibaba',
      name: 'Alibaba DashScope',
      description: 'Qwen models via DashScope API',
      icon: '🇨🇳',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3.5 Sonnet, Claude 3 Opus',
      icon: '🧠',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'cerebras',
      name: 'Cerebras',
      description: 'Ultra-fast Llama-3 inference on hardware',
      icon: '🧇',
      cost: 'Free/Paid',
      setup: 'Fast',
      speed: 'Extremely Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Command R+ and Command R models',
      icon: '🕸️',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'deepinfra',
      name: 'DeepInfra',
      description: 'Highly affordable serverless LLM hosting',
      icon: '🐳',
      cost: 'Very Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'High-quality Chinese open models',
      icon: '🐋',
      cost: 'Very Cheap',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'fireworks',
      name: 'Fireworks AI',
      description: 'Fast open-source model inference',
      icon: '🎆',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'glhf',
      name: 'GLHF.chat',
      description: 'Highly affordable endpoints for open models',
      icon: '🎮',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini 1.5 Pro & Flash via AI Studio',
      icon: '♊',
      cost: 'Free Tier / Paid',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'gpt4all',
      name: 'GPT4All (Local)',
      description: 'Local private models via GPT4All app',
      icon: '🤖',
      cost: 'Free',
      setup: 'Easy',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'groq',
      name: 'Groq',
      description: 'Ultra-fast LPU inference (Llama-3, Mixtral)',
      icon: '⚡',
      cost: 'Free Tier / Paid',
      setup: 'Fast',
      speed: 'Extremely Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      description: 'Serverless API or Dedicated Endpoints',
      icon: '🤗',
      cost: 'Free / Paid',
      setup: 'Fast',
      speed: 'Moderate',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'hyperbolic',
      name: 'Hyperbolic',
      description: 'Affordable open-access GPU computing',
      icon: '📐',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'jan',
      name: 'Jan.ai (Local)',
      description: 'Local desktop AI runner (OpenAI compatible)',
      icon: '📁',
      cost: 'Free',
      setup: 'Easy',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'kobold',
      name: 'KoboldCpp (Local)',
      description: 'Private backend for GGUF models',
      icon: '🐉',
      cost: 'Free',
      setup: 'Moderate',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'lepton',
      name: 'Lepton AI',
      description: 'Serverless AI engine for custom models',
      icon: '🦊',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'llamacpp',
      name: 'llama.cpp (Local)',
      description: 'Raw local model server',
      icon: '🦙',
      cost: 'Free',
      setup: 'Advanced',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'lmstudio',
      name: 'LM Studio (Local)',
      description: 'Run any GGUF local model offline',
      icon: '💻',
      cost: 'Free',
      setup: 'Easy',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'local',
      name: 'Local Models (Ollama)',
      description: 'Offline agentic editing powered by local Ollama',
      icon: '🖥️',
      cost: 'Free',
      setup: 'Easy',
      speed: systemInfo?.supportLevel === 'optimal' ? 'Fast' : 'Moderate',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'localai',
      name: 'LocalAI (Local)',
      description: 'Open-source local AI substitute for OpenAI',
      icon: '🏠',
      cost: 'Free',
      setup: 'Moderate',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'minimax',
      name: 'MiniMax',
      description: 'ABAB series and voice models',
      icon: '👾',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'Mistral Large, Small and Codestral models',
      icon: '🎯',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'moonshot',
      name: 'Moonshot (Kimi)',
      description: 'Long-context Kimi models',
      icon: '🌙',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'mulerouter',
      name: 'MuleRouter',
      description: 'Load balanced routing for cloud models',
      icon: '🐴',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'nebius',
      name: 'Nebius AI',
      description: 'Hyper-scalable cloud platform for AI inference',
      icon: '☁️',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'novita',
      name: 'Novita AI',
      description: 'Fast and cheap API key endpoints for open models',
      icon: '🌌',
      cost: 'Very Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'nvidia',
      name: 'Nvidia NIM',
      description: 'Enterprise NIM containers and cloud API',
      icon: '🟢',
      cost: 'Free Trial / Paid',
      setup: 'Fast',
      speed: 'Extremely Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4o-mini via official API',
      icon: '🤖',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'Unified gateway for 100+ open and closed models',
      icon: '🚀',
      cost: 'Free & Paid Models',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'orcarouter',
      name: 'OrcaRouter',
      description: 'Advanced routing with smart model load balancing',
      icon: '🐳',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Sonar online LLMs for real-time information lookup',
      icon: '🔍',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'pollinations',
      name: 'Pollinations.ai',
      description: 'Completely free chat and image generation API',
      icon: '🌸',
      cost: 'Free (No Key Req)',
      setup: 'Instant',
      speed: 'Moderate',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'sambanova',
      name: 'SambaNova',
      description: 'Fastest Llama-3 inference on SambaNova Reconfigurable Dataflow Unit',
      icon: '🎷',
      cost: 'Free Tier / Paid',
      setup: 'Fast',
      speed: 'Extremely Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'stepfun',
      name: 'StepFun',
      description: 'Multimodal Step models',
      icon: '🧗',
      cost: 'Paid',
      setup: 'Fast',
      speed: 'Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'tabby',
      name: 'TabbyAPI (Local)',
      description: 'ExLlamaV2 engine local server',
      icon: '🐱',
      cost: 'Free',
      setup: 'Advanced',
      speed: 'Local GPU dependent',
      requiresKey: false,
      requiresInternet: false,
    },
    {
      id: 'together_ai',
      name: 'Together AI',
      description: 'RedPajama, Llama and Mistral models',
      icon: '🤝',
      cost: 'Cheap',
      setup: 'Fast',
      speed: 'Very Fast',
      requiresKey: true,
      requiresInternet: true,
    },
    {
      id: 'vllm',
      name: 'vLLM (Local/Cloud)',
      description: 'High-throughput local engine',
      icon: '📦',
      cost: 'Free',
      setup: 'Advanced',
      speed: 'Extremely Fast',
      requiresKey: false,
      requiresInternet: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Choose Your Primary LLM Provider</h3>
        <p className="text-gray-400 mb-4">You can change this anytime in Settings</p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {providers.map(provider => {
          const isSelected = state.llmConfig.primaryProvider === provider.id;
          const isExpanded = providerExpanded === provider.id;

          return (
            <div
              key={provider.id}
              className={`border-2 rounded-lg transition-all ${
                isSelected ? 'border-green-600 bg-gray-800' : 'border-gray-700 bg-gray-900'
              }`}
            >
              {/* Header */}
              <div
                onClick={() => handleProviderChange(provider.id)}
                className={`p-4 cursor-pointer ${isSelected ? 'hover:bg-gray-700' : 'hover:bg-gray-800'} transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => handleProviderChange(provider.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-100">{provider.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="accent" size="sm">
                          {provider.cost}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {provider.speed}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && isSelected && (
                <div className="border-t border-gray-700 p-4 bg-gray-900 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Setup Time:</span>
                      <p className="text-gray-300 font-medium">{provider.setup}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Internet Required:</span>
                      <p className="text-gray-300 font-medium">{provider.requiresInternet ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {provider.requiresKey && (
                    <>
                      <Input
                        label={`${provider.name} API Key`}
                        type="password"
                        placeholder={provider.id === 'pollinations' ? 'Optional (Any dummy key / empty)' : 'sk-...'}
                        value={state.llmConfig.apiKeys[provider.id] || ''}
                        onChange={e => handleAPIKeyChange(provider.id, e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => {
                          const urls: Record<string, string> = {
                            ai21: 'https://studio.ai21.com/account/api-key',
                            alibaba: 'https://dashscope.console.aliyun.com/apiKey',
                            anthropic: 'https://console.anthropic.com/settings/keys',
                            cerebras: 'https://cloud.cerebras.ai/',
                            cohere: 'https://dashboard.cohere.com/api-keys',
                            deepinfra: 'https://deepinfra.com/dash/api_keys',
                            deepseek: 'https://platform.deepseek.com/api_keys',
                            fireworks: 'https://fireworks.ai/account/api-keys',
                            glhf: 'https://glhf.chat/users/settings/api-keys',
                            gemini: 'https://aistudio.google.com/app/apikey',
                            groq: 'https://console.groq.com/keys',
                            huggingface: 'https://huggingface.co/settings/tokens',
                            hyperbolic: 'https://app.hyperbolic.xyz/settings',
                            lepton: 'https://dashboard.lepton.ai/settings',
                            minimax: 'https://platform.minimaxi.com/user-center/basic-information/api-key',
                            mistral: 'https://console.mistral.ai/api-keys/',
                            moonshot: 'https://platform.moonshot.cn/console/api-keys',
                            mulerouter: 'https://mulerouter.com/',
                            nebius: 'https://console.nebius.ai/',
                            novita: 'https://novita.ai/dashboard/keys',
                            nvidia: 'https://build.nvidia.com/',
                            openai: 'https://platform.openai.com/api-keys',
                            openrouter: 'https://openrouter.ai/keys',
                            orcarouter: 'https://orcarouter.com/',
                            perplexity: 'https://www.perplexity.ai/settings/api',
                            pollinations: 'https://pollinations.ai/',
                            sambanova: 'https://cloud.sambanova.ai/apis',
                            stepfun: 'https://platform.stepfun.com/',
                            together_ai: 'https://api.together.xyz/settings/api-keys',
                          };
                          window.open(urls[provider.id], '_blank');
                        }}
                      >
                        Get API Key →
                      </Button>
                    </>
                  )}

                  {provider.id === 'local' && (
                    <Alert type="info" icon="ℹ️" dismissible={false}>
                      <p className="text-sm">
                        Requires Ollama installation. You'll download models after setup. Internet optional.
                      </p>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Alert type="info" icon="💡" dismissible={false}>
        <p className="text-sm font-medium mb-1">Recommendation for Your System:</p>
        <p className="text-sm">
          {systemInfo?.supportLevel === 'optimal'
            ? 'Your system supports local models! Consider using Ollama for privacy and cost savings.'
            : 'Your system can run lightweight local models, or use cloud providers for better quality.'}
        </p>
      </Alert>
    </div>
  );
};

export default ModelSelectionStep;
