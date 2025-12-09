import {
  IImageService,
  ImageGenerationRequest,
  ImageGenerationResult,
  Paper2SlidesSettings,
  ResolutionType,
  ThemeType,
} from '../../types';
import { AIProviderFactory } from '../../services';
import { AIProviderService } from '../../services/AIProviderService';

/**
 * Image Service (Stage 4)
 * Generates AI-powered images for slide content
 */
export class ImageService implements IImageService {
  private aiProvider: AIProviderService;
  private settings: Paper2SlidesSettings;

  constructor(settings: Paper2SlidesSettings) {
    this.settings = settings;
    this.aiProvider = AIProviderFactory.createImageProvider(settings);
  }

  /**
   * Generate a single image
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return this.generateWithRetry(request, 0);
  }

  /**
   * Generate multiple images with optional parallel processing
   */
  async generateImages(
    requests: ImageGenerationRequest[],
    parallel: boolean
  ): Promise<ImageGenerationResult[]> {
    if (parallel) {
      // Parallel generation with worker limit
      const workers = this.settings.parallelWorkers || 3;
      const results: ImageGenerationResult[] = [];

      for (let i = 0; i < requests.length; i += workers) {
        const batch = requests.slice(i, i + workers);
        const batchResults = await Promise.all(
          batch.map((req) => this.generateImage(req))
        );
        results.push(...batchResults);
      }

      return results;
    } else {
      // Sequential generation
      const results: ImageGenerationResult[] = [];
      for (const request of requests) {
        const result = await this.generateImage(request);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Generate image with automatic retry on failure
   */
  private async generateWithRetry(
    request: ImageGenerationRequest,
    retryCount: number
  ): Promise<ImageGenerationResult> {
    const maxRetries = this.settings.autoRetryCount || 3;

    try {
      // Build enhanced prompt with style and theme
      const enhancedPrompt = this.buildImagePrompt(request);

      // Get resolution dimensions
      const dimensions = this.getImageDimensions(request.resolution);

      // Call AI provider to generate image
      const response = await this.aiProvider.generateImage({
        prompt: enhancedPrompt,
        width: dimensions.width,
        height: dimensions.height,
        quality: 'hd',
      });

      // Return result
      return {
        slideNumber: request.slideNumber,
        imageData: response.imageData, // base64 encoded
        mimeType: response.mimeType || 'image/png',
        metadata: {
          generatedAt: new Date().toISOString(),
          prompt: enhancedPrompt,
          resolution: request.resolution,
          retryCount,
        },
      };
    } catch (error) {
      // Retry logic
      if (retryCount < maxRetries) {
        console.warn(
          `Image generation failed for slide ${request.slideNumber}, retrying... (${retryCount + 1}/${maxRetries})`
        );
        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, retryCount) * 1000);
        return this.generateWithRetry(request, retryCount + 1);
      } else {
        // Max retries reached, return placeholder
        console.error(
          `Image generation failed for slide ${request.slideNumber} after ${maxRetries} retries:`,
          error
        );
        return this.generatePlaceholder(request, retryCount);
      }
    }
  }

  /**
   * Build enhanced image generation prompt
   */
  private buildImagePrompt(request: ImageGenerationRequest): string {
    const { prompt, theme, style } = request;

    // Theme-specific style guides
    const themeStyles: Record<ThemeType, string> = {
      academic: 'professional, scholarly, clean design, muted colors, academic illustration style',
      doraemon: 'cute, colorful, playful, cartoon-style, Doraemon-inspired aesthetics',
      minimalist: 'minimalist, simple, clean lines, modern, flat design, limited color palette',
      corporate: 'professional, business-appropriate, polished, corporate design, modern aesthetics',
      creative: 'creative, artistic, vibrant colors, unique composition, innovative design',
    };

    const themeGuide = themeStyles[theme] || themeStyles.minimalist;
    const customStyle = style || '';

    return `${prompt}

Style: ${themeGuide}${customStyle ? `, ${customStyle}` : ''}

Requirements:
- High quality, professional illustration
- Suitable for presentation slides
- Clear visual hierarchy
- Avoid text overlays
- Focus on visual storytelling`;
  }

  /**
   * Get image dimensions based on resolution type
   */
  private getImageDimensions(resolution: ResolutionType): { width: number; height: number } {
    const aspectRatio = 16 / 9; // Standard presentation aspect ratio

    switch (resolution) {
      case '1K':
        return { width: 1280, height: Math.round(1280 / aspectRatio) }; // 1280x720
      case '2K':
        return { width: 2560, height: Math.round(2560 / aspectRatio) }; // 2560x1440
      case '4K':
        return { width: 3840, height: Math.round(3840 / aspectRatio) }; // 3840x2160
      default:
        return { width: 1280, height: 720 };
    }
  }

  /**
   * Generate placeholder image when generation fails
   */
  private generatePlaceholder(
    request: ImageGenerationRequest,
    retryCount: number
  ): ImageGenerationResult {
    // Create a simple SVG placeholder
    const dimensions = this.getImageDimensions(request.resolution);
    const svg = `
<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#666" text-anchor="middle">
    Image Placeholder
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="24" fill="#999" text-anchor="middle">
    (Generation failed after ${retryCount} retries)
  </text>
</svg>`;

    // Convert SVG to base64
    const base64 = Buffer.from(svg).toString('base64');

    return {
      slideNumber: request.slideNumber,
      imageData: base64,
      mimeType: 'image/svg+xml',
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: request.prompt,
        resolution: request.resolution,
        retryCount,
      },
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
