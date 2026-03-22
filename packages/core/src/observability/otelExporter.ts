import type { TraceContext } from './distributedTracing.js';
import type { MetricRecord, Span } from './telemetry.js';

export type TelemetrySnapshot = {
  logs: Array<{ level: string; message: string; timestamp: string; context?: Record<string, unknown> }>;
  metrics: MetricRecord[];
  spans: Span[];
};

export function toOtelResource(serviceName = 'nextify-app') {
  return {
    resource: {
      attributes: [
        { key: 'service.name', value: { stringValue: serviceName } },
        { key: 'service.namespace', value: { stringValue: 'nextify' } }
      ]
    }
  };
}

export function toOtelPayload(snapshot: TelemetrySnapshot, trace: TraceContext, serviceName?: string) {
  return {
    ...toOtelResource(serviceName),
    traces: {
      traceId: trace.traceId,
      spanId: trace.spanId,
      spans: snapshot.spans
    },
    metrics: snapshot.metrics,
    logs: snapshot.logs
  };
}

export async function exportToConsoleOtel(snapshot: TelemetrySnapshot, trace: TraceContext, serviceName?: string) {
  const payload = toOtelPayload(snapshot, trace, serviceName);
  console.log(JSON.stringify(payload));
  return payload;
}
