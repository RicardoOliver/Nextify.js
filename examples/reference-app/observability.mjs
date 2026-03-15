import { randomUUID } from 'node:crypto';

const LATENCY_BUCKETS_MS = [50, 100, 250, 500, 1000, 2000];

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

export function getOrCreateRequestId(headers = {}) {
  const requestIdHeader = headers['x-request-id'];

  if (typeof requestIdHeader === 'string' && requestIdHeader.trim().length > 0) {
    return requestIdHeader.trim();
  }

  return randomUUID();
}

export function createLogger({ service }) {
  return {
    info(event, context = {}) {
      console.log(
        JSON.stringify({
          level: 'info',
          service,
          event,
          timestamp: new Date().toISOString(),
          ...context
        })
      );
    },
    error(event, context = {}) {
      console.error(
        JSON.stringify({
          level: 'error',
          service,
          event,
          timestamp: new Date().toISOString(),
          ...context
        })
      );
    }
  };
}

export function createRouteMetrics() {
  const byRoute = new Map();

  function getRouteRecord(route) {
    if (!byRoute.has(route)) {
      byRoute.set(route, {
        route,
        requests: 0,
        errors: 0,
        totalLatencyMs: 0,
        maxLatencyMs: 0,
        latencyBuckets: Object.fromEntries(
          LATENCY_BUCKETS_MS.map((bucket) => [`le_${bucket}`, 0]).concat([['le_inf', 0]])
        ),
        statusCounts: {}
      });
    }

    return byRoute.get(route);
  }

  function record({ route, durationMs, statusCode }) {
    const record = getRouteRecord(route);

    record.requests += 1;
    record.totalLatencyMs += durationMs;
    record.maxLatencyMs = Math.max(record.maxLatencyMs, durationMs);

    if (statusCode >= 500) {
      record.errors += 1;
    }

    const status = String(statusCode);
    record.statusCounts[status] = (record.statusCounts[status] || 0) + 1;

    let bucketMatched = false;
    for (const bucket of LATENCY_BUCKETS_MS) {
      if (durationMs <= bucket) {
        record.latencyBuckets[`le_${bucket}`] += 1;
        bucketMatched = true;
        break;
      }
    }

    if (!bucketMatched) {
      record.latencyBuckets.le_inf += 1;
    }
  }

  function snapshot() {
    const generatedAt = new Date().toISOString();
    const routes = [...byRoute.values()].map((record) => {
      const avgLatencyMs = record.requests > 0 ? Number((record.totalLatencyMs / record.requests).toFixed(2)) : 0;
      const throughputPerSecond = Number((record.requests / 60).toFixed(4));
      const errorRate = record.requests > 0 ? Number((record.errors / record.requests).toFixed(4)) : 0;

      return {
        route: record.route,
        requests: record.requests,
        errors: record.errors,
        errorRate,
        throughputPerSecond,
        avgLatencyMs,
        maxLatencyMs: Number(record.maxLatencyMs.toFixed(2)),
        statusCounts: record.statusCounts,
        latencyBuckets: record.latencyBuckets
      };
    });

    return { generatedAt, routes };
  }

  return {
    record,
    snapshot,
    nowMs
  };
}
