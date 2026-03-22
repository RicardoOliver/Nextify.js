export type RenderMode = 'dev' | 'prod';
export type RenderingStrategy = 'ssr' | 'ssg' | 'isr';
export type PayloadKind = 'html' | 'rsc' | 'json';

export type RenderEnvelope<TData> = {
  body: string;
  data: TData;
  payloadKind: PayloadKind;
};

export type RenderContext = {
  key: string;
  strategy: RenderingStrategy;
  mode: RenderMode;
};

export type ResolveRender<TData> = (
  ctx: RenderContext
) => Promise<RenderEnvelope<TData>> | RenderEnvelope<TData>;

export type RenderSource = 'cache' | 'origin';

export type RenderResult<TData> = {
  source: RenderSource;
  freshness: 'fresh' | 'stale';
  envelope: RenderEnvelope<TData>;
  generatedAt: number;
  revalidateAt?: number;
  tags: string[];
  events: string[];
};

export type RenderPipelineOptions = {
  strategy: RenderingStrategy;
  mode?: RenderMode;
  revalidateSeconds?: number;
  tags?: string[];
  events?: string[];
};

type CacheEntry<TData> = {
  envelope: RenderEnvelope<TData>;
  generatedAt: number;
  revalidateAt?: number;
  tags: string[];
  events: string[];
};

export type RevalidationMessage =
  | { type: 'tag'; values: string[] }
  | { type: 'event'; values: string[] };

export type RevalidationBus = {
  publish: (message: RevalidationMessage) => Promise<void> | void;
  subscribe: (handler: (message: RevalidationMessage) => void) => () => void;
};

export class InMemoryRevalidationBus implements RevalidationBus {
  private listeners = new Set<(message: RevalidationMessage) => void>();

  publish(message: RevalidationMessage) {
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  subscribe(handler: (message: RevalidationMessage) => void) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
}

export class IntegratedRenderDataPipeline {
  private entries = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>();
  private eventIndex = new Map<string, Set<string>>();
  private now: () => number;

  constructor(options: { now?: () => number; bus?: RevalidationBus } = {}) {
    this.now = options.now ?? (() => Date.now());

    if (options.bus) {
      options.bus.subscribe((message) => {
        if (message.type === 'tag') this.invalidateTags(message.values);
        if (message.type === 'event') this.invalidateEvents(message.values);
      });
      this.bus = options.bus;
    }
  }

  private bus?: RevalidationBus;

  async render<TData>(
    key: string,
    resolve: ResolveRender<TData>,
    options: RenderPipelineOptions
  ): Promise<RenderResult<TData>> {
    const mode = options.mode ?? 'prod';
    const entry = this.entries.get(key) as CacheEntry<TData> | undefined;

    if (entry) {
      const stale = typeof entry.revalidateAt === 'number' && this.now() >= entry.revalidateAt;
      if (!stale) {
        return {
          source: 'cache',
          freshness: 'fresh',
          envelope: entry.envelope,
          generatedAt: entry.generatedAt,
          revalidateAt: entry.revalidateAt,
          tags: [...entry.tags],
          events: [...entry.events]
        };
      }

      if (options.strategy === 'ssg') {
        return {
          source: 'cache',
          freshness: 'stale',
          envelope: entry.envelope,
          generatedAt: entry.generatedAt,
          revalidateAt: entry.revalidateAt,
          tags: [...entry.tags],
          events: [...entry.events]
        };
      }
    }

    const envelope = await resolve({
      key,
      strategy: options.strategy,
      mode
    });

    const generatedAt = this.now();
    const revalidateAt =
      typeof options.revalidateSeconds === 'number'
        ? generatedAt + options.revalidateSeconds * 1000
        : undefined;

    const tags = normalizeValues(options.tags);
    const events = normalizeValues(options.events);

    this.setEntry(key, {
      envelope,
      generatedAt,
      revalidateAt,
      tags,
      events
    });

    return {
      source: 'origin',
      freshness: 'fresh',
      envelope,
      generatedAt,
      revalidateAt,
      tags,
      events
    };
  }

  revalidateTags(tags: string[]) {
    const normalized = normalizeValues(tags);
    const count = this.invalidateTags(normalized);
    this.bus?.publish({ type: 'tag', values: normalized });
    return count;
  }

  revalidateEvent(eventName: string) {
    const normalized = normalizeValues([eventName]);
    const count = this.invalidateEvents(normalized);
    this.bus?.publish({ type: 'event', values: normalized });
    return count;
  }

  private invalidateTags(tags: string[]) {
    let removed = 0;
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (!keys) continue;

      for (const key of keys) {
        removed += this.deleteKey(key);
      }

      this.tagIndex.delete(tag);
    }

    return removed;
  }

  private invalidateEvents(events: string[]) {
    let removed = 0;
    for (const eventName of events) {
      const keys = this.eventIndex.get(eventName);
      if (!keys) continue;

      for (const key of keys) {
        removed += this.deleteKey(key);
      }

      this.eventIndex.delete(eventName);
    }

    return removed;
  }

  private setEntry<TData>(key: string, entry: CacheEntry<TData>) {
    this.deleteKey(key);
    this.entries.set(key, entry);

    for (const tag of entry.tags) {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag)?.add(key);
    }

    for (const eventName of entry.events) {
      if (!this.eventIndex.has(eventName)) this.eventIndex.set(eventName, new Set());
      this.eventIndex.get(eventName)?.add(key);
    }
  }

  private deleteKey(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return 0;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      keys?.delete(key);
      if (keys && keys.size === 0) this.tagIndex.delete(tag);
    }

    for (const eventName of entry.events) {
      const keys = this.eventIndex.get(eventName);
      keys?.delete(key);
      if (keys && keys.size === 0) this.eventIndex.delete(eventName);
    }

    this.entries.delete(key);
    return 1;
  }
}

function normalizeValues(values: string[] | undefined) {
  if (!values) return [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
