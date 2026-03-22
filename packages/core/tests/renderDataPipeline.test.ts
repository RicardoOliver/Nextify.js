import { describe, expect, it, vi } from 'vitest';
import {
  InMemoryRevalidationBus,
  IntegratedRenderDataPipeline
} from '../src/rendering/renderDataPipeline';

describe('IntegratedRenderDataPipeline', () => {
  it('mantém semântica determinística de tempo para ISR', async () => {
    let now = 1_000;
    const pipeline = new IntegratedRenderDataPipeline({ now: () => now });
    const resolve = vi.fn(async () => ({ body: '<h1>v1</h1>', data: { version: 1 }, payloadKind: 'html' as const }));

    const first = await pipeline.render('home', resolve, {
      strategy: 'isr',
      mode: 'dev',
      revalidateSeconds: 10,
      tags: ['home']
    });

    expect(first.source).toBe('origin');
    expect(first.revalidateAt).toBe(11_000);
    expect(resolve).toHaveBeenCalledTimes(1);

    now = 9_000;
    const second = await pipeline.render('home', resolve, {
      strategy: 'isr',
      mode: 'prod',
      revalidateSeconds: 10,
      tags: ['home']
    });

    expect(second.source).toBe('cache');
    expect(second.freshness).toBe('fresh');
    expect(resolve).toHaveBeenCalledTimes(1);

    now = 11_100;
    const third = await pipeline.render('home', resolve, {
      strategy: 'isr',
      mode: 'prod',
      revalidateSeconds: 10,
      tags: ['home']
    });

    expect(third.source).toBe('origin');
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('revalida por tag e por evento com propagação distribuída', async () => {
    const bus = new InMemoryRevalidationBus();
    const a = new IntegratedRenderDataPipeline({ bus });
    const b = new IntegratedRenderDataPipeline({ bus });

    const resolveA = vi.fn(async () => ({ body: '<h1>A</h1>', data: { id: 'A' }, payloadKind: 'html' as const }));
    const resolveB = vi.fn(async () => ({ body: '<h1>B</h1>', data: { id: 'B' }, payloadKind: 'rsc' as const }));

    await a.render('products', resolveA, {
      strategy: 'isr',
      revalidateSeconds: 60,
      tags: ['products'],
      events: ['catalog.updated']
    });

    await b.render('products', resolveB, {
      strategy: 'isr',
      revalidateSeconds: 60,
      tags: ['products'],
      events: ['catalog.updated']
    });

    expect(a.revalidateTags(['products'])).toBe(1);

    const rerenderB = await b.render('products', resolveB, {
      strategy: 'isr',
      revalidateSeconds: 60,
      tags: ['products'],
      events: ['catalog.updated']
    });

    expect(rerenderB.source).toBe('origin');
    expect(resolveB).toHaveBeenCalledTimes(2);

    await a.render('products', resolveA, {
      strategy: 'isr',
      revalidateSeconds: 60,
      tags: ['products'],
      events: ['catalog.updated']
    });

    expect(a.revalidateEvent('catalog.updated')).toBe(1);

    const rerenderA = await a.render('products', resolveA, {
      strategy: 'isr',
      revalidateSeconds: 60,
      tags: ['products'],
      events: ['catalog.updated']
    });

    expect(rerenderA.source).toBe('origin');
    expect(resolveA).toHaveBeenCalledTimes(3);
  });

  it('define fallback explícito para payload RSC', async () => {
    const pipeline = new IntegratedRenderDataPipeline();

    const result = await pipeline.render(
      'dashboard',
      async () => ({
        body: '{"flight":true}',
        data: { modules: ['kpi-cards'] },
        payloadKind: 'rsc'
      }),
      {
        strategy: 'ssg',
        tags: ['dashboard']
      }
    );

    expect(result.envelope.payloadKind).toBe('rsc');
    expect(result.source).toBe('origin');
  });
});
