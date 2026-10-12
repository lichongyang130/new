export interface EmbeddingResult {
  vector: number[];
  text: string;
}

export class EmbeddingService {
  async createEmbedding(text: string): Promise<EmbeddingResult> {
    return {
      vector: [],
      text
    };
  }
}
