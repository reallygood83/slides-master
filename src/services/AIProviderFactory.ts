import { AIProviderService } from './AIProviderService';
import { GeminiService } from './GeminiService';
import { GrokService } from './GrokService';
import { OpenAIService } from './OpenAIService';
import { Paper2SlidesSettings, AIProvider } from '../types';

/**
 * Factory for creating AI Provider service instances
 * Provides workflow-based provider selection
 */
export class AIProviderFactory {
  /**
   * Create a provider service for text/prompt generation
   * Uses the promptProvider setting
   */
  static createPromptProvider(settings: Paper2SlidesSettings): AIProviderService {
    const provider = settings.promptProvider;

    switch (provider) {
      case 'gemini':
        return new GeminiService(
          settings.gemini.apiKey,
          settings.gemini.baseUrl,
          settings.gemini.textModel,
          settings.gemini.imageModel
        );

      case 'grok':
        return new GrokService(
          settings.grok.apiKey,
          settings.grok.baseUrl,
          settings.grok.model
        );

      case 'openai':
        return new OpenAIService(
          settings.openai.apiKey,
          settings.openai.baseUrl,
          settings.openai.model
        );

      default:
        throw new Error(`Unknown prompt provider: ${provider}`);
    }
  }

  /**
   * Create a provider service for image generation
   * Uses the imageGenerationProvider setting
   */
  static createImageProvider(settings: Paper2SlidesSettings): AIProviderService {
    const provider = settings.imageGenerationProvider;

    switch (provider) {
      case 'gemini':
        return new GeminiService(
          settings.gemini.apiKey,
          settings.gemini.baseUrl,
          settings.gemini.textModel,
          settings.gemini.imageModel
        );

      case 'grok':
        // Grok doesn't support image generation yet
        throw new Error('Grok does not support image generation. Please use Gemini or OpenAI.');

      case 'openai':
        return new OpenAIService(
          settings.openai.apiKey,
          settings.openai.baseUrl,
          settings.openai.model
        );

      default:
        throw new Error(`Unknown image generation provider: ${provider}`);
    }
  }

  /**
   * Validate that all required API keys are configured
   */
  static validateSettings(settings: Paper2SlidesSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate prompt provider
    const promptProvider = settings.promptProvider;
    switch (promptProvider) {
      case 'gemini':
        if (!settings.gemini.apiKey) {
          errors.push('Gemini API key is required for prompt generation');
        }
        break;
      case 'grok':
        if (!settings.grok.apiKey) {
          errors.push('Grok API key is required for prompt generation');
        }
        break;
      case 'openai':
        if (!settings.openai.apiKey) {
          errors.push('OpenAI API key is required for prompt generation');
        }
        break;
    }

    // Validate image generation provider
    const imageProvider = settings.imageGenerationProvider;
    switch (imageProvider) {
      case 'gemini':
        if (!settings.gemini.apiKey) {
          errors.push('Gemini API key is required for image generation');
        }
        break;
      case 'grok':
        errors.push('Grok does not support image generation. Please select Gemini or OpenAI.');
        break;
      case 'openai':
        if (!settings.openai.apiKey) {
          errors.push('OpenAI API key is required for image generation');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
