import {
  ContentSummary,
  SlideBlueprint,
  PipelineConfig,
  LayoutType,
  IPlanService,
  Paper2SlidesSettings,
  OutlineSection,
} from '../../types';
import { AIProviderFactory } from '../../services';
import { AIProviderService } from '../../services/AIProviderService';

/**
 * Plan Service (Stage 3)
 * Generates detailed slide blueprints with layout planning
 */
export class PlanService implements IPlanService {
  private aiProvider: AIProviderService;

  constructor(settings: Paper2SlidesSettings) {
    this.aiProvider = AIProviderFactory.createPromptProvider(settings);
  }

  /**
   * Generate detailed slide blueprints from content summary
   */
  async generateBlueprints(
    summary: ContentSummary,
    config: PipelineConfig
  ): Promise<SlideBlueprint[]> {
    const targetSlideCount = this.calculateTargetCount(summary, config.length);

    // Build planning prompt
    const planningPrompt = this.buildPlanningPrompt(summary, targetSlideCount, config);

    // Call AI for blueprint generation
    const response = await this.aiProvider.generateText({
      prompt: planningPrompt,
      systemPrompt: `You are an expert presentation designer. Create detailed slide blueprints that are clear, engaging, and well-structured. Always respond with valid JSON only.`,
      temperature: 0.4,
      maxTokens: 8192,
    });

    // Parse AI response
    const blueprints = this.parseBlueprints(response.text, targetSlideCount);

    // Optimize layouts
    return this.optimizeLayout(blueprints);
  }

  /**
   * Optimize slide layouts for better visual flow
   */
  optimizeLayout(blueprints: SlideBlueprint[]): SlideBlueprint[] {
    return blueprints.map((blueprint, index) => {
      // First slide should always be title layout
      if (index === 0) {
        blueprint.layout = 'title';
      }

      // Last slide should be a summary or conclusion
      if (index === blueprints.length - 1) {
        blueprint.layout = 'content';
        blueprint.title = blueprint.title || 'Summary';
      }

      // Auto-assign layouts based on content
      if (!blueprint.layout || blueprint.layout === 'content') {
        blueprint.layout = this.suggestLayout(blueprint);
      }

      // Ensure image prompts for image-focus layouts
      if (blueprint.layout === 'image-focus' && !blueprint.imagePrompt) {
        blueprint.imagePrompt = this.generateImagePrompt(blueprint);
      }

      return blueprint;
    });
  }

  /**
   * Calculate target slide count
   */
  private calculateTargetCount(summary: ContentSummary, length: string): number {
    const base = summary.suggestedSlideCount;

    switch (length) {
      case 'short':
        return Math.max(5, Math.min(10, Math.floor(base * 0.7)));
      case 'medium':
        return Math.max(10, Math.min(15, base));
      case 'long':
        return Math.max(15, Math.min(25, Math.floor(base * 1.3)));
      default:
        return base;
    }
  }

  /**
   * Build AI planning prompt
   */
  private buildPlanningPrompt(
    summary: ContentSummary,
    targetCount: number,
    config: PipelineConfig
  ): string {
    return `
Create a detailed presentation blueprint with ${targetCount} slides based on the following content summary.

**Content Summary:**
- Main Topics: ${summary.mainTopics.join(', ')}
- Key Points: ${summary.keyPoints.join(', ')}
- Complexity: ${summary.complexity}
- Keywords: ${summary.keywords.join(', ')}

**Outline:**
${this.formatOutline(summary.outline)}

**Presentation Settings:**
- Theme: ${config.theme}
- Resolution: ${config.resolution}
- Target Slides: ${targetCount}

**Required Output Format:**

Provide a JSON array of slide blueprints. Each blueprint should have:

[
  {
    "slideNumber": 1,
    "title": "Presentation Title",
    "layout": "title",
    "content": {
      "text": ["Subtitle or tagline", "Author/Date info"]
    },
    "notes": "Opening slide to introduce the topic",
    "imagePrompt": "A professional hero image representing...",
    "estimatedTokens": 150
  },
  {
    "slideNumber": 2,
    "title": "Section Title",
    "layout": "content",
    "content": {
      "text": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    },
    "notes": "Explain the main concept",
    "imagePrompt": "An illustration showing...",
    "estimatedTokens": 200
  }
]

**Layout Types:**
- "title": Title slide (first slide only)
- "content": Standard content with bullet points
- "two-column": Two-column layout for comparisons
- "image-focus": Large image with minimal text
- "quote": Featured quote or key statement
- "comparison": Side-by-side comparison

**Guidelines:**
1. First slide MUST be "title" layout
2. Last slide should be a summary/conclusion
3. Use varied layouts for visual interest
4. Each slide should have 3-5 text items (except title and image-focus)
5. Include imagePrompt for slides that would benefit from visuals
6. estimatedTokens: rough token count for slide content (100-300)

Respond with ONLY the JSON array, no additional text.
`;
  }

  /**
   * Format outline for prompt
   */
  private formatOutline(outline: OutlineSection[], indent: number = 0): string {
    return outline
      .map((section) => {
        const prefix = '  '.repeat(indent);
        let text = `${prefix}- ${section.title}: ${section.content}`;
        if (section.subsections && section.subsections.length > 0) {
          text += '\n' + this.formatOutline(section.subsections, indent + 1);
        }
        return text;
      })
      .join('\n');
  }

  /**
   * Parse AI response into blueprints
   */
  private parseBlueprints(responseText: string, targetCount: number): SlideBlueprint[] {
    try {
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }

      // Validate and construct blueprints
      return parsed
        .filter((item) => item.title && typeof item.slideNumber === 'number')
        .map((item) => ({
          slideNumber: item.slideNumber,
          title: item.title,
          layout: this.validateLayout(item.layout),
          content: {
            text: Array.isArray(item.content?.text) ? item.content.text : [],
            images: item.content?.images || [],
            tables: item.content?.tables || [],
            code: item.content?.code || [],
          },
          notes: item.notes || '',
          imagePrompt: item.imagePrompt || undefined,
          estimatedTokens: typeof item.estimatedTokens === 'number' ? item.estimatedTokens : 200,
        }));
    } catch (error) {
      console.error('Failed to parse blueprints, using fallback:', error);
      return this.generateFallbackBlueprints(targetCount);
    }
  }

  /**
   * Validate layout type
   */
  private validateLayout(layout: string): LayoutType {
    const validLayouts: LayoutType[] = [
      'title',
      'content',
      'two-column',
      'image-focus',
      'quote',
      'comparison',
    ];
    return validLayouts.includes(layout as LayoutType) ? (layout as LayoutType) : 'content';
  }

  /**
   * Suggest layout based on content
   */
  private suggestLayout(blueprint: SlideBlueprint): LayoutType {
    const textCount = blueprint.content.text.length;
    const hasImages = (blueprint.content.images?.length || 0) > 0;
    const hasTables = (blueprint.content.tables?.length || 0) > 0;
    const hasCode = (blueprint.content.code?.length || 0) > 0;

    // Image-heavy slides
    if (hasImages && textCount <= 2) {
      return 'image-focus';
    }

    // Table or comparison slides
    if (hasTables || textCount === 2) {
      return 'two-column';
    }

    // Code slides
    if (hasCode) {
      return 'content';
    }

    // Quote slides (single text item)
    if (textCount === 1 && blueprint.content.text[0].length > 50) {
      return 'quote';
    }

    // Default content layout
    return 'content';
  }

  /**
   * Generate image prompt for a slide
   */
  private generateImagePrompt(blueprint: SlideBlueprint): string {
    const title = blueprint.title;
    const content = blueprint.content.text.join(' ');

    return `A professional, visually appealing illustration for a slide titled "${title}". The image should represent: ${content.substring(0, 200)}. Style: modern, clean, suitable for business presentations.`;
  }

  /**
   * Generate fallback blueprints if AI fails
   */
  private generateFallbackBlueprints(count: number): SlideBlueprint[] {
    const blueprints: SlideBlueprint[] = [];

    // Title slide
    blueprints.push({
      slideNumber: 1,
      title: 'Presentation Title',
      layout: 'title',
      content: {
        text: ['Subtitle', 'Date'],
      },
      notes: 'Title slide',
      estimatedTokens: 100,
    });

    // Content slides
    for (let i = 2; i <= count; i++) {
      blueprints.push({
        slideNumber: i,
        title: `Section ${i - 1}`,
        layout: 'content',
        content: {
          text: ['Key point 1', 'Key point 2', 'Key point 3'],
        },
        notes: `Content for section ${i - 1}`,
        estimatedTokens: 200,
      });
    }

    return blueprints;
  }
}
