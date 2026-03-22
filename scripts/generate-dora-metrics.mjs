import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function hoursBetween(startIso, endIso) {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60);
}

const eventsPath = join(cwd, 'artifacts', 'dora', 'events.latest.json');
const targetsPath = join(cwd, 'artifacts', 'dora', 'targets.v1.json');
const outputPath = join(cwd, 'artifacts', 'dora', 'metrics.latest.json');
const mdPath = join(cwd, 'artifacts', 'dora', 'metrics.latest.md');

if (!existsSync(eventsPath) || !existsSync(targetsPath)) {
  console.error('Arquivos DORA obrigatórios ausentes.');
  console.error(`- events: ${eventsPath}`);
  console.error(`- targets: ${targetsPath}`);
  process.exit(1);
}

const events = readJson(eventsPath);
const targets = readJson(targetsPath);

if (!Array.isArray(events.deployments) || events.deployments.length === 0) {
  console.error('Nenhum deployment encontrado em artifacts/dora/events.latest.json');
  process.exit(1);
}

const successfulDeployments = events.deployments.filter((deployment) => deployment.status === 'success');
const failedDeployments = events.deployments.filter((deployment) => deployment.status === 'failed');

const leadTimes = successfulDeployments
  .map((deployment) => hoursBetween(deployment.commitCreatedAt, deployment.deployedAt))
  .filter((hours) => Number.isFinite(hours) && hours >= 0);

const mttrs = failedDeployments
  .map((deployment) => (deployment.recoveredAt ? hoursBetween(deployment.failedAt, deployment.recoveredAt) : null))
  .filter((hours) => Number.isFinite(hours) && hours >= 0);

const avg = (values) => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const median = (values) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const metrics = {
  generatedAt: new Date().toISOString(),
  period: events.period,
  source: {
    eventsPath,
    targetsPath,
  },
  values: {
    deploymentsTotal: events.deployments.length,
    deploymentsSuccessful: successfulDeployments.length,
    leadTimeHoursMedian: median(leadTimes),
    changeFailRatePct: events.deployments.length === 0 ? null : (failedDeployments.length / events.deployments.length) * 100,
    mttrHoursAverage: avg(mttrs),
  },
};

const gates = {
  leadTime: metrics.values.leadTimeHoursMedian !== null && metrics.values.leadTimeHoursMedian <= targets.maxLeadTimeHoursMedian,
  changeFailRate:
    metrics.values.changeFailRatePct !== null && metrics.values.changeFailRatePct <= targets.maxChangeFailRatePct,
  mttr: metrics.values.mttrHoursAverage !== null && metrics.values.mttrHoursAverage <= targets.maxMttrHoursAverage,
};

metrics.status = Object.values(gates).every(Boolean) ? 'pass' : 'fail';
metrics.targets = targets;
metrics.gates = gates;

mkdirSync(join(cwd, 'artifacts', 'dora'), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(metrics, null, 2)}\n`);

const fmt = (value, digits = 2) => (value === null ? 'n/a' : value.toFixed(digits));
const markdown = `# DORA Metrics\n\n- Generated at: ${metrics.generatedAt}\n- Period: ${events.period.from} → ${events.period.to}\n- Status: ${metrics.status === 'pass' ? '✅ pass' : '❌ fail'}\n\n| Metric | Value | Target | Gate |\n| --- | ---: | ---: | --- |\n| Lead time (median, h) | ${fmt(metrics.values.leadTimeHoursMedian)} | <= ${targets.maxLeadTimeHoursMedian.toFixed(2)} | ${gates.leadTime ? '✅' : '❌'} |\n| Change fail rate (%) | ${fmt(metrics.values.changeFailRatePct)} | <= ${targets.maxChangeFailRatePct.toFixed(2)} | ${gates.changeFailRate ? '✅' : '❌'} |\n| MTTR (avg, h) | ${fmt(metrics.values.mttrHoursAverage)} | <= ${targets.maxMttrHoursAverage.toFixed(2)} | ${gates.mttr ? '✅' : '❌'} |\n`;

writeFileSync(mdPath, markdown);

if (metrics.status === 'fail') {
  console.error('Gate DORA falhou.');
  console.error(`Relatórios: ${outputPath} / ${mdPath}`);
  process.exit(1);
}

console.log(`Métricas DORA calculadas com sucesso:\n- ${outputPath}\n- ${mdPath}`);
