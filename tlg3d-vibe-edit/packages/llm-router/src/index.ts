// ===== LLM PROVIDER ROUTER =====
// Abstracts across multiple LLM providers

import axios from 'axios';

class LLMRouter {
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

  async chat(
    provider: string,
    model: string,
    messages: any[],
    options: any = {}
  ): Promise<string> {
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

  private async openrouterChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.openrouter}`,
        'HTTP-Referer': 'https://cutflow.dev',
      }
    });
    return response.data.choices[0].message.content;
  }

  private async openaiChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.openai}`,
      }
    });
    return response.data.choices[0].message.content;
  }

  private async mistralChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.mistral}`,
      }
    });
    return response.data.choices[0].message.content;
  }

  private async groqChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.groq}`,
      }
    });
    return response.data.choices[0].message.content;
  }

  private async deepseekChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.deepseek}`,
      }
    });
    return response.data.choices[0].message.content;
  }

  private async cohereChat(
    model: string,
    messages: any[],
    options: any
  ): Promise<string> {
    const messageText = messages.map(m => m.content).join('\n');
    const response = await axios.post('https://api.cohere.ai/v1/generate', {
      prompt: messageText,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${this.providers.cohere}`,
      }
    });
    return response.data.generations[0].text;
  }
}

export default new LLMRouter();
