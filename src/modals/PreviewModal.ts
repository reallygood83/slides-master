import { App, Modal, Setting } from 'obsidian';
import { SlideBlueprint, PreviewModalResult } from '../types';

/**
 * Preview Modal
 * Allows users to preview and optionally edit slide blueprints before final generation
 */
export class PreviewModal extends Modal {
  private blueprints: SlideBlueprint[];
  private result: PreviewModalResult;
  private onSubmit: (result: PreviewModalResult) => void;

  constructor(
    app: App,
    blueprints: SlideBlueprint[],
    onSubmit: (result: PreviewModalResult) => void
  ) {
    super(app);
    this.blueprints = blueprints;
    this.onSubmit = onSubmit;
    this.result = {
      confirmed: false,
      regenerate: false,
    };
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'Preview Slide Blueprints' });
    contentEl.createEl('p', {
      text: `${this.blueprints.length} slides ready to generate. Review the structure below.`,
      cls: 'preview-description',
    });

    // Slide list container (scrollable)
    const slideListContainer = contentEl.createDiv({ cls: 'preview-slide-list' });

    this.blueprints.forEach((blueprint, index) => {
      this.renderSlideCard(slideListContainer, blueprint, index);
    });

    // Action buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    buttonContainer.createEl('button', { text: 'Regenerate', cls: 'mod-warning' }, (btn) => {
      btn.addEventListener('click', () => {
        this.result.confirmed = false;
        this.result.regenerate = true;
        this.close();
        this.onSubmit(this.result);
      });
    });

    buttonContainer.createEl('button', { text: 'Confirm & Generate', cls: 'mod-cta' }, (btn) => {
      btn.addEventListener('click', () => {
        this.result.confirmed = true;
        this.result.regenerate = false;
        this.close();
        this.onSubmit(this.result);
      });
    });

    // Add custom styling
    this.addModalStyles(contentEl);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Render individual slide card
   */
  private renderSlideCard(container: HTMLElement, blueprint: SlideBlueprint, index: number) {
    const card = container.createDiv({ cls: 'slide-card' });

    // Header with slide number and layout
    const header = card.createDiv({ cls: 'slide-card-header' });
    header.createSpan({ text: `Slide ${blueprint.slideNumber}`, cls: 'slide-number' });
    header.createSpan({ text: this.getLayoutEmoji(blueprint.layout), cls: 'layout-emoji' });
    header.createSpan({ text: blueprint.layout, cls: 'layout-type' });

    // Title
    card.createEl('h3', { text: blueprint.title, cls: 'slide-title' });

    // Content preview
    const contentPreview = card.createDiv({ cls: 'slide-content-preview' });

    if (blueprint.content.text.length > 0) {
      const textList = contentPreview.createEl('ul', { cls: 'content-text-list' });
      const maxItems = Math.min(3, blueprint.content.text.length);

      for (let i = 0; i < maxItems; i++) {
        textList.createEl('li', { text: blueprint.content.text[i] });
      }

      if (blueprint.content.text.length > maxItems) {
        textList.createEl('li', {
          text: `... and ${blueprint.content.text.length - maxItems} more items`,
          cls: 'more-items',
        });
      }
    }

    // Image indicator
    if (blueprint.imagePrompt) {
      const imageIndicator = card.createDiv({ cls: 'image-indicator' });
      imageIndicator.createSpan({ text: '🖼️', cls: 'indicator-emoji' });
      imageIndicator.createSpan({
        text: 'AI Image will be generated',
        cls: 'indicator-text',
      });
    }

    // Tables indicator
    if (blueprint.content.tables && blueprint.content.tables.length > 0) {
      const tableIndicator = card.createDiv({ cls: 'table-indicator' });
      tableIndicator.createSpan({ text: '📊', cls: 'indicator-emoji' });
      tableIndicator.createSpan({
        text: `${blueprint.content.tables.length} table(s)`,
        cls: 'indicator-text',
      });
    }

    // Code blocks indicator
    if (blueprint.content.code && blueprint.content.code.length > 0) {
      const codeIndicator = card.createDiv({ cls: 'code-indicator' });
      codeIndicator.createSpan({ text: '💻', cls: 'indicator-emoji' });
      codeIndicator.createSpan({
        text: `${blueprint.content.code.length} code block(s)`,
        cls: 'indicator-text',
      });
    }

    // Notes (speaker notes)
    if (blueprint.notes) {
      const notesEl = card.createDiv({ cls: 'slide-notes' });
      notesEl.createSpan({ text: '📝 Notes: ', cls: 'notes-label' });
      notesEl.createSpan({
        text: blueprint.notes.length > 100 ? blueprint.notes.substring(0, 100) + '...' : blueprint.notes,
        cls: 'notes-text',
      });
    }
  }

  /**
   * Get emoji for layout type
   */
  private getLayoutEmoji(layout: string): string {
    const emojiMap: Record<string, string> = {
      title: '🎯',
      content: '📄',
      'two-column': '📊',
      'image-focus': '🖼️',
      quote: '💬',
      comparison: '⚖️',
    };
    return emojiMap[layout] || '📄';
  }

  /**
   * Add custom CSS for preview modal
   */
  private addModalStyles(contentEl: HTMLElement) {
    const styleEl = contentEl.createEl('style');
    styleEl.textContent = `
      .preview-description {
        color: var(--text-muted);
        font-size: 13px;
        margin-bottom: 15px;
      }

      .preview-slide-list {
        max-height: 500px;
        overflow-y: auto;
        margin-bottom: 20px;
        padding-right: 10px;
      }

      .slide-card {
        background-color: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        transition: all 0.2s;
      }

      .slide-card:hover {
        border-color: var(--interactive-accent);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .slide-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
      }

      .slide-number {
        font-weight: 600;
        color: var(--interactive-accent);
      }

      .layout-emoji {
        font-size: 16px;
      }

      .layout-type {
        font-size: 12px;
        color: var(--text-muted);
        background-color: var(--background-primary);
        padding: 2px 8px;
        border-radius: 4px;
      }

      .slide-title {
        margin: 10px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-normal);
      }

      .slide-content-preview {
        margin: 10px 0;
      }

      .content-text-list {
        list-style: disc;
        padding-left: 20px;
        margin: 5px 0;
      }

      .content-text-list li {
        font-size: 13px;
        color: var(--text-muted);
        margin: 3px 0;
      }

      .content-text-list .more-items {
        font-style: italic;
        color: var(--text-faint);
      }

      .image-indicator,
      .table-indicator,
      .code-indicator {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-right: 10px;
        margin-top: 8px;
        padding: 4px 8px;
        background-color: var(--background-primary);
        border-radius: 4px;
        font-size: 12px;
      }

      .indicator-emoji {
        font-size: 14px;
      }

      .indicator-text {
        color: var(--text-muted);
      }

      .slide-notes {
        margin-top: 10px;
        padding: 8px;
        background-color: var(--background-primary);
        border-left: 3px solid var(--interactive-accent);
        border-radius: 4px;
        font-size: 12px;
      }

      .notes-label {
        font-weight: 600;
        color: var(--text-normal);
      }

      .notes-text {
        color: var(--text-muted);
      }

      .modal-button-container {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 20px;
        border-top: 1px solid var(--background-modifier-border);
      }

      .modal-button-container button {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
        border: none;
      }

      .modal-button-container .mod-warning {
        background-color: var(--background-modifier-error);
        color: var(--text-on-accent);
      }

      .modal-button-container .mod-warning:hover {
        background-color: var(--background-modifier-error-hover);
      }

      .modal-button-container .mod-cta {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
      }

      .modal-button-container .mod-cta:hover {
        background-color: var(--interactive-accent-hover);
      }
    `;
  }
}
