import { describe, expect, it, vi } from 'vitest';
import { TaggedCache } from '../src/cache/taggedCache';
import { executeLoader, invalidateDataTags } from '../src/data/runtime';

describe('executeLoader integração com cache e tags', () => {
  it('cache miss/hit e invalidação por tag', async () => {
    const cache = new TaggedCache<unknown>();
    const loaderSpy = vi.fn(async (ctx: { tag: (...values: string[]) => void }) => {
      ctx.tag('products', 'inventory');
      return { ts: Date.now() };
    });

    const request = new Request('http://localhost/products');

    const first = await executeLoader(loaderSpy, request, undefined, {
      cache,
      cacheKey: 'products:list',
      defaultRevalidateSeconds: 120
    });

    expect(first.source).toBe('origin');
    expect(first.tags).toEqual(['products', 'inventory']);
    expect(loaderSpy).toHaveBeenCalledTimes(1);

    const second = await executeLoader(loaderSpy, request, undefined, {
      cache,
      cacheKey: 'products:list'
    });

    expect(second.source).toBe('cache');
    expect(loaderSpy).toHaveBeenCalledTimes(1);

    expect(invalidateDataTags(['products'], cache)).toBe(1);

    const third = await executeLoader(loaderSpy, request, undefined, {
      cache,
      cacheKey: 'products:list'
    });

    expect(third.source).toBe('origin');
    expect(loaderSpy).toHaveBeenCalledTimes(2);
  });
});
