import type { CacheMode } from '../cache/smartCache.js';
import { TaggedCache } from '../cache/taggedCache.js';

export type DataParams = Record<string, string | string[]>;

export type DataContext = {
  request: Request;
  params?: DataParams;
  revalidateSeconds?: number;
  tags: Set<string>;
  tag: (...values: string[]) => void;
};

export type Loader<T> = (ctx: DataContext) => Promise<T> | T;
export type Action<T> = (ctx: DataContext) => Promise<T> | T;

export type DataTrace = {
  cacheKey: string;
  mode: CacheMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  outcome: 'cache-hit' | 'cache-miss';
};

export type CachePolicy = {
  mode?: CacheMode;
  revalidateSeconds?: number;
  tags?: string[];
};

export type LoaderOptions = {
  cacheKey?: string;
  mode?: CacheMode;
  cache?: TaggedCache<unknown>;
  defaultRevalidateSeconds?: number;
  policy?: CachePolicy;
};

export type LoaderResult<T> = {
  data: T;
  source: 'cache' | 'origin';
  tags: string[];
  trace: DataTrace;
};

export function defineLoader<T>(loader: Loader<T>) {
  return loader;
}

export function defineAction<T>(action: Action<T>) {
  return action;
}

export function defineCachePolicy(policy: CachePolicy): CachePolicy {
  return policy;
}

const runtimeCache = new TaggedCache<unknown>();

export async function executeLoader<T>(
  loader: Loader<T>,
  request: Request,
  params?: DataParams,
  options: LoaderOptions = {}
): Promise<LoaderResult<T>> {
  const policy = options.policy;
  const mode = options.mode ?? policy?.mode ?? 'stale-while-revalidate';
  const cache = options.cache ?? runtimeCache;
  const cacheKey = options.cacheKey ?? `${request.method}:${request.url}`;
  const startedAt = Date.now();

  if (mode !== 'no-store') {
    const cached = cache.get(cacheKey) as T | null;
    if (cached !== null) {
      const endedAt = Date.now();
      return {
        data: cached,
        source: 'cache',
        tags: [],
        trace: {
          cacheKey,
          mode,
          startedAt,
          endedAt,
          durationMs: endedAt - startedAt,
          outcome: 'cache-hit'
        }
      };
    }
  }

  const tags = new Set<string>();
  const ctx: DataContext = {
    request,
    params,
    tags,
    tag: (...values: string[]) => {
      for (const value of values) {
        if (value.trim()) tags.add(value);
      }
    }
  };

  const data = await loader(ctx);
  const revalidateSeconds =
    ctx.revalidateSeconds ?? policy?.revalidateSeconds ?? options.defaultRevalidateSeconds ?? 60;
  const mergedTags = [...new Set([...(policy?.tags ?? []), ...tags])];

  if (mode !== 'no-store') {
    cache.set(cacheKey, data, revalidateSeconds * 1000, mergedTags);
  }

  const endedAt = Date.now();

  return {
    data,
    source: 'origin',
    tags: mergedTags,
    trace: {
      cacheKey,
      mode,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      outcome: 'cache-miss'
    }
  };
}

export function invalidateDataTags(tags: string[], cache: TaggedCache<unknown> = runtimeCache) {
  return cache.invalidateTags(tags);
}
