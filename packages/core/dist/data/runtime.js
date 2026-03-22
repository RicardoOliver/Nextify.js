import { TaggedCache } from '../cache/taggedCache.js';
export function defineLoader(loader) {
    return loader;
}
export function defineAction(action) {
    return action;
}
export function defineCachePolicy(policy) {
    return policy;
}
const runtimeCache = new TaggedCache();
export async function executeLoader(loader, request, params, options = {}) {
    const policy = options.policy;
    const mode = options.mode ?? policy?.mode ?? 'stale-while-revalidate';
    const cache = options.cache ?? runtimeCache;
    const cacheKey = options.cacheKey ?? `${request.method}:${request.url}`;
    const startedAt = Date.now();
    if (mode !== 'no-store') {
        const cached = cache.get(cacheKey);
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
export function invalidateDataTags(tags, cache = runtimeCache) {
    return cache.invalidateTags(tags);
}
