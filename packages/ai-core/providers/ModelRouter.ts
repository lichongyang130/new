import {
  ModelCapability, ModelDescriptor, ModelProvider, ModelRequest, ModelResponse, ProviderId,
  ProviderError, TokenUsage,
} from './ModelProvider';

export interface RouteRequest extends ModelRequest {
  provider?: ProviderId;
  requiredCapabilities?: ModelCapability[];
  preferredModel?: string;
  maxCostPerMillionInputTokens?: number;
  allowFallback?: boolean;
}

export interface RouterStats {
  requests: number;
  successes: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsageRequests: number;
  providerRequests: Record<string, number>;
  modelRequests: Record<string, number>;
  lastLatencyMs: number;
}

export interface ModelRouterOptions {
  models?: ModelDescriptor[];
  defaultProvider?: ProviderId;
  fallbackOrder?: ProviderId[];
  onUsage?: (response: ModelResponse) => void;
}

export class ModelRouter {
  private readonly providers = new Map<ProviderId, ModelProvider>();
  private readonly models = new Map<string, ModelDescriptor>();
  private readonly providerModels = new Map<ProviderId, string[]>();
  private readonly fallbackOrder: ProviderId[];
  private readonly defaultProvider?: ProviderId;
  private readonly onUsage?: (response: ModelResponse) => void;
  private readonly counters = {
    requests: 0, successes: 0, failures: 0, inputTokens: 0, outputTokens: 0,
    totalTokens: 0, estimatedUsageRequests: 0, providerRequests: {} as Record<string, number>,
    modelRequests: {} as Record<string, number>, lastLatencyMs: 0,
  };

  constructor(options: ModelRouterOptions = {}) {
    this.defaultProvider = options.defaultProvider;
    this.fallbackOrder = options.fallbackOrder ?? ['openai', 'claude', 'deepseek'];
    this.onUsage = options.onUsage;
    for (const model of options.models ?? []) this.registerModel(model);
  }

  registerProvider(provider: ModelProvider): this {
    this.providers.set(provider.id, provider);
    return this;
  }

  unregisterProvider(providerId: ProviderId): boolean {
    return this.providers.delete(providerId);
  }

  registerModel(model: ModelDescriptor): this {
    this.models.set(model.id, { enabled: true, priority: 50, ...model });
    const ids = this.providerModels.get(model.provider) ?? [];
    if (!ids.includes(model.id)) ids.push(model.id);
    this.providerModels.set(model.provider, ids);
    return this;
  }

  listModels(): ModelDescriptor[] {
    return Array.from(this.models.values()).filter(model => model.enabled !== false);
  }

  async discoverModels(): Promise<ModelDescriptor[]> {
    const discovered = await Promise.all(Array.from(this.providers.values()).map(async provider => {
      if (!provider.listModels) return [];
      try {
        return await provider.listModels();
      } catch {
        return [];
      }
    }));
    for (const model of discovered.flat()) this.registerModel(model);
    return this.listModels();
  }

  async complete(request: RouteRequest): Promise<ModelResponse> {
    this.counters.requests += 1;
    const candidates = this.selectCandidates(request);
    if (candidates.length === 0) {
      this.counters.failures += 1;
      throw new ProviderError('No registered model matches the requested provider/capabilities', request.provider ?? this.defaultProvider ?? 'router');
    }

    let lastError: unknown;
    for (let index = 0; index < candidates.length; index += 1) {
      const descriptor = candidates[index];
      const provider = this.providers.get(descriptor.provider);
      if (!provider) continue;
      try {
        const response = await provider.complete({ ...request, model: descriptor.model });
        this.recordSuccess(response);
        try { this.onUsage?.(response); } catch { /* Metrics hooks must not break inference. */ }
        return response;
      } catch (error) {
        lastError = error;
        const fallbackAllowed = request.allowFallback !== false;
        const retryable = !(error instanceof ProviderError) || error.retryable;
        if (!fallbackAllowed || !retryable || index === candidates.length - 1) break;
      }
    }
    this.counters.failures += 1;
    throw lastError instanceof Error ? lastError : new Error('All eligible model providers failed');
  }

  getStats(): RouterStats {
    return {
      ...this.counters,
      providerRequests: { ...this.counters.providerRequests },
      modelRequests: { ...this.counters.modelRequests },
    };
  }

  resetStats(): void {
    this.counters.requests = 0;
    this.counters.successes = 0;
    this.counters.failures = 0;
    this.counters.inputTokens = 0;
    this.counters.outputTokens = 0;
    this.counters.totalTokens = 0;
    this.counters.estimatedUsageRequests = 0;
    this.counters.providerRequests = {};
    this.counters.modelRequests = {};
    this.counters.lastLatencyMs = 0;
  }

  private selectCandidates(request: RouteRequest): ModelDescriptor[] {
    const required = new Set(request.requiredCapabilities ?? []);
    let candidates = this.listModels().filter(model =>
      this.providers.has(model.provider) &&
      (!request.provider || model.provider === request.provider) &&
      (!request.preferredModel || model.model === request.preferredModel || model.id === request.preferredModel) &&
      Array.from(required).every(capability => model.capabilities.includes(capability)) &&
      (request.maxCostPerMillionInputTokens == null ||
        model.costPerMillionInputTokens == null ||
        model.costPerMillionInputTokens <= request.maxCostPerMillionInputTokens),
    );

    const fallbackRank = (provider: ProviderId) => {
      const index = this.fallbackOrder.indexOf(provider);
      return index < 0 ? this.fallbackOrder.length : index;
    };
    candidates = candidates.sort((a, b) => {
      const aPreferred = request.preferredModel && (a.model === request.preferredModel || a.id === request.preferredModel) ? 1 : 0;
      const bPreferred = request.preferredModel && (b.model === request.preferredModel || b.id === request.preferredModel) ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
      const aDefault = a.provider === (request.provider ?? this.defaultProvider) ? 1 : 0;
      const bDefault = b.provider === (request.provider ?? this.defaultProvider) ? 1 : 0;
      if (aDefault !== bDefault) return bDefault - aDefault;
      const aPriority = a.priority ?? 50;
      const bPriority = b.priority ?? 50;
      return bPriority - aPriority || fallbackRank(a.provider) - fallbackRank(b.provider);
    });
    if (request.allowFallback === false && candidates.length > 1) return candidates.slice(0, 1);
    return candidates;
  }

  private recordSuccess(response: ModelResponse): void {
    this.counters.successes += 1;
    const usage: TokenUsage = response.usage;
    this.counters.inputTokens += usage.inputTokens;
    this.counters.outputTokens += usage.outputTokens;
    this.counters.totalTokens += usage.totalTokens;
    if (usage.estimated) this.counters.estimatedUsageRequests += 1;
    this.counters.providerRequests[response.provider] = (this.counters.providerRequests[response.provider] ?? 0) + 1;
    const key = `${response.provider}:${response.model}`;
    this.counters.modelRequests[key] = (this.counters.modelRequests[key] ?? 0) + 1;
    this.counters.lastLatencyMs = response.latencyMs;
  }
}
