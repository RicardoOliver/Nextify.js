import { describe, expect, it } from 'vitest';
import { createTrace } from '../src/observability/distributedTracing.js';
import { toOtelPayload } from '../src/observability/otelExporter.js';

describe('otel exporter', () => {
  it('converte snapshot para payload compatível com otel', () => {
    const trace = createTrace();
    const payload = toOtelPayload(
      {
        logs: [{ level: 'info', message: 'ok', timestamp: new Date().toISOString() }],
        metrics: [{ name: 'ttfb', type: 'histogram', value: 40, timestamp: Date.now() }],
        spans: [{ id: '1', name: 'render', startedAt: 1, endedAt: 2, attributes: {} }]
      },
      trace,
      'nextify-enterprise'
    );

    expect(payload.resource.attributes[0].value.stringValue).toBe('nextify-enterprise');
    expect(payload.traces.traceId).toBe(trace.traceId);
    expect(payload.metrics).toHaveLength(1);
  });
});
