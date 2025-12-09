import { App, Modal, Setting } from 'obsidian';
import {
  QuickOptionsResult,
  ThemeType,
  ResolutionType,
  SlideLength,
  PipelineMode,
  Paper2SlidesSettings,
} from '../types';

/**
 * Quick Options Modal
 * Allows users to quickly configure slide generation options
 */
export class QuickOptionsModal extends Modal {
  private result: QuickOptionsResult;
  private onSubmit: (result: QuickOptionsResult) => void;
  private settings: Paper2SlidesSettings;

  constructor(
    app: App,
    settings: Paper2SlidesSettings,
    onSubmit: (result: QuickOptionsResult) => void
  ) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;

    // Initialize with default values from settings
    this.result = {
      confirmed: false,
      theme: settings.defaultTheme,
      resolution: settings.defaultResolution,
      length: settings.defaultSlideLength,
      mode: settings.defaultPipelineMode,
    };
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'Slide Generation Options' });
    contentEl.createEl('p', {
      text: 'Configure your presentation settings before generation.',
      cls: 'setting-item-description',
    });

    // Theme Selection
    new Setting(contentEl)
      .setName('Theme')
      .setDesc('Choose the visual theme for your slides')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('academic', '🎓 Academic')
          .addOption('doraemon', '🤖 Doraemon')
          .addOption('minimalist', '✨ Minimalist')
          .addOption('corporate', '💼 Corporate')
          .addOption('creative', '🎨 Creative')
          .setValue(this.result.theme)
          .onChange((value) => {
            this.result.theme = value as ThemeType;
          })
      );

    // Resolution Selection
    new Setting(contentEl)
      .setName('Resolution')
      .setDesc('Select the output resolution (higher = better quality, larger file size)')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('1K', '1K (1280×720) - Standard')
          .addOption('2K', '2K (2560×1440) - High Quality')
          .addOption('4K', '4K (3840×2160) - Ultra HD')
          .setValue(this.result.resolution)
          .onChange((value) => {
            this.result.resolution = value as ResolutionType;
          })
      );

    // Slide Length Selection
    new Setting(contentEl)
      .setName('Slide Length')
      .setDesc('Determine the number of slides to generate')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('short', 'Short (5-10 slides)')
          .addOption('medium', 'Medium (10-15 slides)')
          .addOption('long', 'Long (15-25 slides)')
          .setValue(this.result.length)
          .onChange((value) => {
            this.result.length = value as SlideLength;
          })
      );

    // Pipeline Mode Selection
    new Setting(contentEl)
      .setName('Pipeline Mode')
      .setDesc('Choose between fast generation or higher quality processing')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('fast', '⚡ Fast - Quick generation')
          .addOption('normal', '🎯 Normal - Better quality')
          .setValue(this.result.mode)
          .onChange((value) => {
            this.result.mode = value as PipelineMode;
          })
      );

    // Action Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    buttonContainer.createEl('button', { text: 'Cancel', cls: 'mod-cancel' }, (btn) => {
      btn.addEventListener('click', () => {
        this.result.confirmed = false;
        this.close();
      });
    });

    buttonContainer.createEl('button', { text: 'Generate Slides', cls: 'mod-cta' }, (btn) => {
      btn.addEventListener('click', () => {
        this.result.confirmed = true;
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
   * Add custom CSS for better modal appearance
   */
  private addModalStyles(contentEl: HTMLElement) {
    const styleEl = contentEl.createEl('style');
    styleEl.textContent = `
      .modal-button-container {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
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
      }

      .modal-button-container .mod-cancel {
        background-color: var(--background-modifier-border);
        color: var(--text-normal);
        border: none;
      }

      .modal-button-container .mod-cancel:hover {
        background-color: var(--background-modifier-border-hover);
      }

      .modal-button-container .mod-cta {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
      }

      .modal-button-container .mod-cta:hover {
        background-color: var(--interactive-accent-hover);
      }

      .setting-item-description {
        color: var(--text-muted);
        font-size: 13px;
        line-height: 1.4;
        margin-bottom: 16px;
      }
    `;
  }
}
