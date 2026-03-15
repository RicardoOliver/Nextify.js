import { TaggedCache } from '../cache/taggedCache.js';
export function defineLoader(loader) {
    return loader;
}
export function defineAction(action) {
    return action;
}
const runtimeCache = new TaggedCache();
export async function executeLoader(loader, request, params, options = {}) {
    const mode = options.mode ?? 'stale-while-revalidate';
    const cache = options.cache ?? runtimeCache;
    const cacheKey = options.cacheKey ?? `${request.method}:${request.url}`;
    if (mode !== 'no-store') {
        const cached = cache.get(cacheKey);
        if (cached !== null) {
            return { data: cached, source: 'cache', tags: [] };
        }
    }
    const tags = new Set();
    const ctx = {
        request,
        params,
        tags,
        tag: (...values) => {
            for (const value of values) {
                if (value.trim())
                    tags.add(value);
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
export function invalidateDataTags(tags, cache = runtimeCache) {
    return cache.invalidateTags(tags);
}
