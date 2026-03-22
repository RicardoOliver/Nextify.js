import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cwd = process.cwd();
const latestSyntheticPath = join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.latest.json');
const outputPath = join(cwd, 'artifacts', 'benchmarks', 'comparative-benchmark.latest.json');

const openMethodology = {
  environment: {
    node: process.version,
    os: process.platform,
    arch: process.arch,
  },
  reproducibility: {
    prerequisites: ['npm ci'],
    commands: ['npm run benchmark:synthetic', 'npm run benchmark:comparative'],
    notes: [
      'O comparativo usa baseline público versionado em artifacts/benchmarks/synthetic-benchmark.baseline.v1.json.',
      'A metodologia, hipóteses e limitações estão documentadas em docs/OPEN_BENCHMARK_METHODOLOGY.md.',
    ],
  },
};

if (!existsSync(latestSyntheticPath)) {
  console.error(`Benchmark sintético não encontrado: ${latestSyntheticPath}`);
  console.error('Execute antes: npm run benchmark:synthetic');
  process.exit(1);
}

const latest = JSON.parse(readFileSync(latestSyntheticPath, 'utf8'));
const baseline = JSON.parse(
  readFileSync(join(cwd, 'artifacts', 'benchmarks', 'synthetic-benchmark.baseline.v1.json'), 'utf8'),
);

const baselineByName = new Map(baseline.scenarios.map((scenario) => [scenario.name, scenario]));

const scenarios = latest.scenarios.map((scenario) => {
  const reference = baselineByName.get(scenario.name);
  if (!reference) {
    return {
      name: scenario.name,
      status: 'insufficient-baseline',
      message: 'Cenário sem baseline público correspondente.',
    };
  }

  const p50DeltaPct = ((scenario.measuredMs.p50 - reference.measuredMs.p50) / reference.measuredMs.p50) * 100;
  const p95DeltaPct = ((scenario.measuredMs.p95 - reference.measuredMs.p95) / reference.measuredMs.p95) * 100;

  return {
    name: scenario.name,
    latestMs: scenario.measuredMs,
    baselineMs: reference.measuredMs,
    deltaPct: {
      p50: Number(p50DeltaPct.toFixed(2)),
      p95: Number(p95DeltaPct.toFixed(2)),
    },
    interpretation:
      p95DeltaPct <= 0
        ? 'Nextify manteve ou melhorou p95 contra baseline.'
        : 'Nextify regrediu em p95; revisar otimizações antes de promover release.',
  };
});

const report = {
  benchmark: 'comparative-open-methodology-v1',
  generatedAt: new Date().toISOString(),
  baselineVersion: baseline.thresholdVersion ?? baseline.version ?? 'synthetic-baseline-v1',
  sourceReports: {
    latest: 'artifacts/benchmarks/synthetic-benchmark.latest.json',
    baseline: 'artifacts/benchmarks/synthetic-benchmark.baseline.v1.json',
  },
  methodology: openMethodology,
  scenarios,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Benchmark comparativo publicado em: ${outputPath}`);
