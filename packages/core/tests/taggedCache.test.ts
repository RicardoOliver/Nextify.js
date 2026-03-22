import { describe, expect, it, vi } from 'vitest';
import { TaggedCache } from '../src/cache/taggedCache';

describe('TaggedCache', () => {
  it('salva, lê e expira por ttl', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    const cache = new TaggedCache<string>();
    cache.set('k1', 'valor', 500, ['a']);
    expect(cache.get('k1')).toBe('valor');

    nowSpy.mockReturnValue(1601);
    expect(cache.get('k1')).toBeNull();
    expect(cache.stats()).toEqual({ keys: 0, tags: 0, listeners: 0 });

    nowSpy.mockRestore();
  });

  it('invalida por tags e chave mantendo índice consistente', () => {
    const cache = new TaggedCache<number>();
    cache.set('a', 1, 60_000, ['t1', 'shared']);
    cache.set('b', 2, 60_000, ['t2', 'shared']);

    expect(cache.invalidateTag('t1')).toBe(1);
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe(2);

    expect(cache.invalidateKey('b')).toBe(1);
    expect(cache.invalidateTags(['shared', 'inexistente'])).toBe(0);
    expect(cache.stats()).toEqual({ keys: 0, tags: 0, listeners: 0 });
  });

  it('emite eventos observáveis de invalidação', () => {
    const cache = new TaggedCache<number>();
    const events: string[] = [];

    const unsubscribe = cache.subscribe((event) => {
      events.push(event.type);
    });

    cache.set('product:1', 1, 60_000, ['products']);
    cache.invalidateTags(['products']);
    unsubscribe();

    expect(events).toEqual(['set', 'invalidate-key', 'invalidate-tag', 'invalidate-tags']);
  });
});
