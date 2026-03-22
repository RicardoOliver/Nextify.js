import { describe, expect, it } from 'vitest';
import {
  AdapterRegistry,
  createEdgeAdapter,
  createNodeAdapter,
  createServerlessAdapter
} from '../src/runtime/adapters.js';

describe('runtime adapters', () => {
  it('registra adapters multi-runtime', async () => {
    const registry = new AdapterRegistry();
    registry.register(createNodeAdapter(async () => ({ status: 200, body: 'ok' })));
    registry.register(createEdgeAdapter(async () => ({ status: 200, body: 'ok' })));
    registry.register(createServerlessAdapter(async () => ({ status: 200, body: 'ok' })));

    expect(registry.list().length).toBe(3);
    expect(registry.list('edge')[0].name).toBe('edge-runtime');

    const artifact = await registry.get('serverless-lambda')?.deploy({ outDir: 'dist', entrypoint: 'server' });
    expect(artifact?.artifact).toContain('.zip');
  });
});
