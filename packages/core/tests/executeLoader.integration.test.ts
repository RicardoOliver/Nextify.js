import { describe, expect, it, vi } from 'vitest';
import { TaggedCache } from '../src/cache/taggedCache';
import { defineCachePolicy, executeLoader, invalidateDataTags } from '../src/data/runtime';

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
    expect(first.trace.outcome).toBe('cache-miss');
    expect(loaderSpy).toHaveBeenCalledTimes(1);

    const second = await executeLoader(loaderSpy, request, undefined, {
      cache,
      cacheKey: 'products:list'
    });

    expect(second.source).toBe('cache');
    expect(second.trace.outcome).toBe('cache-hit');
    expect(loaderSpy).toHaveBeenCalledTimes(1);

    expect(invalidateDataTags(['products'], cache)).toBe(1);

    const third = await executeLoader(loaderSpy, request, undefined, {
      cache,
      cacheKey: 'products:list'
    });

    expect(third.source).toBe('origin');
    expect(loaderSpy).toHaveBeenCalledTimes(2);
  });

  it('aplica política declarativa de cache e tags padrão', async () => {
    const cache = new TaggedCache<unknown>();
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockImplementation(() => 100);

    const loader = vi.fn(async () => ({ ok: true }));
    const policy = defineCachePolicy({
      mode: 'force-cache',
      revalidateSeconds: 30,
      tags: ['catalog']
    });

    const result = await executeLoader(loader, new Request('http://localhost/catalog'), undefined, {
      cache,
      cacheKey: 'catalog:list',
      policy
    });

    expect(result.tags).toEqual(['catalog']);
    expect(result.trace.mode).toBe('force-cache');
    expect(result.trace.durationMs).toBeGreaterThanOrEqual(0);
    expect(cache.get('catalog:list')).toEqual({ ok: true });

    nowSpy.mockRestore();
  });
});
