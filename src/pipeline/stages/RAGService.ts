import { DocumentChunk, RAGIndex, IRAGService } from '../../types';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Implements document indexing and semantic search
 */
export class RAGService implements IRAGService {
  private chunks: DocumentChunk[] = [];
  private index: RAGIndex | null = null;

  /**
   * Index document chunks and create searchable index
   */
  async indexDocument(chunks: DocumentChunk[]): Promise<RAGIndex> {
    this.chunks = chunks;

    // Calculate metadata
    const totalChunks = chunks.length;
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
    const avgChunkSize = totalChunks > 0 ? totalLength / totalChunks : 0;

    this.index = {
      chunks,
      metadata: {
        totalChunks,
        avgChunkSize: Math.round(avgChunkSize),
        documentLength: totalLength,
        createdAt: new Date().toISOString(),
      },
    };

    return this.index;
  }

  /**
   * Search for relevant chunks using TF-IDF scoring
   * @param query - Search query
   * @param topK - Number of top results to return
   */
  search(query: string, topK: number = 5): DocumentChunk[] {
    if (this.chunks.length === 0) {
      return [];
    }

    // Normalize query
    const queryTerms = this.tokenize(query.toLowerCase());

    // Calculate TF-IDF scores for each chunk
    const scoredChunks = this.chunks.map((chunk) => {
      const score = this.calculateRelevanceScore(chunk, queryTerms);
      return { chunk, score };
    });

    // Sort by score (descending) and return top K
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.chunk);
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.chunks = [];
    this.index = null;
  }

  /**
   * Calculate relevance score for a chunk
   * Uses TF-IDF inspired scoring with metadata boost
   */
  private calculateRelevanceScore(chunk: DocumentChunk, queryTerms: string[]): number {
    const chunkText = chunk.content.toLowerCase();
    const chunkTerms = this.tokenize(chunkText);

    let score = 0;

    // Term frequency scoring
    for (const term of queryTerms) {
      const termFreq = chunkTerms.filter(t => t === term).length;
      const tf = termFreq / chunkTerms.length;

      // IDF: log(total chunks / chunks containing term)
      const chunksWithTerm = this.chunks.filter(c =>
        c.content.toLowerCase().includes(term)
      ).length;
      const idf = Math.log(this.chunks.length / (chunksWithTerm + 1));

      score += tf * idf;
    }

    // Boost score based on metadata
    // Headers are important - if query terms match headers, boost score
    for (const header of chunk.metadata.headers) {
      const headerLower = header.toLowerCase();
      for (const term of queryTerms) {
        if (headerLower.includes(term)) {
          score *= 1.5; // 50% boost for header matches
        }
      }
    }

    // Boost chunks with rich content (images, tables, code)
    if (chunk.metadata.containsImage) score *= 1.1;
    if (chunk.metadata.containsTable) score *= 1.1;
    if (chunk.metadata.containsCode) score *= 1.1;

    return score;
  }

  /**
   * Tokenize text into terms (words)
   * Removes common stop words
   */
  private tokenize(text: string): string[] {
    // Basic tokenization: split by whitespace and punctuation
    const tokens = text
      .replace(/[^\w\s가-힣]/g, ' ') // Keep alphanumeric and Korean characters
      .split(/\s+/)
      .filter(token => token.length > 0);

    // Remove common English stop words
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
      'what', 'when', 'where', 'who', 'which', 'why', 'how'
    ]);

    return tokens.filter(token => !stopWords.has(token.toLowerCase()));
  }

  /**
   * Get index metadata
   */
  getIndex(): RAGIndex | null {
    return this.index;
  }

  /**
   * Get all chunks
   */
  getChunks(): DocumentChunk[] {
    return this.chunks;
  }
}
