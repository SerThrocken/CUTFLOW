// ===== LOCAL MODEL MANAGEMENT SYSTEM =====

export interface LocalModel {
  id: string;
  name: string;
  description: string;
  size: number; // in MB
  quantization: 'fp32' | 'fp16' | 'q8_0' | 'q5_1' | 'q4_0' | 'q4_1'; // GGUF formats
  vramRequired: number; // in GB
  ramRequired: number; // in GB
  cpuMinGen: string; // e.g., "i7-8700K", "Ryzen 5 3600"
  downloadUrl: string;
  huggingfaceRepo: string;
  modelType: 'text-generation' | 'vision' | 'multimodal' | 'embedding' | 'voiceover';
  capabilities: string[];
  performance: {
    tokensPerSecond: number;
    inferenceTime: number; // ms
  };
  installed: boolean;
  localPath?: string;
}

export interface SystemSpecs {
  gpuVram: number; // in GB
  cpuGeneration: string;
  ramAvailable: number; // in GB
  osType: 'windows' | 'macos' | 'linux';
}

// ===== RECOMMENDED MODELS FOR RTX 3060 + i7 =====

export const RECOMMENDED_MODELS: Record<string, LocalModel> = {
  // Text Generation - Balanced
  'mistral-7b-instruct-q4': {
    id: 'mistral-7b-q4',
    name: 'Mistral 7B Instruct (Q4)',
    description: 'Fast, instruction-tuned model perfect for scripts and prompts',
    size: 3850, // MB
    quantization: 'q4_0',
    vramRequired: 5,
    ramRequired: 8,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/Mistral-7B-Instruct-v0.1.Q4_K_M.gguf',
    huggingfaceRepo: 'TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
    modelType: 'text-generation',
    capabilities: ['script-generation', 'prompt-expansion', 'dialogue-writing'],
    performance: {
      tokensPerSecond: 35,
      inferenceTime: 28,
    },
    installed: false,
  },

  'neural-chat-7b-q4': {
    id: 'neural-chat-7b-q4',
    name: 'Neural Chat 7B (Q4)',
    description: 'Conversational AI trained for dialogue and creative writing',
    size: 3900,
    quantization: 'q4_0',
    vramRequired: 5,
    ramRequired: 8,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/TheBloke/neural-chat-7B-v3-2-GGUF/resolve/main/neural-chat-7B-v3-2.Q4_K_M.gguf',
    huggingfaceRepo: 'TheBloke/neural-chat-7B-v3-2-GGUF',
    modelType: 'text-generation',
    capabilities: ['dialogue', 'creative-writing', 'brainstorming'],
    performance: {
      tokensPerSecond: 38,
      inferenceTime: 26,
    },
    installed: false,
  },

  // Text Generation - Lightweight
  'phi-2-q4': {
    id: 'phi-2-q4',
    name: 'Phi 2 (Q4)',
    description: 'Lightweight 2.7B model - fastest option, ideal for quick scripts',
    size: 1580,
    quantization: 'q4_0',
    vramRequired: 3,
    ramRequired: 6,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    huggingfaceRepo: 'TheBloke/phi-2-GGUF',
    modelType: 'text-generation',
    capabilities: ['quick-scripts', 'prompts', 'summaries'],
    performance: {
      tokensPerSecond: 52,
      inferenceTime: 19,
    },
    installed: false,
  },

  // Text Generation - High Quality
  'llama2-13b-q4': {
    id: 'llama2-13b-q4',
    name: 'Llama 2 13B (Q4)',
    description: 'Meta\'s powerful 13B model - best quality, requires more VRAM',
    size: 7660,
    quantization: 'q4_0',
    vramRequired: 9,
    ramRequired: 12,
    cpuMinGen: 'i7-9700K',
    downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-13B-chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf',
    huggingfaceRepo: 'TheBloke/Llama-2-13B-chat-GGUF',
    modelType: 'text-generation',
    capabilities: ['advanced-scripts', 'complex-prompts', 'editing'],
    performance: {
      tokensPerSecond: 22,
      inferenceTime: 45,
    },
    installed: false,
  },

  // Vision/Multimodal
  'llava-1.5-7b-q4': {
    id: 'llava-7b-q4',
    name: 'LLaVA 1.5 7B (Q4)',
    description: 'Vision-language model for video scene analysis and image understanding',
    size: 4900,
    quantization: 'q4_0',
    vramRequired: 6,
    ramRequired: 10,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/mys/ggml_llava-1.5-7b/resolve/main/ggml-model-q4_0.gguf',
    huggingfaceRepo: 'mys/ggml_llava-1.5-7b',
    modelType: 'vision',
    capabilities: ['scene-analysis', 'object-detection', 'video-description'],
    performance: {
      tokensPerSecond: 25,
      inferenceTime: 40,
    },
    installed: false,
  },

  // Code Generation
  'starling-lm-7b-q4': {
    id: 'starling-7b-q4',
    name: 'Starling LM 7B (Q4)',
    description: 'Instruction-tuned for technical and creative tasks',
    size: 3850,
    quantization: 'q4_0',
    vramRequired: 5,
    ramRequired: 8,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/TheBloke/Starling-LM-7B-beta-GGUF/resolve/main/starling-lm-7b-beta.Q4_K_M.gguf',
    huggingfaceRepo: 'TheBloke/Starling-LM-7B-beta-GGUF',
    modelType: 'text-generation',
    capabilities: ['script-generation', 'editing-instructions', 'voiceover-scripts'],
    performance: {
      tokensPerSecond: 36,
      inferenceTime: 28,
    },
    installed: false,
  },

  // Embedding Model (for semantic search in video projects)
  'nomic-embed-text-v1-q8': {
    id: 'nomic-embed-q8',
    name: 'Nomic Embed Text (Q8)',
    description: 'Lightweight embedding model for semantic search in projects',
    size: 274,
    quantization: 'q8_0',
    vramRequired: 1,
    ramRequired: 4,
    cpuMinGen: 'i7-8700K',
    downloadUrl: 'https://huggingface.co/nomic-ai/nomic-embed-text-v1.5/resolve/main/nomic-embed-text-v1.5.Q8_0.gguf',
    huggingfaceRepo: 'nomic-ai/nomic-embed-text-v1.5',
    modelType: 'embedding',
    capabilities: ['semantic-search', 'project-indexing'],
    performance: {
      tokensPerSecond: 0,
      inferenceTime: 10,
    },
    installed: false,
  },
};

// ===== MODEL COMPATIBILITY CHECKER =====

export class ModelCompatibilityChecker {
  private systemSpecs: SystemSpecs;

  constructor(specs: SystemSpecs) {
    this.systemSpecs = specs;
  }

  isModelCompatible(model: LocalModel): boolean {
    // Check VRAM
    if (model.vramRequired > this.systemSpecs.gpuVram) {
      return false;
    }

    // Check RAM
    if (model.ramRequired > this.systemSpecs.ramAvailable) {
      return false;
    }

    // Check CPU generation (simplified)
    if (!this.isCpuGenSufficient(model.cpuMinGen)) {
      return false;
    }

    return true;
  }

  private isCpuGenSufficient(requiredGen: string): boolean {
    // Parse generation number from CPU string
    const match = requiredGen.match(/i7|i9|Ryzen 5|Ryzen 7|Ryzen 9/i);
    if (!match) return true; // Assume compatible if can't parse

    // Simplified: If i7 or higher, compatible with i7+
    return /i7|i9|Ryzen 7|Ryzen 9/i.test(this.systemSpecs.cpuGeneration);
  }

  getCompatibleModels(): LocalModel[] {
    return Object.values(RECOMMENDED_MODELS).filter(m => this.isModelCompatible(m));
  }

  getRecommendedModel(): LocalModel | null {
    const compatible = this.getCompatibleModels();
    if (compatible.length === 0) return null;

    // Recommend fastest for given specs
    return compatible.reduce((best, current) =>
      current.performance.tokensPerSecond > best.performance.tokensPerSecond ? current : best
    );
  }

  getModelSize(model: LocalModel): string {
    return (model.size / 1024).toFixed(1) + ' GB';
  }
}

// ===== OLLAMA INTEGRATION =====

export interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modifiedAt: string;
}

export class OllamaManager {
  private ollamaUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.ollamaUrl = baseUrl;
  }

  async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async pullModel(modelName: string, onProgress?: (status: string) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.body) return false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onProgress?.(data.status);
          } catch {
            // Skip unparseable lines
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete model:', error);
      return false;
    }
  }

  async generateCompletion(
    model: string,
    prompt: string,
    options: any = {}
  ): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          ...options,
        }),
      });

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Failed to generate completion:', error);
      throw error;
    }
  }

  async chat(model: string, messages: any[], options: any = {}): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          ...options,
        }),
      });

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Failed to chat:', error);
      throw error;
    }
  }
}

export default {
  RECOMMENDED_MODELS,
  ModelCompatibilityChecker,
  OllamaManager,
};
