import { describe, expect, it } from 'vitest';
import {
  createRscPayload,
  defineClientComponent,
  renderRscBoundary,
  serializeRscPayload
} from '../src/rendering/rsc.js';

describe('rsc runtime', () => {
  it('serializa payload de server/client components', async () => {
    const payload = await createRscPayload(
      'home:rsc',
      () => ({ page: 'home', stats: { users: 10 } }),
      [defineClientComponent({ id: 'chart', module: '/client/chart.js' })]
    );

    const serialized = serializeRscPayload(payload);
    expect(serialized).toContain('home');

    const html = renderRscBoundary({ id: 'home-boundary', payload, fallback: '<p>loading</p>' });
    expect(html).toContain('data-nextify-rsc-boundary="home-boundary"');
  });
});
