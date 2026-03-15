import { describe, expect, it } from 'vitest';
import { composeMiddleware } from '../src/middleware/compose';

describe('composeMiddleware', () => {
  it('executa middlewares na ordem e retorna terminal', async () => {
    const trace: string[] = [];
    const run = composeMiddleware([
      async (_req, next) => {
        trace.push('m1:in');
        const res = await next();
        trace.push('m1:out');
        return res;
      },
      async (_req, next) => {
        trace.push('m2:in');
        const res = await next();
        trace.push('m2:out');
        return res;
      }
    ]);

    const response = await run(new Request('http://localhost/test'), async () => {
      trace.push('terminal');
      return new Response('ok');
    });

    expect(await response.text()).toBe('ok');
    expect(trace).toEqual(['m1:in', 'm2:in', 'terminal', 'm2:out', 'm1:out']);
  });

  it('falha quando next é chamado múltiplas vezes', async () => {
    const run = composeMiddleware([
      async (_req, next) => {
        await next();
        return next();
      }
    ]);

    await expect(run(new Request('http://localhost/err'), async () => new Response('ok'))).rejects.toThrow(
      'next() chamado múltiplas vezes'
    );
  });
});
