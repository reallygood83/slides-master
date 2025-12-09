import { Paper2SlidesSettings } from './types';

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: Paper2SlidesSettings = {
  // AI Provider Configuration
  promptProvider: 'grok', // Default: Grok for prompt generation
  imageGenerationProvider: 'gemini', // Default: Gemini for image generation

  // Gemini Configuration
  gemini: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    imageModel: 'gemini-3-pro-image-preview', // For image generation
    textModel: 'gemini-2.5-flash', // For text/prompt generation if Gemini is selected
  },

  // Grok Configuration
  grok: {
    apiKey: '',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4-1-fast', // Default model for prompt generation
  },

  // OpenAI Configuration
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4', // Default model for prompt generation
  },

  // Generation Options
  defaultTheme: 'academic',
  defaultResolution: '4K',
  defaultPipelineMode: 'normal',
  defaultSlideLength: 'medium',

  // Performance Options
  autoRetryCount: 3,
  parallelWorkers: 2,
  maxTokensPerRequest: 30000,
  requestTimeout: 120000, // 2 minutes

  // Output Options
  outputFolder: 'Paper2Slides',
  outputFormats: ['html', 'pdf'],
  defaultOutputFormat: 'html',
  embedInNote: true,
  embedSlidesInNote: true,
  openAfterGeneration: true,
  createBackup: true,

  // UI Options
  showQuickOptionsModal: true,
  showProgressModal: true,
  showPreviewModal: false,
  preferredLanguage: 'en',

  // Advanced Options
  enableCheckpoints: true,
  checkpointFolder: '.paper2slides',
  ragChunkSize: 512,
  ragOverlapRatio: 0.1,
  parseImages: true,
  parseTables: true,
  includeMetadata: true,
  generateImages: true,
};

/**
 * Theme configurations
 */
export const THEME_CONFIGS = {
  academic: {
    id: 'academic' as const,
    name: 'Academic',
    description: 'Professional academic style with clean layout',
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif',
      code: 'Courier New, monospace',
    },
    layouts: ['title', 'content', 'two-column', 'image-focus'] as const,
  },
  doraemon: {
    id: 'doraemon' as const,
    name: 'Doraemon',
    description: 'Colorful and friendly style inspired by Doraemon',
    colors: {
      primary: '#0096ff',
      secondary: '#ff69b4',
      accent: '#ffd700',
      background: '#f0f8ff',
      text: '#2c3e50',
    },
    fonts: {
      heading: 'Comic Sans MS, cursive',
      body: 'Verdana, sans-serif',
      code: 'Consolas, monospace',
    },
    layouts: ['title', 'content', 'two-column', 'image-focus', 'quote'] as const,
  },
  minimalist: {
    id: 'minimalist' as const,
    name: 'Minimalist',
    description: 'Clean and simple minimalist design',
    colors: {
      primary: '#000000',
      secondary: '#4a4a4a',
      accent: '#808080',
      background: '#ffffff',
      text: '#333333',
    },
    fonts: {
      heading: 'Helvetica Neue, sans-serif',
      body: 'Helvetica, sans-serif',
      code: 'Monaco, monospace',
    },
    layouts: ['title', 'content', 'quote'] as const,
  },
  corporate: {
    id: 'corporate' as const,
    name: 'Corporate',
    description: 'Professional business style',
    colors: {
      primary: '#1a237e',
      secondary: '#283593',
      accent: '#3949ab',
      background: '#fafafa',
      text: '#212121',
    },
    fonts: {
      heading: 'Calibri, sans-serif',
      body: 'Arial, sans-serif',
      code: 'Courier, monospace',
    },
    layouts: ['title', 'content', 'two-column', 'comparison'] as const,
  },
  creative: {
    id: 'creative' as const,
    name: 'Creative',
    description: 'Bold and creative design for impactful presentations',
    colors: {
      primary: '#e91e63',
      secondary: '#9c27b0',
      accent: '#ff5722',
      background: '#f5f5f5',
      text: '#37474f',
    },
    fonts: {
      heading: 'Impact, fantasy',
      body: 'Trebuchet MS, sans-serif',
      code: 'Courier New, monospace',
    },
    layouts: ['title', 'content', 'image-focus', 'quote', 'two-column'] as const,
  },
};

/**
 * Resolution configurations
 */
export const RESOLUTION_CONFIGS = {
  '1K': { width: 1920, height: 1080, dpi: 72 },
  '2K': { width: 2560, height: 1440, dpi: 96 },
  '4K': { width: 3840, height: 2160, dpi: 144 },
};

/**
 * Layout templates
 */
export const LAYOUT_TEMPLATES = {
  title: {
    type: 'title' as const,
    name: 'Title Slide',
    description: 'Main title with subtitle and optional image',
    maxTextLines: 3,
    maxImages: 1,
    supportsTables: false,
  },
  content: {
    type: 'content' as const,
    name: 'Content Slide',
    description: 'Standard content slide with text and bullet points',
    maxTextLines: 8,
    maxImages: 2,
    supportsTables: true,
  },
  'two-column': {
    type: 'two-column' as const,
    name: 'Two Column Layout',
    description: 'Split content into two columns',
    maxTextLines: 6,
    maxImages: 2,
    supportsTables: true,
  },
  'image-focus': {
    type: 'image-focus' as const,
    name: 'Image Focus',
    description: 'Large image with minimal text',
    maxTextLines: 3,
    maxImages: 1,
    supportsTables: false,
  },
  quote: {
    type: 'quote' as const,
    name: 'Quote Slide',
    description: 'Highlighted quote or key message',
    maxTextLines: 5,
    maxImages: 0,
    supportsTables: false,
  },
  comparison: {
    type: 'comparison' as const,
    name: 'Comparison Slide',
    description: 'Side-by-side comparison',
    maxTextLines: 8,
    maxImages: 2,
    supportsTables: true,
  },
};

/**
 * Slide length configurations
 */
export const SLIDE_LENGTH_CONFIGS = {
  short: { minSlides: 5, maxSlides: 10, avgWordsPerSlide: 30 },
  medium: { minSlides: 10, maxSlides: 20, avgWordsPerSlide: 50 },
  long: { minSlides: 20, maxSlides: 40, avgWordsPerSlide: 70 },
};
