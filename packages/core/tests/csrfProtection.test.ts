import { describe, expect, it } from 'vitest';
import { createCsrfProtection } from '../src/middleware/csrfProtection';

describe('csrfProtection', () => {
  it('permite métodos seguros e bloqueia token inválido em métodos de escrita', async () => {
    const middleware = createCsrfProtection({ originAllowList: ['https://app.nextify.dev'] });

    const safe = await middleware(new Request('http://localhost/resource', { method: 'GET' }), async () => new Response('ok'));
    expect(safe.status).toBe(200);

    const invalid = await middleware(
      new Request('http://localhost/resource', {
        method: 'POST',
        headers: {
          origin: 'https://app.nextify.dev',
          cookie: 'csrf-token=abc'
        }
      }),
      async () => new Response('ok')
    );

    expect(invalid.status).toBe(403);

    const valid = await middleware(
      new Request('http://localhost/resource', {
        method: 'POST',
        headers: {
          origin: 'https://app.nextify.dev',
          cookie: 'csrf-token=abc',
          'x-csrf-token': 'abc'
        }
      }),
      async () => new Response('ok')
    );

    expect(valid.status).toBe(200);
  });
});
