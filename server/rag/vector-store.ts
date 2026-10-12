export interface VectorItem {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export class VectorStore {
  private items: VectorItem[] = [];

  add(item: VectorItem) {
    this.items.push(item);
  }

  search(vector: number[]) {
    return this.items;
  }
}
