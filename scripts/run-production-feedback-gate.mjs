import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const trafficPath = join(cwd, 'artifacts', 'observability', 'production-traffic.latest.json');
const thresholdsPath = join(cwd, 'artifacts', 'observability', 'production-thresholds.v1.json');
const outputPath = join(cwd, 'artifacts', 'observability', 'production-feedback-report.latest.json');

if (!existsSync(trafficPath) || !existsSync(thresholdsPath)) {
  console.error('Dados de produção ausentes para o feedback loop.');
  console.error(`- traffic: ${trafficPath}`);
  console.error(`- thresholds: ${thresholdsPath}`);
  process.exit(1);
}

const traffic = readJson(trafficPath);
const thresholds = readJson(thresholdsPath);

const thresholdByRoute = new Map(thresholds.routes.map((route) => [route.routeId, route]));
const checks = [];

for (const route of traffic.routes) {
  const routeThreshold = thresholdByRoute.get(route.routeId);

  if (!routeThreshold) {
    checks.push({
      routeId: route.routeId,
      status: 'fail',
      reason: 'threshold-not-found',
    });
    continue;
  }

  const ttfbOk = route.metrics.ttfbP95Ms <= routeThreshold.maxTtfbP95Ms;
  const latencyOk = route.metrics.latencyP95Ms <= routeThreshold.maxLatencyP95Ms;
  const errorOk = route.metrics.errorRatePct <= routeThreshold.maxErrorRatePct;

  checks.push({
    routeId: route.routeId,
    trafficWindow: route.trafficWindow,
    requestCount: route.requestCount,
    measured: route.metrics,
    thresholds: {
      maxTtfbP95Ms: routeThreshold.maxTtfbP95Ms,
      maxLatencyP95Ms: routeThreshold.maxLatencyP95Ms,
      maxErrorRatePct: routeThreshold.maxErrorRatePct,
    },
    status: ttfbOk && latencyOk && errorOk ? 'pass' : 'fail',
    reasons: [
      !ttfbOk ? `ttfbP95Ms ${route.metrics.ttfbP95Ms} > ${routeThreshold.maxTtfbP95Ms}` : null,
      !latencyOk ? `latencyP95Ms ${route.metrics.latencyP95Ms} > ${routeThreshold.maxLatencyP95Ms}` : null,
      !errorOk ? `errorRatePct ${route.metrics.errorRatePct} > ${routeThreshold.maxErrorRatePct}` : null,
    ].filter(Boolean),
  });
}

const failures = checks.filter((check) => check.status === 'fail');
const report = {
  generatedAt: new Date().toISOString(),
  source: {
    trafficPath,
    thresholdsPath,
  },
  status: failures.length === 0 ? 'pass' : 'fail',
  summary: {
    totalRoutes: checks.length,
    routesFailing: failures.length,
  },
  checks,
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  console.error('Feedback loop de produção falhou: regressões detectadas em tráfego real.');
  for (const failure of failures) {
    const reasons = failure.reasons?.join('; ') ?? failure.reason;
    console.error(`- ${failure.routeId}: ${reasons}`);
  }
  process.exit(1);
}

console.log(`Feedback loop de produção aprovado. Relatório: ${outputPath}`);
