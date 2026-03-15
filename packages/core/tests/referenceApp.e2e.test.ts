import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';

let serverProcess: ReturnType<typeof spawn>;

beforeAll(async () => {
  serverProcess = spawn('node', ['examples/reference-app/server.mjs'], {
    cwd: process.cwd().includes('packages/core') ? '../..' : process.cwd(),
    env: { ...process.env, PORT: '4010' },
    stdio: 'pipe'
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timeout ao subir reference app para o smoke E2E.')),
      10_000
    );

    serverProcess.stdout.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('reference-app running')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Reference app encerrou antes do teste. Código: ${code}`));
    });
  });
});

afterAll(() => {
  serverProcess?.kill('SIGTERM');
});

describe('reference app smoke E2E', () => {
  it('valida SSR streaming + security headers', async () => {
    const response = await fetch('http://127.0.0.1:4010/');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Nextify Reference App');
    expect(html).toContain('SSR streaming ativo');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('valida API routes + data runtime com cache tags', async () => {
    const health = await fetch('http://127.0.0.1:4010/api/health');
    const healthPayload = await health.json();

    expect(health.status).toBe(200);
    expect(healthPayload).toEqual({ ok: true, service: 'reference-app' });
    expect(health.headers.get('content-security-policy')).toBe("default-src 'self'");

    const firstCatalog = await fetch('http://127.0.0.1:4010/api/catalog');
    const firstPayload = await firstCatalog.json();
    expect(firstPayload.source).toBe('origin');
    expect(firstPayload.tags).toContain('catalog');

    const secondCatalog = await fetch('http://127.0.0.1:4010/api/catalog');
    const secondPayload = await secondCatalog.json();
    expect(secondPayload.source).toBe('cache');

    const revalidate = await fetch('http://127.0.0.1:4010/api/revalidate?tag=catalog');
    expect(revalidate.status).toBe(200);

    const thirdCatalog = await fetch('http://127.0.0.1:4010/api/catalog');
    const thirdPayload = await thirdCatalog.json();
    expect(thirdPayload.source).toBe('origin');
  });
});
