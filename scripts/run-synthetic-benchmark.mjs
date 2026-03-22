import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cwd = process.cwd();
const thresholdsPath = join(cwd, 'artifacts', 'benchmarks', 'thresholds.synthetic.v1.json');
const outputPath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.latest.json');

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const safeRank = Math.min(Math.max(rank, 0), sorted.length - 1);
  return sorted[safeRank];
}

function createScenarioSamples(baseMs, varianceMs, runs, skew = 1) {
  const samples = [];

  for (let i = 0; i < runs; i += 1) {
    const wave = Math.sin((i / runs) * Math.PI * 3) * varianceMs;
    const tailFactor = (i % 10 === 0 ? varianceMs * skew : 0) + (i % 17 === 0 ? varianceMs * 0.4 : 0);
    const sample = Math.max(1, Math.round(baseMs + wave + tailFactor));
    samples.push(sample);
  }

  return samples;
}

function getSyntheticDataset() {
  return {
    ssr_reference: createScenarioSamples(170, 28, 200, 1.6),
    api_health: createScenarioSamples(68, 14, 200, 1.2),
    build_validation: createScenarioSamples(240000, 25000, 120, 1.15),
  };
}

function evaluateScenario(scenario, samples) {
  const measuredP50 = percentile(samples, 50);
  const measuredP95 = percentile(samples, 95);

  const violations = [];
  if (measuredP50 > scenario.thresholdsMs.p50) {
    violations.push(`p50 ${measuredP50}ms > ${scenario.thresholdsMs.p50}ms`);
  }
  if (measuredP95 > scenario.thresholdsMs.p95) {
    violations.push(`p95 ${measuredP95}ms > ${scenario.thresholdsMs.p95}ms`);
  }

  return {
    name: scenario.name,
    sampleCount: samples.length,
    measuredMs: {
      p50: measuredP50,
      p95: measuredP95,
    },
    thresholdsMs: scenario.thresholdsMs,
    status: violations.length === 0 ? 'pass' : 'fail',
    violations,
  };
}

function main() {
  const thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf8'));
  const dataset = getSyntheticDataset();

  const scenarios = thresholds.scenarios.map((scenario) => {
    const samples = dataset[scenario.name];
    if (!samples) {
      return {
        name: scenario.name,
        sampleCount: 0,
        measuredMs: { p50: 0, p95: 0 },
        thresholdsMs: scenario.thresholdsMs,
        status: 'fail',
        violations: ['dataset não definido para o cenário'],
      };
    }

    return evaluateScenario(scenario, samples);
  });

  const failures = scenarios.filter((scenario) => scenario.status === 'fail');
  const report = {
    benchmark: 'synthetic-latency',
    thresholdVersion: thresholds.version,
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? 'pass' : 'fail',
    scenarios,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  for (const scenario of scenarios) {
    const emoji = scenario.status === 'pass' ? '✅' : '❌';
    console.log(
      `${emoji} ${scenario.name}: p50=${scenario.measuredMs.p50}ms (<=${scenario.thresholdsMs.p50}) | p95=${scenario.measuredMs.p95}ms (<=${scenario.thresholdsMs.p95})`,
    );
  }

  if (failures.length > 0) {
    console.error(`\nSynthetic benchmark falhou em ${failures.length} cenário(s).`);
    process.exit(1);
  }

  console.log(`\nSynthetic benchmark aprovado. Relatório: ${outputPath}`);
}

main();
