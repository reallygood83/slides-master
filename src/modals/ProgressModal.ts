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

    // Add debugging - make sure content is visible
    contentEl.style.minHeight = '300px';
    contentEl.style.padding = '20px';

    contentEl.createEl('h2', { text: 'Generating Slides' });

    // Stage indicator
    const stageContainer = contentEl.createDiv({ cls: 'progress-stage-container' });
    this.stageEl = stageContainer.createDiv({ cls: 'progress-stage' });
    this.updateStageDisplay();

    // Progress bar
    const progressContainer = contentEl.createDiv({ cls: 'progress-bar-container' });
    const progressBarBg = progressContainer.createDiv({ cls: 'progress-bar-bg' });
    this.progressBarEl = progressBarBg.createDiv({ cls: 'progress-bar-fill' });
    this.progressBarEl.style.width = '0%';

    // Progress percentage
    const progressPercentEl = contentEl.createDiv({ cls: 'progress-percent' });
    progressPercentEl.textContent = '0%';

    // Message
    this.messageEl = contentEl.createDiv({ cls: 'progress-message' });
    this.messageEl.textContent = this.progressState.message;

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
      .progress-stage-container {
        margin: 20px 0;
      }

      .progress-stage {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .stage-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 10px;
        border-radius: 8px;
        background-color: var(--background-secondary, #e0e0e0);
        opacity: 0.5;
        transition: all 0.3s;
      }

      .stage-item.stage-active {
        opacity: 1;
        background-color: var(--interactive-accent, #5865f2);
        color: var(--text-on-accent, #ffffff);
        transform: scale(1.1);
      }

      .stage-item.stage-completed {
        opacity: 0.7;
        background-color: var(--background-modifier-success, #a0e0a0);
      }

      .stage-emoji {
        font-size: 24px;
      }

      .stage-label {
        font-size: 12px;
        font-weight: 500;
      }

      .progress-bar-container {
        margin: 20px 0;
      }

      .progress-bar-bg {
        width: 100%;
        height: 24px;
        background-color: var(--background-secondary, #e0e0e0);
        border-radius: 12px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(
          90deg,
          var(--interactive-accent, #5865f2) 0%,
          var(--interactive-accent-hover, #4752c4) 100%
        );
        border-radius: 12px;
        transition: width 0.3s ease;
      }

      .progress-bar-fill.progress-complete {
        background: linear-gradient(
          90deg,
          #4ade80 0%,
          #22c55e 100%
        );
      }

      .progress-percent {
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        margin-top: 10px;
        color: var(--text-normal, #000000);
      }

      .progress-message {
        text-align: center;
        margin: 15px 0;
        font-size: 14px;
        color: var(--text-muted, #666666);
        min-height: 20px;
      }

      .progress-slide-counter {
        text-align: center;
        font-size: 13px;
        color: var(--text-muted, #666666);
        margin-top: 10px;
      }

      .progress-time-remaining {
        text-align: center;
        font-size: 13px;
        color: var(--text-muted, #666666);
        margin-top: 5px;
      }
    `;
  }
}
