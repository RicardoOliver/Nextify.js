import { describe, expect, it } from 'vitest';
import { createRateLimit } from '../src/middleware/rateLimit';

describe('rateLimit', () => {
  it('bloqueia requests acima do limite e devolve headers de controle', async () => {
    const middleware = createRateLimit({ maxRequests: 2, windowMs: 1000 });
    const req = new Request('http://localhost/api/private', {
      headers: { 'x-forwarded-for': '10.0.0.1' }
    });

    const first = await middleware(req, async () => new Response('ok'));
    const second = await middleware(req, async () => new Response('ok'));
    const third = await middleware(req, async () => new Response('ok'));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.headers.get('X-RateLimit-Remaining')).toBe('0');

    expect(third.status).toBe(429);
    expect(third.headers.get('Retry-After')).not.toBeNull();
    expect(third.headers.get('X-RateLimit-Limit')).toBe('2');
  });

  it('limita crescimento de memória com maxEntries', async () => {
    const middleware = createRateLimit({
      maxRequests: 5,
      windowMs: 60_000,
      maxEntries: 2,
      keyGenerator: (req) => req.headers.get('x-real-ip') ?? 'anonymous'
    });

    await middleware(new Request('http://localhost/a', { headers: { 'x-real-ip': '10.0.0.1' } }), async () => new Response('ok'));
    await middleware(new Request('http://localhost/a', { headers: { 'x-real-ip': '10.0.0.2' } }), async () => new Response('ok'));
    await middleware(new Request('http://localhost/a', { headers: { 'x-real-ip': '10.0.0.3' } }), async () => new Response('ok'));

    const replayFirst = await middleware(
      new Request('http://localhost/a', { headers: { 'x-real-ip': '10.0.0.1' } }),
      async () => new Response('ok')
    );

    expect(replayFirst.status).toBe(200);
    expect(replayFirst.headers.get('X-RateLimit-Remaining')).toBe('4');
  });
});
