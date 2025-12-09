/**
 * Abstract interface for AI Provider services
 * Defines the contract that all AI providers must implement
 */

export interface TextGenerationRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface TextGenerationResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResponse {
  imageData: string; // base64 encoded image data
  mimeType: string; // image/png or image/jpeg
  imageUrl?: string; // optional URL if provider returns URL
  revisedPrompt?: string;
}

/**
 * Abstract base class for AI providers
 * All provider implementations should extend this class
 */
export abstract class AIProviderService {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate text using the AI model
   */
  abstract generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;

  /**
   * Generate an image using the AI model
   */
  abstract generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;

  /**
   * Validate API key and connectivity
   */
  abstract validateConnection(): Promise<boolean>;

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;
}
