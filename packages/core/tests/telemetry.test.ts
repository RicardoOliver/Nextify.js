import { describe, expect, it } from 'vitest';
import { TelemetryHub } from '../src/observability/telemetry';

describe('telemetry', () => {
  it('coleta logs, métricas e spans com flush atômico', () => {
    const hub = new TelemetryHub();

    hub.log('info', 'request_started', { route: '/products/:slug' });
    hub.increment('http_requests_total', 1, { method: 'GET' });
    hub.histogram('http_request_duration_ms', 42, { route: '/products/:slug' });

    const span = hub.startSpan('render_ssr', { route: '/products/:slug' });
    hub.endSpan(span.id, { statusCode: 200 });

    const first = hub.flush();
    expect(first.logs).toHaveLength(1);
    expect(first.metrics).toHaveLength(2);
    expect(first.spans[0]?.attributes.durationMs).toBeTypeOf('number');

    const second = hub.flush();
    expect(second.logs).toHaveLength(0);
    expect(second.metrics).toHaveLength(0);
    expect(second.spans).toHaveLength(0);
  });
});
