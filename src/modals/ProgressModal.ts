import { App, Modal } from 'obsidian';
import { ProgressState, PipelineStage } from '../types';

/**
 * Progress Modal
 * Displays real-time progress during slide generation
 */
export class ProgressModal extends Modal {
  private progressState: ProgressState;
  private progressBarEl: HTMLElement;
  private stageEl: HTMLElement;
  private messageEl: HTMLElement;
  private slideCounterEl: HTMLElement;
  private timeRemainingEl: HTMLElement;

  constructor(app: App) {
    super(app);

    // Initialize progress state
    this.progressState = {
      stage: 'rag',
      progress: 0,
      message: 'Initializing...',
    };
  }

  onOpen() {
    const { contentEl } = this;

    // v1.0.5 FIX: Extremely explicit styling to ensure visibility across all themes
    contentEl.style.minHeight = '400px';
    contentEl.style.padding = '30px';
    contentEl.style.backgroundColor = '#ffffff';
    contentEl.style.color = '#000000';
    contentEl.style.border = '2px solid #e0e0e0';
    contentEl.style.borderRadius = '8px';
    contentEl.style.position = 'relative';
    contentEl.style.zIndex = '9999';

    // Create title with explicit styling
    const titleEl = contentEl.createEl('h2', { text: 'Generating Slides' });
    titleEl.style.color = '#000000';
    titleEl.style.fontSize = '24px';
    titleEl.style.fontWeight = '600';
    titleEl.style.marginBottom = '20px';
    titleEl.style.textAlign = 'center';

    // Stage indicator
    const stageContainer = contentEl.createDiv({ cls: 'progress-stage-container' });
    this.stageEl = stageContainer.createDiv({ cls: 'progress-stage' });
    this.updateStageDisplay();

    // Progress bar
    const progressContainer = contentEl.createDiv({ cls: 'progress-bar-container' });
    const progressBarBg = progressContainer.createDiv({ cls: 'progress-bar-bg' });
    this.progressBarEl = progressBarBg.createDiv({ cls: 'progress-bar-fill' });
    this.progressBarEl.style.width = '0%';

    // Progress percentage with explicit styling
    const progressPercentEl = contentEl.createDiv({ cls: 'progress-percent' });
    progressPercentEl.textContent = '0%';
    progressPercentEl.style.color = '#000000';
    progressPercentEl.style.fontSize = '18px';
    progressPercentEl.style.fontWeight = '600';
    progressPercentEl.style.textAlign = 'center';
    progressPercentEl.style.marginTop = '10px';

    // Message with explicit styling
    this.messageEl = contentEl.createDiv({ cls: 'progress-message' });
    this.messageEl.textContent = this.progressState.message;
    this.messageEl.style.color = '#666666';
    this.messageEl.style.fontSize = '14px';
    this.messageEl.style.textAlign = 'center';
    this.messageEl.style.margin = '15px 0';
    this.messageEl.style.minHeight = '20px';

    // Slide counter (optional)
    this.slideCounterEl = contentEl.createDiv({ cls: 'progress-slide-counter' });
    this.slideCounterEl.style.display = 'none';

    // Time remaining (optional)
    this.timeRemainingEl = contentEl.createDiv({ cls: 'progress-time-remaining' });
    this.timeRemainingEl.style.display = 'none';

    // Add custom styling
    this.addModalStyles(contentEl);

    // Store reference to percentage element for updates
    (this as any).progressPercentEl = progressPercentEl;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Update progress state and UI
   */
  updateProgress(state: Partial<ProgressState>) {
    // Update internal state
    this.progressState = { ...this.progressState, ...state };

    // Update progress bar
    if (state.progress !== undefined) {
      const progress = Math.min(100, Math.max(0, state.progress));
      this.progressBarEl.style.width = `${progress}%`;

      // Update percentage text
      const progressPercentEl = (this as any).progressPercentEl;
      if (progressPercentEl) {
        progressPercentEl.textContent = `${Math.round(progress)}%`;
      }

      // Add completion class when done
      if (progress >= 100) {
        this.progressBarEl.addClass('progress-complete');
      }
    }

    // Update stage
    if (state.stage !== undefined) {
      this.updateStageDisplay();
    }

    // Update message
    if (state.message !== undefined) {
      this.messageEl.textContent = state.message;
    }

    // Update slide counter
    if (state.currentSlide !== undefined && state.totalSlides !== undefined) {
      this.slideCounterEl.textContent = `Slide ${state.currentSlide}/${state.totalSlides}`;
      this.slideCounterEl.style.display = 'block';
    }

    // Update time remaining
    if (state.estimatedTimeRemaining !== undefined) {
      const minutes = Math.floor(state.estimatedTimeRemaining / 60);
      const seconds = state.estimatedTimeRemaining % 60;
      this.timeRemainingEl.textContent = `Est. ${minutes}m ${seconds}s remaining`;
      this.timeRemainingEl.style.display = 'block';
    }
  }

  /**
   * Update stage display with visual indicators
   */
  private updateStageDisplay() {
    const stages: { key: PipelineStage; label: string; emoji: string }[] = [
      { key: 'rag', label: 'Indexing', emoji: '🔍' },
      { key: 'summary', label: 'Analysis', emoji: '📊' },
      { key: 'plan', label: 'Planning', emoji: '📐' },
      { key: 'generate', label: 'Generating', emoji: '🎨' },
    ];

    this.stageEl.empty();

    stages.forEach((stage, index) => {
      const stageItem = this.stageEl.createDiv({ cls: 'stage-item' });

      if (stage.key === this.progressState.stage) {
        stageItem.addClass('stage-active');
      } else {
        const currentIndex = stages.findIndex((s) => s.key === this.progressState.stage);
        if (index < currentIndex) {
          stageItem.addClass('stage-completed');
        }
      }

      stageItem.createSpan({ text: stage.emoji, cls: 'stage-emoji' });
      stageItem.createSpan({ text: stage.label, cls: 'stage-label' });
    });
  }

  /**
   * Add custom CSS for progress modal
   */
  private addModalStyles(contentEl: HTMLElement) {
    const styleEl = contentEl.createEl('style');
    styleEl.textContent = `
      /* v1.0.5 FIX: More aggressive CSS with !important to override theme styles */
      .progress-stage-container {
        margin: 20px 0 !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-stage {
        display: flex !important;
        justify-content: space-around !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 20px !important;
        visibility: visible !important;
      }

      .stage-item {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 10px !important;
        border-radius: 8px !important;
        background-color: #e0e0e0 !important;
        opacity: 0.5 !important;
        transition: all 0.3s !important;
        visibility: visible !important;
      }

      .stage-item.stage-active {
        opacity: 1 !important;
        background-color: #5865f2 !important;
        color: #ffffff !important;
        transform: scale(1.1) !important;
      }

      .stage-item.stage-completed {
        opacity: 0.7 !important;
        background-color: #a0e0a0 !important;
      }

      .stage-emoji {
        font-size: 24px !important;
        display: inline-block !important;
        visibility: visible !important;
      }

      .stage-label {
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #000000 !important;
        display: block !important;
        visibility: visible !important;
      }

      .stage-item.stage-active .stage-label {
        color: #ffffff !important;
      }

      .progress-bar-container {
        margin: 20px 0 !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-bar-bg {
        width: 100% !important;
        height: 24px !important;
        background-color: #e0e0e0 !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-bar-fill {
        height: 100% !important;
        background: linear-gradient(
          90deg,
          #5865f2 0%,
          #4752c4 100%
        ) !important;
        border-radius: 12px !important;
        transition: width 0.3s ease !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-bar-fill.progress-complete {
        background: linear-gradient(
          90deg,
          #4ade80 0%,
          #22c55e 100%
        ) !important;
      }

      .progress-percent {
        text-align: center !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        margin-top: 10px !important;
        color: #000000 !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-message {
        text-align: center !important;
        margin: 15px 0 !important;
        font-size: 14px !important;
        color: #666666 !important;
        min-height: 20px !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-slide-counter {
        text-align: center !important;
        font-size: 13px !important;
        color: #666666 !important;
        margin-top: 10px !important;
        display: block !important;
        visibility: visible !important;
      }

      .progress-time-remaining {
        text-align: center !important;
        font-size: 13px !important;
        color: #666666 !important;
        margin-top: 5px !important;
        display: block !important;
        visibility: visible !important;
      }
    `;
  }
}
