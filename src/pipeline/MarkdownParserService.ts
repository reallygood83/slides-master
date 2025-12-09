import {
  DocumentChunk,
  ImageReference,
  TableData,
  CodeBlock,
  IMarkdownParser,
} from '../types';

/**
 * Markdown Parser Service
 * Parses markdown content and extracts structured information
 */
export class MarkdownParser implements IMarkdownParser {
  private chunkSize: number;
  private overlapRatio: number;

  constructor(chunkSize: number = 100, overlapRatio: number = 0.1) {
    this.chunkSize = chunkSize;
    this.overlapRatio = overlapRatio;
  }

  /**
   * Parse markdown content into document chunks
   */
  async parse(content: string): Promise<DocumentChunk[]> {
    const lines = content.split('\n');
    const chunks: DocumentChunk[] = [];
    const overlapLines = Math.floor(this.chunkSize * this.overlapRatio);

    let chunkIndex = 0;
    for (let i = 0; i < lines.length; i += this.chunkSize - overlapLines) {
      const endLine = Math.min(i + this.chunkSize, lines.length);
      const chunkLines = lines.slice(i, endLine);
      const chunkContent = chunkLines.join('\n');

      // Skip empty chunks
      if (!chunkContent.trim()) continue;

      const chunk: DocumentChunk = {
        id: `chunk-${chunkIndex}`,
        content: chunkContent,
        metadata: {
          chunkIndex,
          startLine: i + 1,
          endLine,
          headers: this.extractHeaders(chunkContent),
          containsCode: this.containsCodeBlock(chunkContent),
          containsTable: this.containsTable(chunkContent),
          containsImage: this.containsImage(chunkContent),
        },
      };

      chunks.push(chunk);
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Extract markdown headers from content
   */
  extractHeaders(content: string): string[] {
    const headers: string[] = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
      headers.push(match[2].trim());
    }

    return headers;
  }

  /**
   * Extract image references from markdown
   */
  extractImages(content: string): ImageReference[] {
    const images: ImageReference[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      images.push({
        src: match[2].trim(),
        alt: match[1].trim() || 'Image',
        caption: match[1].trim(),
      });
    }

    return images;
  }

  /**
   * Extract tables from markdown
   */
  extractTables(content: string): TableData[] {
    const tables: TableData[] = [];
    const lines = content.split('\n');

    let inTable = false;
    let currentTable: string[] = [];

    for (const line of lines) {
      // Table row detection (contains |)
      if (line.trim().match(/^\|(.+)\|$/)) {
        inTable = true;
        currentTable.push(line);
      } else if (inTable) {
        // End of table
        if (currentTable.length >= 2) {
          const table = this.parseTable(currentTable);
          if (table) tables.push(table);
        }
        currentTable = [];
        inTable = false;
      }
    }

    // Check for table at end of content
    if (currentTable.length >= 2) {
      const table = this.parseTable(currentTable);
      if (table) tables.push(table);
    }

    return tables;
  }

  /**
   * Extract code blocks from markdown
   */
  extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return codeBlocks;
  }

  /**
   * Check if content contains code blocks
   */
  private containsCodeBlock(content: string): boolean {
    return /```[\s\S]*?```/.test(content);
  }

  /**
   * Check if content contains tables
   */
  private containsTable(content: string): boolean {
    return /^\|(.+)\|$/m.test(content);
  }

  /**
   * Check if content contains images
   */
  private containsImage(content: string): boolean {
    return /!\[([^\]]*)\]\(([^)]+)\)/.test(content);
  }

  /**
   * Parse markdown table into structured data
   */
  private parseTable(tableLines: string[]): TableData | null {
    if (tableLines.length < 2) return null;

    // First line is headers
    const headers = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map(h => h.trim())
      .filter(h => h);

    // Second line is separator, skip it
    if (tableLines.length < 3) return { headers, rows: [] };

    // Remaining lines are data rows
    const rows = tableLines.slice(2).map(line =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
        .filter(cell => cell)
    );

    return {
      headers,
      rows: rows.filter(row => row.length > 0),
    };
  }
}
