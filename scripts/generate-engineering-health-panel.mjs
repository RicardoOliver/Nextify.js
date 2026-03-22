import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseAuditScore(markdown) {
  const scoreMatch = markdown.match(/Score:\s*\*\*(\d+(?:\.\d+)?)%\*\*/i);
  const maturityMatch = markdown.match(/Maturity:\s*\*\*([A-Z]+)\*\*/i);

  return {
    scorePct: scoreMatch ? Number(scoreMatch[1]) : null,
    maturity: maturityMatch ? maturityMatch[1] : 'UNKNOWN',
  };
}

const benchmarkPath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.latest.json');
const baselinePath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.baseline.v1.json');
const traceabilityPath = join(cwd, 'artifacts', 'sbom', 'traceability.json');
const performanceBudgetPath = join(cwd, 'packages', 'build', 'dist', 'performance-budget.json');
const auditPath = join(cwd, 'docs', 'reliability-reports', 'latest-internal-audit.md');

const missing = [benchmarkPath, baselinePath, traceabilityPath, performanceBudgetPath, auditPath].filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error('Não foi possível gerar engineering health panel. Arquivos ausentes:');
  for (const path of missing) console.error(`- ${path}`);
  process.exit(1);
}

const benchmark = readJson(benchmarkPath);
const baseline = readJson(baselinePath);
const traceability = readJson(traceabilityPath);
const performanceBudget = readJson(performanceBudgetPath);
const audit = parseAuditScore(readFileSync(auditPath, 'utf8'));

const baselineByScenario = new Map(baseline.scenarios.map((scenario) => [scenario.name, scenario]));
const scenarioRows = benchmark.scenarios.map((scenario) => {
  const reference = baselineByScenario.get(scenario.name);

  const deltaP50 = reference ? ((scenario.measuredMs.p50 - reference.measuredMs.p50) / reference.measuredMs.p50) * 100 : null;
  const deltaP95 = reference ? ((scenario.measuredMs.p95 - reference.measuredMs.p95) / reference.measuredMs.p95) * 100 : null;

  return {
    name: scenario.name,
    status: scenario.status,
    measuredMs: scenario.measuredMs,
    thresholdsMs: scenario.thresholdsMs,
    regressionDeltaPct: {
      p50: deltaP50,
      p95: deltaP95,
    },
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  sources: {
    benchmarkPath,
    baselinePath,
    traceabilityPath,
    performanceBudgetPath,
    auditPath,
  },
  summary: {
    syntheticBenchmarkStatus: benchmark.status,
    scenariosFailing: scenarioRows.filter((row) => row.status === 'fail').map((row) => row.name),
    internalAuditScorePct: audit.scorePct,
    internalAuditMaturity: audit.maturity,
    sbomTraceabilityVersion: traceability.version ?? 'unknown',
    performanceBudgetCategories: Object.keys(performanceBudget).length,
  },
  scenarios: scenarioRows,
};

const outputDir = join(cwd, 'artifacts', 'health');
mkdirSync(outputDir, { recursive: true });

const jsonPath = join(outputDir, 'engineering-health-panel.json');
const mdPath = join(outputDir, 'engineering-health-panel.md');

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

const scenarioTable = scenarioRows
  .map((scenario) => {
    const p50Delta = scenario.regressionDeltaPct.p50;
    const p95Delta = scenario.regressionDeltaPct.p95;
    const formatDelta = (value) => (value === null ? 'n/a' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`);

    return `| ${scenario.name} | ${scenario.status === 'pass' ? '✅' : '❌'} | ${scenario.measuredMs.p50} / ${scenario.measuredMs.p95} | ${scenario.thresholdsMs.p50} / ${scenario.thresholdsMs.p95} | ${formatDelta(p50Delta)} / ${formatDelta(p95Delta)} |`;
  })
  .join('\n');

const markdown = `# Engineering Health Panel\n\n- Generated at: ${payload.generatedAt}\n- Internal Audit: ${audit.scorePct ?? 'n/a'}% (${audit.maturity})\n- Synthetic Benchmark: ${benchmark.status === 'pass' ? '✅ pass' : '❌ fail'}\n- SBOM Traceability version: ${payload.summary.sbomTraceabilityVersion}\n- Performance budget categories: ${payload.summary.performanceBudgetCategories}\n\n## Performance Regression\n\n| Scenario | Status | Measured p50/p95 (ms) | Threshold p50/p95 (ms) | Delta vs baseline (p50/p95) |\n| --- | --- | --- | --- | --- |\n${scenarioTable}\n`;

writeFileSync(mdPath, markdown);
console.log(`Engineering health panel gerado em:\n- ${jsonPath}\n- ${mdPath}`);
