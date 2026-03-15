import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PERFORMANCE_BUDGET = {
  maxSingleAssetKb: 170,
  maxTotalJsKb: 350
};

export function collectJsAssets(dir) {
  try {
    return readdirSync(dir)
      .map((file) => join(dir, file))
      .filter((file) => file.endsWith('.js'))
      .map((file) => ({ file, size: statSync(file).size }));
  } catch {
    return [];
  }
}

export function evaluatePerformanceBudget(assets) {
  const totalKb = Number((assets.reduce((acc, asset) => acc + asset.size, 0) / 1024).toFixed(2));
  const largest = [...assets].sort((a, b) => b.size - a.size)[0];
  const largestKb = largest ? Number((largest.size / 1024).toFixed(2)) : 0;

  const violations = [];
  if (largestKb > PERFORMANCE_BUDGET.maxSingleAssetKb) {
    violations.push(
      `Maior asset JS (${largestKb}KB) excedeu limite de ${PERFORMANCE_BUDGET.maxSingleAssetKb}KB.`
    );
  }
  if (totalKb > PERFORMANCE_BUDGET.maxTotalJsKb) {
    violations.push(`Total JS (${totalKb}KB) excedeu limite de ${PERFORMANCE_BUDGET.maxTotalJsKb}KB.`);
  }

  return {
    budget: PERFORMANCE_BUDGET,
    totalKb,
    largestAssetKb: largestKb,
    status: violations.length ? 'fail' : 'pass',
    violations
  };
}

export function runBuild(cwd = process.cwd()) {
  mkdirSync(join(cwd, 'dist'), { recursive: true });

  const routeManifest = {
    generatedAt: new Date().toISOString(),
    note: 'Manifesto de rotas gerado pelo build system do Nextify.'
  };
  writeFileSync(join(cwd, 'dist/route-manifest.json'), JSON.stringify(routeManifest, null, 2));

  const assets = collectJsAssets(join(cwd, 'dist'));
  const performanceBudget = evaluatePerformanceBudget(assets);
  writeFileSync(join(cwd, 'dist/performance-budget.json'), JSON.stringify(performanceBudget, null, 2));

  console.log('Build concluído. Artefatos em dist/.');
  console.log(`Performance budget: ${performanceBudget.status.toUpperCase()}.`);

  if (performanceBudget.status === 'fail') {
    throw new Error(`Build bloqueado por regressão crítica de performance: ${performanceBudget.violations.join(' ')}`);
  }

  return performanceBudget;
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  runBuild();
}
