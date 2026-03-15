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

export type LoaderOptions = {
  cacheKey?: string;
  mode?: CacheMode;
  cache?: TaggedCache<unknown>;
  defaultRevalidateSeconds?: number;
};

export type LoaderResult<T> = {
  data: T;
  source: 'cache' | 'origin';
  tags: string[];
};

export function defineLoader<T>(loader: Loader<T>) {
  return loader;
}

export function defineAction<T>(action: Action<T>) {
  return action;
}

const runtimeCache = new TaggedCache<unknown>();

export async function executeLoader<T>(
  loader: Loader<T>,
  request: Request,
  params?: DataParams,
  options: LoaderOptions = {}
): Promise<LoaderResult<T>> {
  const mode = options.mode ?? 'stale-while-revalidate';
  const cache = options.cache ?? runtimeCache;
  const cacheKey = options.cacheKey ?? `${request.method}:${request.url}`;

  if (mode !== 'no-store') {
    const cached = cache.get(cacheKey) as T | null;
    if (cached !== null) {
      return { data: cached, source: 'cache', tags: [] };
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
  const revalidateSeconds = ctx.revalidateSeconds ?? options.defaultRevalidateSeconds ?? 60;

  if (mode !== 'no-store') {
    cache.set(cacheKey, data, revalidateSeconds * 1000, [...tags]);
  }

  return { data, source: 'origin', tags: [...tags] };
}

export function invalidateDataTags(tags: string[], cache: TaggedCache<unknown> = runtimeCache) {
  return cache.invalidateTags(tags);
}
