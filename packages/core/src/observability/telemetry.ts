export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogRecord = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
};

export type MetricType = 'counter' | 'histogram';

export type MetricRecord = {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
};

export type Span = {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  attributes: Record<string, string | number | boolean>;
};

export class TelemetryHub {
  private logs: LogRecord[] = [];
  private metrics: MetricRecord[] = [];
  private spans: Span[] = [];

  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    this.logs.push({
      level,
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  increment(name: string, value = 1, labels?: Record<string, string>) {
    this.metrics.push({
      name,
      type: 'counter',
      value,
      labels,
      timestamp: Date.now()
    });
  }

  histogram(name: string, value: number, labels?: Record<string, string>) {
    this.metrics.push({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: Date.now()
    });
  }

  startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): Span {
    const span: Span = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      startedAt: Date.now(),
      attributes
    };

    this.spans.push(span);
    return span;
  }

  endSpan(spanId: string, extraAttributes: Record<string, string | number | boolean> = {}) {
    const span = this.spans.find((entry) => entry.id === spanId);
    if (!span) return;

    span.endedAt = Date.now();
    span.attributes = {
      ...span.attributes,
      ...extraAttributes,
      durationMs: span.endedAt - span.startedAt
    };
  }

  snapshot() {
    return {
      logs: [...this.logs],
      metrics: [...this.metrics],
      spans: [...this.spans]
    };
  }

  flush() {
    const payload = this.snapshot();
    this.logs = [];
    this.metrics = [];
    this.spans = [];
    return payload;
  }
}
