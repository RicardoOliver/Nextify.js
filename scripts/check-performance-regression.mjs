import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const latestPath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.latest.json');
const baselinePath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.baseline.v1.json');

const DEFAULT_ALLOWED_REGRESSION_PCT = 8;
const allowedRegressionPct = Number(process.env.NEXTIFY_ALLOWED_REGRESSION_PCT ?? DEFAULT_ALLOWED_REGRESSION_PCT);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

if (!existsSync(latestPath)) {
  console.error(`Relatório de benchmark não encontrado: ${latestPath}`);
  console.error('Execute antes: npm run benchmark:synthetic');
  process.exit(1);
}

if (!existsSync(baselinePath)) {
  console.error(`Baseline de benchmark não encontrado: ${baselinePath}`);
  process.exit(1);
}

const latest = readJson(latestPath);
const baseline = readJson(baselinePath);
const baselineByScenario = new Map(baseline.scenarios.map((scenario) => [scenario.name, scenario]));

const regressions = [];

for (const scenario of latest.scenarios) {
  const baselineScenario = baselineByScenario.get(scenario.name);
  if (!baselineScenario) {
    regressions.push(`${scenario.name}: cenário ausente no baseline`);
    continue;
  }

  for (const metric of ['p50', 'p95']) {
    const current = scenario.measuredMs[metric];
    const reference = baselineScenario.measuredMs[metric];

    if (typeof current !== 'number' || typeof reference !== 'number' || reference <= 0) {
      regressions.push(`${scenario.name}/${metric}: valores inválidos para comparação`);
      continue;
    }

    const delta = (current - reference) / reference;
    const isRegression = delta > allowedRegressionPct / 100;
    const emoji = isRegression ? '❌' : '✅';

    console.log(
      `${emoji} ${scenario.name}/${metric}: atual=${current}ms baseline=${reference}ms delta=${formatPct(delta)} (limite ${allowedRegressionPct}%)`,
    );

    if (isRegression) {
      regressions.push(
        `${scenario.name}/${metric}: regressão de ${formatPct(delta)} acima do limite de ${allowedRegressionPct}%`,
      );
    }
  }
}

if (regressions.length > 0) {
  console.error('\nGate de regressão de performance falhou:');
  for (const entry of regressions) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log('\nGate de regressão de performance aprovado.');
