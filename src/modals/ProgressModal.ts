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
    const { contentEl, modalEl } = this;

    // v1.0.9 FIX: ULTRA AGGRESSIVE styling to override ANY theme
    // Modal container styling - maximum visibility
    modalEl.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    `;

    // Content area styling - MAXIMUM visibility and contrast
    contentEl.style.cssText = `
      min-width: 600px !important;
      min-height: 400px !important;
      max-width: 90vw !important;
      padding: 40px !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      border: 5px solid #5865f2 !important;
      border-radius: 12px !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
      position: relative !important;
      z-index: 1000000 !important;
      visibility: visible !important;
      opacity: 1 !important;
      transform: none !important;
      display: block !important;
      pointer-events: auto !important;
    `;

    // Create title with ULTRA aggressive styling
    const titleEl = contentEl.createEl('h2', { text: '슬라이드 생성 중' });
    titleEl.style.cssText = `
      color: #000000 !important;
      font-size: 28px !important;
      font-weight: 700 !important;
      margin-bottom: 30px !important;
      margin-top: 0 !important;
      text-align: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    // Stage indicator with ULTRA aggressive styling
    const stageContainer = contentEl.createDiv({ cls: 'progress-stage-container' });
    stageContainer.style.cssText = `
      margin: 30px 0 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;

    this.stageEl = stageContainer.createDiv({ cls: 'progress-stage' });
    this.stageEl.style.cssText = `
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      gap: 15px !important;
      margin-bottom: 30px !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;

    this.updateStageDisplay();

    // Progress bar with ULTRA aggressive styling
    const progressContainer = contentEl.createDiv({ cls: 'progress-bar-container' });
    progressContainer.style.cssText = `
      margin: 30px 0 !important;
      width: 100% !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    const progressBarBg = progressContainer.createDiv({ cls: 'progress-bar-bg' });
    progressBarBg.style.cssText = `
      width: 100% !important;
      height: 32px !important;
      background-color: #e0e0e0 !important;
      border-radius: 16px !important;
      overflow: hidden !important;
      border: 2px solid #d0d0d0 !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    this.progressBarEl = progressBarBg.createDiv({ cls: 'progress-bar-fill' });
    this.progressBarEl.style.cssText = `
      width: 0% !important;
      height: 100% !important;
      background: linear-gradient(90deg, #5865f2 0%, #4752c4 100%) !important;
      border-radius: 16px !important;
      transition: width 0.3s ease !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    // Progress percentage with ULTRA aggressive styling
    const progressPercentEl = contentEl.createDiv({ cls: 'progress-percent' });
    progressPercentEl.textContent = '0%';
    progressPercentEl.style.cssText = `
      color: #000000 !important;
      font-size: 24px !important;
      font-weight: 700 !important;
      text-align: center !important;
      margin-top: 15px !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    // Message with ULTRA aggressive styling
    this.messageEl = contentEl.createDiv({ cls: 'progress-message' });
    this.messageEl.textContent = this.progressState.message;
    this.messageEl.style.cssText = `
      color: #333333 !important;
      font-size: 16px !important;
      font-weight: 500 !important;
      text-align: center !important;
      margin: 20px 0 !important;
      min-height: 24px !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
    `;

    // Slide counter
    this.slideCounterEl = contentEl.createDiv({ cls: 'progress-slide-counter' });
    this.slideCounterEl.style.cssText = `
      display: none !important;
      text-align: center !important;
      font-size: 13px !important;
      color: #666666 !important;
      margin-top: 10px !important;
    `;

    // Time remaining
    this.timeRemainingEl = contentEl.createDiv({ cls: 'progress-time-remaining' });
    this.timeRemainingEl.style.cssText = `
      display: none !important;
      text-align: center !important;
      font-size: 13px !important;
      color: #666666 !important;
      margin-top: 5px !important;
    `;

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
