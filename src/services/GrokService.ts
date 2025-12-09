import {
  AIProviderService,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './AIProviderService';
import { requestUrl } from 'obsidian';

/**
 * Grok (X.AI) API Service
 * Handles text generation using Grok models
 * Uses OpenAI-compatible API format
 */
export class GrokService extends AIProviderService {
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    super(apiKey, baseUrl);
    this.model = model;
  }

  getProviderName(): string {
    return 'Grok (X.AI)';
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Test API connectivity
      const response = await requestUrl({
        url: `${this.baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: 'Test connection' }
          ],
          max_tokens: 10,
        }),
        throw: false,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Grok connection validation failed:', error);
      return false;
    }
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const messages: Array<{ role: string; content: string }> = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user prompt
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const requestBody = {
        model: this.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
      };

      const response = await requestUrl({
        url: `${this.baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from Grok');
      }

      const generatedText = data.choices[0].message.content;

      return {
        text: generatedText,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    } catch (error) {
      console.error('Grok text generation error:', error);
      throw new Error(`Grok text generation failed: ${error.message}`);
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Grok currently does not support native image generation
    // This is a placeholder for future implementation
    throw new Error('Grok does not currently support image generation. Please use Gemini or OpenAI for image generation.');
  }
}
