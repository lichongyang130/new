import type { Operation } from './operation.queue';

export class SyncEngine {
  apply(operation: Operation) {
    return {
      applied: true,
      operation,
    };
  }
}
