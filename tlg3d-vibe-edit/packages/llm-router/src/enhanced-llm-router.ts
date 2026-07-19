// ===== ENHANCED LLM ROUTER WITH LOCAL MODEL SUPPORT =====

import axios from 'axios';
import { OllamaManager } from './local-models';

class EnhancedLLMRouter {
  private providers = {
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    groq: process.env.GROQ_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
    cohere: process.env.COHERE_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };

  private ollamaManager = new OllamaManager();

  async chat(
    provider: string,
    model: string,
    messages: any[],
    options: any = {}
  ): Promise<string> {
    // If provider is 'local', use Ollama
    if (provider.toLowerCase() === 'local' || provider.toLowerCase() === 'ollama') {
      return this.ollamaChat(model, messages, options);
    }

    // Otherwise use cloud providers
    switch (provider.toLowerCase()) {
      case 'openrouter':
        return this.openrouterChat(model, messages, options);
      case 'openai':
        return this.openaiChat(model, messages, options);
      case 'mistral':
        return this.mistralChat(model, messages, options);
      case 'groq':
        return this.groqChat(model, messages, options);
      case 'deepseek':
        return this.deepseekChat(model, messages, options);
      case 'cohere':
        return this.cohereChat(model, messages, options);
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  // ===== LOCAL MODEL SUPPORT (OLLAMA) =====
  private async ollamaChat(model: string, messages: any[], options: any): Promise<string> {
    try {
      const isRunning = await this.ollamaManager.isOllamaRunning();
      if (!isRunning) {
        throw new Error('Ollama service is not running. Start it with: ollama serve');
      }

      // Format messages for Ollama
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await this.ollamaManager.chat(model, formattedMessages, {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 512,
      });

      return response;
    } catch (error) {
      console.error('[Ollama] Error:', error);
      throw new Error(`Ollama error: ${(error as Error).message}`);
    }
  }

  // ===== CLOUD PROVIDER METHODS =====
  private async openrouterChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.openrouter}`,
          'HTTP-Referer': 'https://cutflow.dev',
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  private async openaiChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.openai}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  private async mistralChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.mistral}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  private async groqChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.groq}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  private async deepseekChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.deepseek}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  }

  private async cohereChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const messageText = messages.map(m => m.content).join('\n');
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        prompt: messageText,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.providers.cohere}`,
        },
      }
    );
    return response.data.generations[0].text;
  }

  // ===== UTILITY METHODS =====

  /**
   * Try local model first, fallback to cloud provider
   */
  async chatWithFallback(
    localModel: string,
    cloudProvider: string,
    cloudModel: string,
    messages: any[],
    options: any = {}
  ): Promise<{ content: string; source: 'local' | 'cloud' }> {
    try {
      const content = await this.ollamaChat(localModel, messages, options);
      return { content, source: 'local' };
    } catch (error) {
      console.warn(`[LLMRouter] Local model failed, falling back to ${cloudProvider}`);
      try {
        const content = await this.chat(cloudProvider, cloudModel, messages, options);
        return { content, source: 'cloud' };
      } catch (cloudError) {
        throw new Error(`Both local and cloud models failed: ${(cloudError as Error).message}`);
      }
    }
  }

  /**
   * Detect best model based on system and use case
   */
  async generateScriptOptimized(
    prompt: string,
    localModelsAvailable: boolean = false,
    useCase: 'quick' | 'quality' = 'quality'
  ): Promise<string> {
    const systemPrompt = `You are a professional video script writer. Create engaging, concise scripts for video content.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    if (localModelsAvailable) {
      // Use fast local model for quick scripts, quality for others
      const localModel = useCase === 'quick' ? 'phi-2:latest' : 'mistral:latest';
      return this.ollamaChat(localModel, messages, { temperature: 0.7, maxTokens: 1500 });
    } else {
      // Fallback to cloud
      return this.openrouterChat(
        'meta-llama/llama-2-70b-chat',
        messages,
        { temperature: 0.7, maxTokens: 1500 }
      );
    }
  }
}

export default new EnhancedLLMRouter();
