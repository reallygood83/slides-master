import {
  RAGIndex,
  ContentSummary,
  OutlineSection,
  SlideLength,
  ISummaryService,
  Paper2SlidesSettings,
} from '../../types';
import { AIProviderFactory } from '../../services';
import { AIProviderService } from '../../services/AIProviderService';

/**
 * Summary Service (Stage 2)
 * Analyzes document content and generates comprehensive summary using AI
 */
export class SummaryService implements ISummaryService {
  private aiProvider: AIProviderService;

  constructor(settings: Paper2SlidesSettings) {
    // Use prompt provider for text analysis
    this.aiProvider = AIProviderFactory.createPromptProvider(settings);
  }

  /**
   * Generate comprehensive content summary from RAG index
   */
  async generateSummary(ragIndex: RAGIndex): Promise<ContentSummary> {
    // Extract all content from chunks
    const fullContent = ragIndex.chunks.map((chunk) => chunk.content).join('\n\n');

    // Build analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(fullContent, ragIndex.chunks.length);

    // Call AI for analysis
    const response = await this.aiProvider.generateText({
      prompt: analysisPrompt,
      systemPrompt: `You are an expert content analyst. Your task is to analyze documents and create structured summaries for presentation slides. Always respond with valid JSON only.`,
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 4096,
    });

    // Parse AI response
    const summary = this.parseAIResponse(response.text, ragIndex);

    return summary;
  }

  /**
   * Estimate slide count based on content summary and desired length
   */
  estimateSlideCount(summary: ContentSummary, length: SlideLength): number {
    const baseCount = summary.suggestedSlideCount;

    switch (length) {
      case 'short':
        return Math.max(5, Math.min(10, Math.floor(baseCount * 0.7)));
      case 'medium':
        return Math.max(10, Math.min(15, baseCount));
      case 'long':
        return Math.max(15, Math.min(25, Math.floor(baseCount * 1.3)));
    }
  }

  /**
   * Build AI analysis prompt
   */
  private buildAnalysisPrompt(content: string, chunkCount: number): string {
    return `
Analyze the following document content and provide a comprehensive summary for creating presentation slides.

**Document Content (${chunkCount} sections):**
${content.substring(0, 15000)} ${content.length > 15000 ? '\n\n[Content truncated...]' : ''}

**Required Analysis:**

Provide your analysis in the following JSON format:

{
  "mainTopics": ["topic1", "topic2", "topic3"],
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "suggestedSlideCount": 12,
  "estimatedDuration": 15,
  "complexity": "intermediate",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "outline": [
    {
      "title": "Introduction",
      "level": 1,
      "content": "Overview of the topic",
      "subsections": [
        {
          "title": "Background",
          "level": 2,
          "content": "Historical context"
        }
      ]
    }
  ]
}

**Guidelines:**
1. **mainTopics**: 3-5 main themes of the document
2. **keyPoints**: 5-7 most important takeaways
3. **suggestedSlideCount**: Recommended number of slides (10-20)
4. **estimatedDuration**: Presentation time in minutes (assuming 1-2 min per slide)
5. **complexity**: "beginner", "intermediate", or "advanced"
6. **keywords**: 5-10 important keywords
7. **outline**: Hierarchical structure with titles, levels (1-3), and content summaries

Respond with ONLY the JSON object, no additional text.
`;
  }

  /**
   * Parse AI response and extract ContentSummary
   */
  private parseAIResponse(responseText: string, ragIndex: RAGIndex): ContentSummary {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and construct ContentSummary
      return {
        mainTopics: Array.isArray(parsed.mainTopics) ? parsed.mainTopics : [],
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        suggestedSlideCount: typeof parsed.suggestedSlideCount === 'number'
          ? parsed.suggestedSlideCount
          : this.fallbackSlideCount(ragIndex),
        estimatedDuration: typeof parsed.estimatedDuration === 'number'
          ? parsed.estimatedDuration
          : Math.ceil((parsed.suggestedSlideCount || 10) * 1.5),
        complexity: ['beginner', 'intermediate', 'advanced'].includes(parsed.complexity)
          ? parsed.complexity
          : 'intermediate',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        outline: Array.isArray(parsed.outline) ? this.validateOutline(parsed.outline) : [],
      };
    } catch (error) {
      console.error('Failed to parse AI response, using fallback:', error);
      return this.generateFallbackSummary(ragIndex);
    }
  }

  /**
   * Validate outline structure
   */
  private validateOutline(outline: any[]): OutlineSection[] {
    return outline
      .filter((section) => section.title && typeof section.level === 'number')
      .map((section) => ({
        title: section.title,
        level: section.level,
        content: section.content || '',
        subsections: Array.isArray(section.subsections)
          ? this.validateOutline(section.subsections)
          : undefined,
      }));
  }

  /**
   * Generate fallback summary if AI fails
   */
  private generateFallbackSummary(ragIndex: RAGIndex): ContentSummary {
    // Extract headers from chunks
    const allHeaders = ragIndex.chunks.flatMap((chunk) => chunk.metadata.headers);
    const uniqueHeaders = [...new Set(allHeaders)];

    // Simple keyword extraction (most frequent terms)
    const allContent = ragIndex.chunks.map((c) => c.content).join(' ');
    const words = allContent.toLowerCase().match(/\b[a-z가-힣]{4,}\b/g) || [];
    const wordFreq = new Map<string, number>();
    words.forEach((word) => wordFreq.set(word, (wordFreq.get(word) || 0) + 1));
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((e) => e[0]);

    const slideCount = this.fallbackSlideCount(ragIndex);

    return {
      mainTopics: uniqueHeaders.slice(0, 5),
      keyPoints: uniqueHeaders.slice(0, 7),
      suggestedSlideCount: slideCount,
      estimatedDuration: Math.ceil(slideCount * 1.5),
      complexity: 'intermediate',
      keywords,
      outline: uniqueHeaders.slice(0, 10).map((title, index) => ({
        title,
        level: 1,
        content: `Section ${index + 1}`,
      })),
    };
  }

  /**
   * Calculate fallback slide count based on content length
   */
  private fallbackSlideCount(ragIndex: RAGIndex): number {
    // Estimate: 1 slide per 200 words
    const totalWords = ragIndex.chunks.reduce((sum, chunk) => {
      const words = chunk.content.split(/\s+/).length;
      return sum + words;
    }, 0);

    const estimated = Math.ceil(totalWords / 200);

    // Clamp between 5 and 25 slides
    return Math.max(5, Math.min(25, estimated));
  }
}
