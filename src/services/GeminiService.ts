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
      // Determine aspect ratio from width/height
      const width = request.width || 1280;
      const height = request.height || 720;
      const ratio = width / height;

      // Map to closest Gemini aspect ratio
      let aspectRatio = '16:9';
      if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1';
      else if (Math.abs(ratio - 4/3) < 0.1) aspectRatio = '4:3';
      else if (Math.abs(ratio - 3/4) < 0.1) aspectRatio = '3:4';
      else if (Math.abs(ratio - 16/9) < 0.1) aspectRatio = '16:9';
      else if (Math.abs(ratio - 9/16) < 0.1) aspectRatio = '9:16';

      // Determine resolution tier
      let imageSize = '1K';
      if (width >= 3840) imageSize = '4K';
      else if (width >= 2560) imageSize = '2K';
      else imageSize = '1K';

      // Gemini's native image generation API structure
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [{
            text: request.prompt
          }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          }
        }
      };

      const response = await requestUrl({
        url: `${this.baseUrl}/models/${this.imageModel}:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = response.json;

      // Extract image from response
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      const parts = data.candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('No parts in Gemini response');
      }

      // Find the image part
      const imagePart = parts.find((part: any) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data in Gemini response');
      }

      return {
        imageData: imagePart.inlineData.data, // Already base64 encoded
        mimeType: imagePart.inlineData.mimeType || 'image/png',
      };
    } catch (error) {
      console.error('Gemini image generation error:', error);
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }
}
