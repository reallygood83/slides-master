/**
 * Slides Master Type Definitions
 * Complete TypeScript interfaces for the plugin
 */

// ============================================================================
// AI Provider Configuration
// ============================================================================

export type AIProvider = 'gemini' | 'grok' | 'openai';

export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  imageModel: 'gemini-3-pro-image-preview';
  textModel: 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-3-pro';
}

export interface GrokConfig {
  apiKey: string;
  baseUrl: string;
  model: string; // User configurable, default: 'grok-4-1-fast'
}

export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string; // User configurable, e.g., 'gpt-4', 'gpt-3.5-turbo'
}

// ============================================================================
// Plugin Settings
// ============================================================================

export interface Paper2SlidesSettings {
  // AI Provider Configuration
  promptProvider: AIProvider; // Provider for prompt generation (default: 'grok')
  imageGenerationProvider: AIProvider; // Provider for image generation (default: 'gemini')

  // Provider-specific configurations
  gemini: GeminiConfig;
  grok: GrokConfig;
  openai: OpenAIConfig;

  // Generation Options
  defaultTheme: ThemeType;
  defaultResolution: ResolutionType;
  defaultPipelineMode: PipelineMode;
  defaultSlideLength: SlideLength;

  // Performance Options
  autoRetryCount: number;
  parallelWorkers: number;
  maxTokensPerRequest: number;
  requestTimeout: number;

  // Output Options
  outputFolder: string;
  outputFormats: OutputFormat[];
  defaultOutputFormat: OutputFormat;
  embedInNote: boolean;
  embedSlidesInNote: boolean;
  openAfterGeneration: boolean;
  createBackup: boolean;

  // UI Options
  showQuickOptionsModal: boolean;
  showProgressModal: boolean;
  showPreviewModal: boolean;
  preferredLanguage: 'en' | 'ko';

  // Advanced Options
  enableCheckpoints: boolean;
  checkpointFolder: string;
  ragChunkSize: number;
  ragOverlapRatio: number;
  parseImages: boolean;
  parseTables: boolean;
  includeMetadata: boolean;
  generateImages: boolean;
}

// ============================================================================
// Theme System
// ============================================================================

export type ThemeType = 'academic' | 'doraemon' | 'minimalist' | 'corporate' | 'creative';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  layouts: LayoutType[];
  customCSS?: string;
}

// ============================================================================
// Resolution and Layout
// ============================================================================

export type ResolutionType = '1K' | '2K' | '4K';

export interface ResolutionConfig {
  width: number;
  height: number;
  dpi: number;
}

export type LayoutType = 'title' | 'content' | 'two-column' | 'image-focus' | 'quote' | 'comparison';

export interface LayoutTemplate {
  type: LayoutType;
  name: string;
  description: string;
  maxTextLines: number;
  maxImages: number;
  supportsTables: boolean;
}

// ============================================================================
// Pipeline System
// ============================================================================

export type PipelineMode = 'fast' | 'normal';
export type PipelineStage = 'rag' | 'summary' | 'plan' | 'generate';
export type SlideLength = 'short' | 'medium' | 'long';

export interface PipelineConfig {
  mode: PipelineMode;
  fromStage?: PipelineStage;
  parallelWorkers?: number;
  length: SlideLength;
  theme: ThemeType;
  resolution: ResolutionType;
  embedInNote?: boolean;
}

// ============================================================================
// Stage 1: RAG Indexing
// ============================================================================

export interface RAGStageConfig {
  mode: PipelineMode;
  parseImages: boolean;
  parseTables: boolean;
  chunkSize: number;
  overlapRatio: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    chunkIndex: number;
    startLine: number;
    endLine: number;
    headers: string[];
    containsCode: boolean;
    containsTable: boolean;
    containsImage: boolean;
  };
  embedding?: number[];
}

export interface RAGIndex {
  chunks: DocumentChunk[];
  metadata: {
    totalChunks: number;
    avgChunkSize: number;
    documentLength: number;
    createdAt: string;
  };
}

// ============================================================================
// Stage 2: Content Analysis
// ============================================================================

export interface ContentSummary {
  mainTopics: string[];
  keyPoints: string[];
  suggestedSlideCount: number;
  estimatedDuration: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
  outline: OutlineSection[];
}

export interface OutlineSection {
  title: string;
  level: number;
  content: string;
  subsections?: OutlineSection[];
}

// ============================================================================
// Stage 3: Layout Planning
// ============================================================================

export interface SlideBlueprint {
  slideNumber: number;
  title: string;
  layout: LayoutType;
  content: {
    text: string[];
    images?: ImageReference[];
    tables?: TableData[];
    code?: CodeBlock[];
  };
  notes: string;
  imagePrompt?: string;
  estimatedTokens: number;
}

export interface ImageReference {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  caption?: string;
}

// ============================================================================
// Stage 4: Image Generation
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  slideNumber: number;
  resolution: ResolutionType;
  theme: ThemeType;
  style?: string;
}

export interface ImageGenerationResult {
  slideNumber: number;
  imageData: string; // base64 encoded
  mimeType: string;
  metadata: {
    generatedAt: string;
    prompt: string;
    resolution: ResolutionType;
    retryCount: number;
  };
}

// ============================================================================
// Checkpoint System
// ============================================================================

export interface Checkpoint {
  stage: PipelineStage;
  data: RAGIndex | ContentSummary | SlideBlueprint[] | ImageGenerationResult[];
  timestamp: string;
  config: PipelineConfig;
  filePath: string;
}

export interface CheckpointManager {
  saveCheckpoint(stage: PipelineStage, data: any): Promise<void>;
  loadCheckpoint(stage: PipelineStage): Promise<Checkpoint | null>;
  checkpointExists(stage: PipelineStage): boolean;
  clearCheckpoints(): Promise<void>;
}

// ============================================================================
// Output Formats
// ============================================================================

export type OutputFormat = 'html' | 'pdf' | 'pptx' | 'markdown';

export interface OutputConfig {
  format: OutputFormat;
  fileName: string;
  embedInNote: boolean;
  openAfterGeneration: boolean;
}

export interface GeneratedOutput {
  format: OutputFormat;
  filePath: string;
  fileName: string;
  size: number;
  createdAt: string;
}

// ============================================================================
// Progress Tracking
// ============================================================================

export interface ProgressState {
  stage: PipelineStage;
  progress: number; // 0-100
  message: string;
  currentSlide?: number;
  totalSlides?: number;
  estimatedTimeRemaining?: number;
}

export interface GenerationResult {
  success: boolean;
  blueprints: SlideBlueprint[];
  images: ImageGenerationResult[];
  outputs: GeneratedOutput[];
  error?: GenerationError;
  duration: number;
  stats: {
    totalSlides: number;
    totalImages: number;
    totalTokens: number;
    totalRetries: number;
    executionTime: number;
  };
}

// ============================================================================
// Error Handling
// ============================================================================

export interface GenerationError {
  code: string;
  message: string;
  stage: PipelineStage;
  retryable: boolean;
  details?: any;
}

export const ERROR_CODES = {
  // API Errors
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_TIMEOUT: 'API_TIMEOUT',

  // File Errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  CHECKPOINT_LOAD_ERROR: 'CHECKPOINT_LOAD_ERROR',

  // Generation Errors
  INVALID_MARKDOWN: 'INVALID_MARKDOWN',
  EMPTY_CONTENT: 'EMPTY_CONTENT',
  TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED',
  GENERATION_FAILED: 'GENERATION_FAILED',

  // System Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ============================================================================
// Modal Results
// ============================================================================

export interface QuickOptionsResult {
  confirmed: boolean;
  theme: ThemeType;
  resolution: ResolutionType;
  length: SlideLength;
  mode: PipelineMode;
  embedInNote?: boolean;
}

export interface PreviewModalResult {
  confirmed: boolean;
  regenerate: boolean;
  editedBlueprints?: SlideBlueprint[];
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface IMarkdownParser {
  parse(content: string): Promise<DocumentChunk[]>;
  extractHeaders(content: string): string[];
  extractImages(content: string): ImageReference[];
  extractTables(content: string): TableData[];
  extractCodeBlocks(content: string): CodeBlock[];
}

export interface IRAGService {
  indexDocument(chunks: DocumentChunk[]): Promise<RAGIndex>;
  search(query: string, topK: number): DocumentChunk[];
  clear(): void;
}

export interface ISummaryService {
  generateSummary(ragIndex: RAGIndex): Promise<ContentSummary>;
  estimateSlideCount(summary: ContentSummary, length: SlideLength): number;
}

export interface IPlanService {
  generateBlueprints(summary: ContentSummary, config: PipelineConfig): Promise<SlideBlueprint[]>;
  optimizeLayout(blueprints: SlideBlueprint[]): SlideBlueprint[];
}

export interface IImageService {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  generateImages(requests: ImageGenerationRequest[], parallel: boolean): Promise<ImageGenerationResult[]>;
}

export interface IFileService {
  saveSlides(blueprints: SlideBlueprint[], images: ImageGenerationResult[], config: OutputConfig): Promise<GeneratedOutput[]>;
  embedInNote(file: any, outputs: GeneratedOutput[]): Promise<void>;
  createBackup(file: any): Promise<string>;
}
