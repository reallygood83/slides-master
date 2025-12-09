import { App, PluginSettingTab, Setting } from 'obsidian';
import Paper2SlidesPlugin from '../main';
import { ThemeType, ResolutionType, PipelineMode, SlideLength, AIProvider } from './types';
import { THEME_CONFIGS } from './settingsData';

/**
 * Settings Tab for Slides Master Plugin
 * Allows users to configure multiple AI providers and generation options
 */
export class SlidesMasterSettingTab extends PluginSettingTab {
  plugin: Paper2SlidesPlugin;

  constructor(app: App, plugin: Paper2SlidesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Slides Master Settings' });

    // ========================================================================
    // AI Provider Selection
    // ========================================================================
    containerEl.createEl('h3', { text: 'AI Provider Selection' });

    // Prompt Generation Provider
    new Setting(containerEl)
      .setName('Prompt Generation Provider')
      .setDesc('Select AI provider for generating slide prompts and content analysis')
      .addDropdown(dropdown => dropdown
        .addOption('grok', 'Grok (Recommended - Fast and efficient)')
        .addOption('openai', 'OpenAI (GPT models)')
        .addOption('gemini', 'Google Gemini')
        .setValue(this.plugin.settings.promptProvider)
        .onChange(async (value: AIProvider) => {
          this.plugin.settings.promptProvider = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show relevant settings
        })
      );

    // Image Generation Provider
    new Setting(containerEl)
      .setName('Image Generation Provider')
      .setDesc('Select AI provider for generating slide images')
      .addDropdown(dropdown => dropdown
        .addOption('gemini', 'Google Gemini (Recommended for images)')
        .addOption('grok', 'Grok')
        .addOption('openai', 'OpenAI (DALL-E)')
        .setValue(this.plugin.settings.imageGenerationProvider)
        .onChange(async (value: AIProvider) => {
          this.plugin.settings.imageGenerationProvider = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show relevant settings
        })
      );

    // ========================================================================
    // Gemini Configuration
    // ========================================================================
    containerEl.createEl('h3', { text: 'Gemini API Configuration' });

    new Setting(containerEl)
      .setName('Gemini API Key')
      .setDesc('Enter your Google Gemini API key. Get one at https://makersuite.google.com/app/apikey')
      .addText(text => text
        .setPlaceholder('Enter your Gemini API key')
        .setValue(this.plugin.settings.gemini.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.gemini.apiKey = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Gemini Base URL')
      .setDesc('API base URL (usually no need to change)')
      .addText(text => text
        .setPlaceholder('https://generativelanguage.googleapis.com/v1beta')
        .setValue(this.plugin.settings.gemini.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.gemini.baseUrl = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Gemini Image Model')
      .setDesc('Model for generating slide images')
      .addText(text => text
        .setPlaceholder('gemini-3-pro-image-preview')
        .setValue(this.plugin.settings.gemini.imageModel)
        .setDisabled(true) // Fixed model for image generation
      );

    new Setting(containerEl)
      .setName('Gemini Text Model')
      .setDesc('Model for text analysis and prompt generation')
      .addDropdown(dropdown => dropdown
        .addOption('gemini-2.0-flash', 'Gemini 2.0 Flash (Fast)')
        .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Recommended)')
        .addOption('gemini-3-pro', 'Gemini 3 Pro (Most capable)')
        .setValue(this.plugin.settings.gemini.textModel)
        .onChange(async (value: 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-3-pro') => {
          this.plugin.settings.gemini.textModel = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Grok Configuration
    // ========================================================================
    containerEl.createEl('h3', { text: 'Grok API Configuration' });

    new Setting(containerEl)
      .setName('Grok API Key')
      .setDesc('Enter your Grok API key from X.AI')
      .addText(text => text
        .setPlaceholder('Enter your Grok API key')
        .setValue(this.plugin.settings.grok.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.grok.apiKey = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Grok Base URL')
      .setDesc('API base URL (usually no need to change)')
      .addText(text => text
        .setPlaceholder('https://api.x.ai/v1')
        .setValue(this.plugin.settings.grok.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.grok.baseUrl = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Grok Model')
      .setDesc('Grok model to use for generation (default: grok-4-1-fast)')
      .addText(text => text
        .setPlaceholder('grok-4-1-fast')
        .setValue(this.plugin.settings.grok.model)
        .onChange(async (value) => {
          this.plugin.settings.grok.model = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // OpenAI Configuration
    // ========================================================================
    containerEl.createEl('h3', { text: 'OpenAI API Configuration' });

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Enter your OpenAI API key from platform.openai.com')
      .addText(text => text
        .setPlaceholder('Enter your OpenAI API key')
        .setValue(this.plugin.settings.openai.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.openai.apiKey = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('OpenAI Base URL')
      .setDesc('API base URL (usually no need to change)')
      .addText(text => text
        .setPlaceholder('https://api.openai.com/v1')
        .setValue(this.plugin.settings.openai.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.openai.baseUrl = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('OpenAI Model')
      .setDesc('OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo)')
      .addText(text => text
        .setPlaceholder('gpt-4')
        .setValue(this.plugin.settings.openai.model)
        .onChange(async (value) => {
          this.plugin.settings.openai.model = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Generation Options
    // ========================================================================
    containerEl.createEl('h3', { text: 'Default Generation Options' });

    // Theme
    new Setting(containerEl)
      .setName('Default Theme')
      .setDesc('Choose the visual style for your slides')
      .addDropdown(dropdown => {
        Object.keys(THEME_CONFIGS).forEach(themeKey => {
          const theme = THEME_CONFIGS[themeKey as ThemeType];
          dropdown.addOption(theme.id, `${theme.name} - ${theme.description}`);
        });
        dropdown
          .setValue(this.plugin.settings.defaultTheme)
          .onChange(async (value: ThemeType) => {
            this.plugin.settings.defaultTheme = value;
            await this.plugin.saveSettings();
          });
      });

    // Resolution
    new Setting(containerEl)
      .setName('Default Resolution')
      .setDesc('Image resolution for generated slides (higher = better quality)')
      .addDropdown(dropdown => dropdown
        .addOption('1K', '1K (1920x1080) - Standard')
        .addOption('2K', '2K (2560x1440) - High Quality')
        .addOption('4K', '4K (3840x2160) - Ultra HD ⭐')
        .setValue(this.plugin.settings.defaultResolution)
        .onChange(async (value: ResolutionType) => {
          this.plugin.settings.defaultResolution = value;
          await this.plugin.saveSettings();
        })
      );

    // Pipeline Mode
    new Setting(containerEl)
      .setName('Default Pipeline Mode')
      .setDesc('Fast mode: quicker generation, Normal mode: better quality with RAG analysis')
      .addDropdown(dropdown => dropdown
        .addOption('fast', 'Fast Mode - Skip RAG indexing')
        .addOption('normal', 'Normal Mode - Full analysis')
        .setValue(this.plugin.settings.defaultPipelineMode)
        .onChange(async (value: PipelineMode) => {
          this.plugin.settings.defaultPipelineMode = value;
          await this.plugin.saveSettings();
        })
      );

    // Slide Length
    new Setting(containerEl)
      .setName('Default Slide Length')
      .setDesc('How many slides to generate from your content')
      .addDropdown(dropdown => dropdown
        .addOption('short', 'Short (5-10 slides)')
        .addOption('medium', 'Medium (10-20 slides)')
        .addOption('long', 'Long (20-40 slides)')
        .setValue(this.plugin.settings.defaultSlideLength)
        .onChange(async (value: SlideLength) => {
          this.plugin.settings.defaultSlideLength = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Performance Options
    // ========================================================================
    containerEl.createEl('h3', { text: 'Performance Options' });

    // Auto Retry Count
    new Setting(containerEl)
      .setName('Auto Retry Count')
      .setDesc('Number of automatic retries on API failure')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.plugin.settings.autoRetryCount)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.autoRetryCount = value;
          await this.plugin.saveSettings();
        })
      );

    // Parallel Workers
    new Setting(containerEl)
      .setName('Parallel Workers')
      .setDesc('Number of slides to generate in parallel (higher = faster but more resource intensive)')
      .addSlider(slider => slider
        .setLimits(1, 4, 1)
        .setValue(this.plugin.settings.parallelWorkers)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.parallelWorkers = value;
          await this.plugin.saveSettings();
        })
      );

    // Request Timeout
    new Setting(containerEl)
      .setName('Request Timeout')
      .setDesc('API request timeout in seconds')
      .addSlider(slider => slider
        .setLimits(30, 300, 30)
        .setValue(this.plugin.settings.requestTimeout / 1000)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.requestTimeout = value * 1000;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Output Options
    // ========================================================================
    containerEl.createEl('h3', { text: 'Output Options' });

    // Output Folder
    new Setting(containerEl)
      .setName('Output Folder')
      .setDesc('Folder to save generated slides (relative to vault root)')
      .addText(text => text
        .setPlaceholder('Slides-Master')
        .setValue(this.plugin.settings.outputFolder)
        .onChange(async (value) => {
          this.plugin.settings.outputFolder = value;
          await this.plugin.saveSettings();
        })
      );

    // Embed in Note
    new Setting(containerEl)
      .setName('Embed in Note')
      .setDesc('Automatically embed generated slides in the original note')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.embedInNote)
        .onChange(async (value) => {
          this.plugin.settings.embedInNote = value;
          await this.plugin.saveSettings();
        })
      );

    // Create Backup
    new Setting(containerEl)
      .setName('Create Backup')
      .setDesc('Create backup of the original note before embedding')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.createBackup)
        .onChange(async (value) => {
          this.plugin.settings.createBackup = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // UI Options
    // ========================================================================
    containerEl.createEl('h3', { text: 'UI Options' });

    // Show Quick Options Modal
    new Setting(containerEl)
      .setName('Show Quick Options Modal')
      .setDesc('Show options dialog before generation')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showQuickOptionsModal)
        .onChange(async (value) => {
          this.plugin.settings.showQuickOptionsModal = value;
          await this.plugin.saveSettings();
        })
      );

    // Show Progress Modal
    new Setting(containerEl)
      .setName('Show Progress Modal')
      .setDesc('Show progress dialog during generation')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showProgressModal)
        .onChange(async (value) => {
          this.plugin.settings.showProgressModal = value;
          await this.plugin.saveSettings();
        })
      );

    // Show Preview Modal
    new Setting(containerEl)
      .setName('Show Preview Modal')
      .setDesc('Show preview before generating slides')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showPreviewModal)
        .onChange(async (value) => {
          this.plugin.settings.showPreviewModal = value;
          await this.plugin.saveSettings();
        })
      );

    // Preferred Language
    new Setting(containerEl)
      .setName('Preferred Language')
      .setDesc('Language for UI messages')
      .addDropdown(dropdown => dropdown
        .addOption('en', 'English')
        .addOption('ko', '한국어')
        .setValue(this.plugin.settings.preferredLanguage)
        .onChange(async (value: 'en' | 'ko') => {
          this.plugin.settings.preferredLanguage = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Advanced Options
    // ========================================================================
    containerEl.createEl('h3', { text: 'Advanced Options' });

    // Enable Checkpoints
    new Setting(containerEl)
      .setName('Enable Checkpoints')
      .setDesc('Save progress at each stage (allows resuming generation)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableCheckpoints)
        .onChange(async (value) => {
          this.plugin.settings.enableCheckpoints = value;
          await this.plugin.saveSettings();
        })
      );

    // Parse Images
    new Setting(containerEl)
      .setName('Parse Images')
      .setDesc('Extract and include images from your markdown')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.parseImages)
        .onChange(async (value) => {
          this.plugin.settings.parseImages = value;
          await this.plugin.saveSettings();
        })
      );

    // Parse Tables
    new Setting(containerEl)
      .setName('Parse Tables')
      .setDesc('Extract and include tables from your markdown')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.parseTables)
        .onChange(async (value) => {
          this.plugin.settings.parseTables = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Info Section
    // ========================================================================
    containerEl.createEl('h3', { text: 'About' });

    const infoEl = containerEl.createEl('div', { cls: 'slides-master-info' });
    infoEl.createEl('p', {
      text: 'Slides Master transforms your markdown notes into professional presentation slides using Google Gemini AI.'
    });
    infoEl.createEl('p', {
      text: 'Version: 1.0.0'
    });

    const linkEl = infoEl.createEl('p');
    linkEl.createEl('a', {
      text: 'Documentation & Support',
      href: 'https://github.com/slides-master/slides-master'
    });
  }
}
