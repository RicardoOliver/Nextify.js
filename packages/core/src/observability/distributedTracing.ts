export type TraceContext = {
  traceId: string;
  parentSpanId?: string;
  spanId: string;
};

function randomId(size = 16) {
  return Math.random().toString(16).slice(2).padEnd(size, '0').slice(0, size);
}

export function createTrace(parent?: TraceContext): TraceContext {
  return {
    traceId: parent?.traceId ?? randomId(32),
    parentSpanId: parent?.spanId,
    spanId: randomId(16)
  };
}

export function toTraceHeader(ctx: TraceContext) {
  return `00-${ctx.traceId}-${ctx.spanId}-01`;
}

export function fromTraceHeader(header: string): TraceContext | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;
  return {
    traceId: parts[1],
    spanId: parts[2]
  };
}
