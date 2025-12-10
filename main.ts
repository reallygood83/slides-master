import { Plugin, MarkdownView, Notice, TFile } from 'obsidian';
import {
  Paper2SlidesSettings,
  PipelineConfig,
  QuickOptionsResult,
  GenerationResult,
  ProgressState,
  OutputConfig,
  SlideBlueprint,
  ImageGenerationResult,
} from './src/types';
import { DEFAULT_SETTINGS } from './src/settingsData';
import { SlidesMasterSettingTab } from './src/settings';
import { AIProviderFactory, FileService } from './src/services';
import { MarkdownParser } from './src/pipeline/MarkdownParserService';
import { RAGService } from './src/pipeline/stages/RAGService';
import { SummaryService } from './src/pipeline/stages/SummaryService';
import { PlanService } from './src/pipeline/stages/PlanService';
import { ImageService } from './src/pipeline/stages/ImageService';
import { QuickOptionsModal } from './src/modals/QuickOptionsModal';
import { ProgressModal } from './src/modals/ProgressModal';
import { PreviewModal } from './src/modals/PreviewModal';

/**
 * Slides Master Obsidian Plugin
 * Transform markdown notes into professional presentation slides using AI
 */
export default class Paper2SlidesPlugin extends Plugin {
  settings: Paper2SlidesSettings;
  private isGenerating: boolean = false;
  private lastGeneratedFile: TFile | null = null;

  // Service instances
  private markdownParser: MarkdownParser;
  private ragService: RAGService;
  private summaryService: SummaryService;
  private planService: PlanService;
  private imageService: ImageService;
  private fileService: FileService;

  // Modal instances
  private progressModal: ProgressModal | null = null;

  /**
   * Plugin initialization
   */
  async onload() {
    console.log('Loading Slides Master plugin');

    await this.loadSettings();

    // Initialize services
    this.initializeServices();

    // Register main command
    this.addCommand({
      id: 'generate-slides',
      name: 'Generate slides from current note',
      callback: () => this.generateSlides()
    });

    // Register command to generate from clipboard
    this.addCommand({
      id: 'generate-slides-from-clipboard',
      name: 'Generate slides from clipboard',
      callback: () => this.generateSlidesFromClipboard()
    });

    // Register command to resume from checkpoint
    this.addCommand({
      id: 'resume-generation',
      name: 'Resume slide generation from checkpoint',
      callback: () => this.resumeGeneration()
    });

    // Register command to open quick options
    this.addCommand({
      id: 'show-quick-options',
      name: 'Show slide generation options',
      callback: () => this.showQuickOptions()
    });

    // Add ribbon icon
    this.addRibbonIcon('presentation', 'Generate slides', () => {
      this.generateSlides();
    });

    // Add settings tab
    this.addSettingTab(new SlidesMasterSettingTab(this.app, this));

    console.log('Slides Master plugin loaded');
  }

  /**
   * Plugin cleanup
   */
  onunload() {
    console.log('Unloading Slides Master plugin');
  }

  /**
   * Load plugin settings
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save plugin settings
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Main slide generation workflow
   */
  async generateSlides(): Promise<void> {
    if (this.isGenerating) {
      new Notice('Generation already in progress');
      return;
    }

    // Get active file
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.file) {
      new Notice('Please open a markdown note first');
      return;
    }

    const noteFile = activeView.file;
    const noteContent = await this.app.vault.read(noteFile);

    if (!noteContent.trim()) {
      new Notice('Note is empty. Please add some content first.');
      return;
    }

    // Validate AI provider settings
    const validation = AIProviderFactory.validateSettings(this.settings);
    if (!validation.valid) {
      new Notice(`Configuration error: ${validation.errors.join(', ')}`);
      return;
    }

    // Show Quick Options Modal (if enabled)
    const quickOptions = await this.getQuickOptions();
    if (!quickOptions.confirmed) {
      return;
    }

    // Start generation
    this.isGenerating = true;
    this.lastGeneratedFile = noteFile;

    try {
      // Show progress modal (if enabled)
      if (this.settings.showProgressModal) {
        this.progressModal = new ProgressModal(this.app);
        this.progressModal.open();
      }

      // Build pipeline configuration
      const config: PipelineConfig = {
        mode: quickOptions.mode,
        length: quickOptions.length,
        theme: quickOptions.theme,
        resolution: quickOptions.resolution,
        parallelWorkers: this.settings.parallelWorkers,
        embedInNote: quickOptions.embedInNote,
      };

      // Execute pipeline with timing
      const startTime = Date.now();
      const result = await this.executePipeline(noteContent, config);
      const executionTime = Date.now() - startTime;

      // Update result with execution time
      result.duration = executionTime;
      result.stats.executionTime = executionTime;

      // Close progress modal
      if (this.progressModal) {
        this.progressModal.close();
        this.progressModal = null;
      }

      // Success notification
      new Notice(
        `✅ Slides generated successfully!\n${result.stats.totalSlides} slides, ${result.stats.totalImages} images\nTime: ${(executionTime / 1000).toFixed(1)}s`
      );
    } catch (error) {
      console.error('Slides Master generation error:', error);

      // Close progress modal on error
      if (this.progressModal) {
        this.progressModal.close();
        this.progressModal = null;
      }

      new Notice(`❌ Generation failed: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate slides from clipboard content
   */
  async generateSlidesFromClipboard(): Promise<void> {
    try {
      const clipboardContent = await navigator.clipboard.readText();

      if (!clipboardContent.trim()) {
        new Notice('Clipboard is empty');
        return;
      }

      // TODO: Implement clipboard-based generation
      new Notice('Clipboard generation will be implemented');

    } catch (error) {
      new Notice('Failed to read clipboard content');
      console.error(error);
    }
  }

  /**
   * Resume generation from last checkpoint
   */
  async resumeGeneration(): Promise<void> {
    if (this.isGenerating) {
      new Notice('Generation already in progress');
      return;
    }

    if (!this.lastGeneratedFile) {
      new Notice('No previous generation found');
      return;
    }

    // TODO: Implement checkpoint resume logic
    new Notice('Resume from checkpoint will be implemented');
  }

  /**
   * Show quick options modal without starting generation
   */
  async showQuickOptions(): Promise<void> {
    const options = await this.getQuickOptions();
    if (options.confirmed) {
      new Notice('Options saved. Ready to generate slides.');
    }
  }

  /**
   * Get quick options from user or use defaults
   */
  private async getQuickOptions(): Promise<QuickOptionsResult> {
    // If quick options modal is disabled, return defaults
    if (!this.settings.showQuickOptionsModal) {
      return {
        confirmed: true,
        theme: this.settings.defaultTheme,
        resolution: this.settings.defaultResolution,
        length: this.settings.defaultSlideLength,
        mode: this.settings.defaultPipelineMode,
        embedInNote: this.settings.embedSlidesInNote,
      };
    }

    // Show quick options modal and wait for user input
    return new Promise((resolve) => {
      const modal = new QuickOptionsModal(this.app, this.settings, (result) => {
        resolve(result);
      });
      modal.open();
    });
  }

  /**
   * Update progress state and modal
   */
  private updateProgress(state: ProgressState): void {
    console.log(`[${state.stage}] ${state.progress}% - ${state.message}`);

    // Update progress modal if it exists
    if (this.progressModal) {
      this.progressModal.updateProgress(state);
    }
  }

  /**
   * Execute generation pipeline with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.settings.autoRetryCount
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Operation failed with no error details');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize all service instances with current settings
   * Called on plugin load and when AI provider settings change
   */
  initializeServices(): void {
    this.markdownParser = new MarkdownParser();
    this.ragService = new RAGService();
    this.summaryService = new SummaryService(this.settings);
    this.planService = new PlanService(this.settings);
    this.imageService = new ImageService(this.settings);
    this.fileService = new FileService(this.app);
  }

  /**
   * Execute the complete slide generation pipeline
   */
  private async executePipeline(
    noteContent: string,
    config: PipelineConfig
  ): Promise<GenerationResult> {
    try {
      // Stage 1: RAG - Document Analysis
      this.updateProgress({
        stage: 'rag',
        progress: 10,
        message: 'Analyzing document structure...',
      });

      const parsedDocument = await this.markdownParser.parse(noteContent);
      const ragIndex = await this.ragService.indexDocument(parsedDocument);

      this.updateProgress({
        stage: 'rag',
        progress: 25,
        message: 'RAG index created',
      });

      // Stage 2: Summary - Content Analysis
      this.updateProgress({
        stage: 'summary',
        progress: 35,
        message: 'Analyzing content and extracting key points...',
      });

      const summary = await this.summaryService.generateSummary(ragIndex);

      this.updateProgress({
        stage: 'summary',
        progress: 50,
        message: 'Content summary generated',
      });

      // Stage 3: Plan - Slide Structure Planning
      this.updateProgress({
        stage: 'plan',
        progress: 60,
        message: 'Planning slide structure...',
      });

      const blueprints = await this.planService.generateBlueprints(
        summary,
        config
      );

      this.updateProgress({
        stage: 'plan',
        progress: 70,
        message: `${blueprints.length} slides planned`,
      });

      // Show preview modal
      if (this.settings.showPreviewModal) {
        const userConfirmed = await this.showPreviewModal(blueprints);
        if (!userConfirmed) {
          throw new Error('Generation cancelled by user');
        }
      }

      // Stage 4: Generate - Image Generation (optional)
      let images: ImageGenerationResult[] = [];

      if (this.settings.generateImages) {
        this.updateProgress({
          stage: 'generate',
          progress: 75,
          message: 'Generating AI images...',
        });

        // Create image generation requests from blueprints that have imagePrompt
        const imageRequests = blueprints
          .filter(bp => bp.imagePrompt)
          .map(bp => ({
            prompt: bp.imagePrompt!,
            slideNumber: bp.slideNumber,
            resolution: config.resolution,
            theme: config.theme,
          }));

        if (imageRequests.length > 0) {
          images = await this.imageService.generateImages(imageRequests, true);
        }

        this.updateProgress({
          stage: 'generate',
          progress: 85,
          message: `${images.length} images generated`,
        });
      }

      // Final Stage: File Output
      this.updateProgress({
        stage: 'generate',
        progress: 90,
        message: 'Creating slide files...',
      });

      const outputConfig: OutputConfig = {
        format: this.settings.defaultOutputFormat,
        fileName: `${this.lastGeneratedFile?.basename || 'slides'}_slides`,
        embedInNote: config.embedInNote ?? this.settings.embedSlidesInNote,
        openAfterGeneration: this.settings.openAfterGeneration,
      };

      const outputs = await this.fileService.saveSlides(blueprints, images, outputConfig);

      // Embed in note if requested
      if (outputConfig.embedInNote && this.lastGeneratedFile) {
        await this.fileService.embedInNote(this.lastGeneratedFile, outputs, blueprints);
      }

      this.updateProgress({
        stage: 'generate',
        progress: 100,
        message: 'Generation complete!',
      });

      return {
        success: true,
        blueprints,
        images,
        outputs,
        duration: 0, // Will be calculated by caller
        stats: {
          totalSlides: blueprints.length,
          totalImages: images.length,
          totalTokens: 0, // TODO: Track tokens usage
          totalRetries: 0, // TODO: Track retry count
          executionTime: 0, // Will be calculated by caller
        },
      };
    } catch (error) {
      console.error('Pipeline execution error:', error);
      throw error;
    }
  }

  /**
   * Show preview modal and wait for user confirmation
   */
  private async showPreviewModal(blueprints: SlideBlueprint[]): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new PreviewModal(this.app, blueprints, (result) => {
        if (result.regenerate) {
          resolve(false); // User wants to regenerate
        } else {
          resolve(result.confirmed);
        }
      });
      modal.open();
    });
  }
}
