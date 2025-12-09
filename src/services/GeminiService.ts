import {
  AIProviderService,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './AIProviderService';
import { requestUrl } from 'obsidian';

/**
 * Google Gemini API Service
 * Handles text generation and image generation using Gemini models
 */
export class GeminiService extends AIProviderService {
  private textModel: string;
  private imageModel: string;

  constructor(apiKey: string, baseUrl: string, textModel: string, imageModel: string) {
    super(apiKey, baseUrl);
    this.textModel = textModel;
    this.imageModel = imageModel;
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Test API connectivity with a simple request
      const response = await requestUrl({
        url: `${this.baseUrl}/models/${this.textModel}:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection' }]
          }]
        }),
        throw: false,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Gemini connection validation failed:', error);
      return false;
    }
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const contents: Array<{ role: string; parts: { text: string }[] }> = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: request.systemPrompt }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand. I will follow these instructions.' }]
        });
      }

      // Add the actual prompt
      contents.push({
        role: 'user',
        parts: [{ text: request.prompt }]
      });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        }
      };

      const response = await requestUrl({
        url: `${this.baseUrl}/models/${this.textModel}:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini');
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      return {
        text: generatedText,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error) {
      console.error('Gemini text generation error:', error);
      throw new Error(`Gemini text generation failed: ${error.message}`);
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Gemini's Imagen API for image generation
      const requestBody = {
        prompt: request.prompt,
        n: 1,
        size: `${request.width || 1280}x${request.height || 720}`,
      };

      const response = await requestUrl({
        url: `${this.baseUrl}/models/${this.imageModel}:generateImages?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;

      if (!data.images || data.images.length === 0) {
        throw new Error('No image generated from Gemini');
      }

      // TODO: Convert imageUrl to base64 imageData
      const imageUrl = data.images[0].imageUri || data.images[0].image;

      return {
        imageData: '', // TODO: Fetch URL and convert to base64
        mimeType: 'image/png',
        imageUrl,
        revisedPrompt: data.images[0].safetyRatings ? undefined : request.prompt,
      };
    } catch (error) {
      console.error('Gemini image generation error:', error);
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }
}
