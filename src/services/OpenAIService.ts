import {
  AIProviderService,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './AIProviderService';
import { requestUrl } from 'obsidian';

/**
 * OpenAI API Service
 * Handles text generation (ChatGPT) and image generation (DALL-E)
 */
export class OpenAIService extends AIProviderService {
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    super(apiKey, baseUrl);
    this.model = model;
  }

  getProviderName(): string {
    return 'OpenAI';
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
      console.error('OpenAI connection validation failed:', error);
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
        throw new Error('No response generated from OpenAI');
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
      console.error('OpenAI text generation error:', error);
      throw new Error(`OpenAI text generation failed: ${error.message}`);
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // DALL-E API for image generation
      const requestBody = {
        model: 'dall-e-3', // Use DALL-E 3 for best quality
        prompt: request.prompt,
        n: 1,
        size: this.getSizeString(request.width, request.height),
        quality: request.quality || 'standard',
      };

      const response = await requestUrl({
        url: `${this.baseUrl}/images/generations`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;

      if (!data.data || data.data.length === 0) {
        throw new Error('No image generated from OpenAI');
      }

      // TODO: Convert imageUrl to base64 imageData
      const imageUrl = data.data[0].url;

      return {
        imageData: '', // TODO: Fetch URL and convert to base64
        mimeType: 'image/png',
        imageUrl,
        revisedPrompt: data.data[0].revised_prompt,
      };
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw new Error(`OpenAI image generation failed: ${error.message}`);
    }
  }

  /**
   * Convert width/height to DALL-E size string
   */
  private getSizeString(width?: number, height?: number): string {
    // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
    // Default to landscape format closest to requested dimensions
    if (!width && !height) {
      return '1792x1024'; // Default landscape for presentations
    }

    const aspectRatio = (width || 1280) / (height || 720);

    if (aspectRatio > 1.5) {
      return '1792x1024'; // Wide landscape
    } else if (aspectRatio < 0.67) {
      return '1024x1792'; // Portrait
    } else {
      return '1024x1024'; // Square
    }
  }
}
