import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function collectJsAssets(dir) {
  try {
    return readdirSync(dir)
      .map((file) => join(dir, file))
      .filter((file) => file.endsWith('.js'))
      .map((file) => ({ file, size: statSync(file).size }));
  } catch {
    return [];
  }
}

function evaluatePerformanceBudget(assets) {
  const budget = {
    maxSingleAssetKb: 170,
    maxTotalJsKb: 350
  };

  const totalKb = Number((assets.reduce((acc, asset) => acc + asset.size, 0) / 1024).toFixed(2));
  const largest = assets.sort((a, b) => b.size - a.size)[0];
  const largestKb = largest ? Number((largest.size / 1024).toFixed(2)) : 0;

  const violations = [];
  if (largestKb > budget.maxSingleAssetKb) {
    violations.push(`Maior asset JS (${largestKb}KB) excedeu limite de ${budget.maxSingleAssetKb}KB.`);
  }
  if (totalKb > budget.maxTotalJsKb) {
    violations.push(`Total JS (${totalKb}KB) excedeu limite de ${budget.maxTotalJsKb}KB.`);
  }

  return {
    budget,
    totalKb,
    largestAssetKb: largestKb,
    status: violations.length ? 'fail' : 'pass',
    violations
  };
}

mkdirSync('dist', { recursive: true });

const routeManifest = {
  generatedAt: new Date().toISOString(),
  note: 'Manifesto de rotas gerado pelo build system do Nextify.'
};
writeFileSync('dist/route-manifest.json', JSON.stringify(routeManifest, null, 2));

const assets = collectJsAssets(join(process.cwd(), 'dist'));
const performanceBudget = evaluatePerformanceBudget(assets);
writeFileSync('dist/performance-budget.json', JSON.stringify(performanceBudget, null, 2));

console.log('Build concluído. Artefatos em dist/.');
console.log(`Performance budget: ${performanceBudget.status.toUpperCase()}.`);
