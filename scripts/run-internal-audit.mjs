import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();

const requiredFiles = [
  'docs/INCIDENT_RESPONSE_RUNBOOK.md',
  'docs/SBOM_DEPENDENCY_TRACEABILITY.md',
  'docs/RFC_BREAKING_CHANGES_PROCESS.md',
  'docs/templates/RFC_TEMPLATE.md',
  'artifacts/sbom/sbom-npm.json',
  'artifacts/sbom/traceability.json',
  'docs/ROADMAP.md',
  'docs/SECURITY_RUNTIME_CHECKLIST.md',
  'docs/SLOS_AND_PERFORMANCE_BUDGET.md',
];

const WEIGHTS = {
  governance: 25,
  security: 20,
  reliability: 20,
  engineering: 20,
  release: 15,
};

function scoreToLevel(score) {
  if (score >= 90) return 'elite';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'developing';
  return 'critical';
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function countFiles(path, extension) {
  if (!existsSync(path)) return 0;
  const entries = readdirSync(path, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath, extension);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      count += 1;
    }
  }

  return count;
}

function addResult(results, id, pass, maxPoints, message, category) {
  results.push({ id, pass, maxPoints, points: pass ? maxPoints : 0, message, category });
}

const missing = requiredFiles.filter((file) => !existsSync(join(cwd, file)));
if (missing.length > 0) {
  console.error('Auditoria avançada falhou. Arquivos obrigatórios ausentes:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const results = [];

const sbomPath = join(cwd, 'artifacts', 'sbom', 'sbom-npm.json');
const traceabilityPath = join(cwd, 'artifacts', 'sbom', 'traceability.json');
const sbomStats = statSync(sbomPath);
const traceabilityStats = statSync(traceabilityPath);
const now = Date.now();
const dayMs = 1000 * 60 * 60 * 24;

addResult(
  results,
  'sbom_freshness',
  now - sbomStats.mtimeMs <= dayMs * 45,
  10,
  `SBOM atualizado em ${sbomStats.mtime.toISOString()}`,
  'security',
);

addResult(
  results,
  'traceability_freshness',
  now - traceabilityStats.mtimeMs <= dayMs * 45,
  10,
  `Matriz de rastreabilidade atualizada em ${traceabilityStats.mtime.toISOString()}`,
  'security',
);

const pkgJson = readJson(join(cwd, 'package.json'));
const rootVersion = pkgJson.version;
const workspaceDirs = readdirSync(join(cwd, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

let versionDrift = 0;
for (const dir of workspaceDirs) {
  const packagePath = join(cwd, 'packages', dir, 'package.json');
  if (!existsSync(packagePath)) continue;
  const workspacePkg = readJson(packagePath);
  if (workspacePkg.version && workspacePkg.version !== rootVersion) {
    versionDrift += 1;
  }
}

addResult(
  results,
  'workspace_version_alignment',
  versionDrift === 0,
  8,
  versionDrift === 0
    ? 'Todas as versões de workspaces estão alinhadas.'
    : `${versionDrift} workspace(s) com versão desalinhada em relação ao root (${rootVersion}).`,
  'release',
);

const coreTests = countFiles(join(cwd, 'packages', 'core', 'tests'), '.ts');
const coreSrc = countFiles(join(cwd, 'packages', 'core', 'src'), '.ts');
const testCoverageRatio = coreSrc === 0 ? 0 : coreTests / coreSrc;

addResult(
  results,
  'test_density',
  testCoverageRatio >= 0.45,
  15,
  `Densidade aproximada de testes: ${(testCoverageRatio * 100).toFixed(1)}% (${coreTests} testes / ${coreSrc} arquivos TS).`,
  'engineering',
);

const docsReportDir = join(cwd, 'docs', 'reliability-reports');
const monthlyReports = existsSync(docsReportDir)
  ? readdirSync(docsReportDir).filter((file) => /^\d{4}-\d{2}\.md$/.test(file)).sort()
  : [];

addResult(
  results,
  'reliability_report_presence',
  monthlyReports.length >= 1,
  10,
  monthlyReports.length >= 1
    ? `Último report de confiabilidade encontrado: ${monthlyReports.at(-1)}.`
    : 'Nenhum report mensal de confiabilidade encontrado.',
  'reliability',
);

const roadmapContent = readFileSync(join(cwd, 'docs', 'ROADMAP.md'), 'utf8');
addResult(
  results,
  'roadmap_current_year',
  roadmapContent.includes('2026') || roadmapContent.includes('2027'),
  8,
  'Roadmap validado para horizonte 2026+.',
  'governance',
);

const securityChecklist = readFileSync(join(cwd, 'docs', 'SECURITY_RUNTIME_CHECKLIST.md'), 'utf8');
addResult(
  results,
  'security_checklist_depth',
  securityChecklist.split('\n').filter((line) => line.trim().startsWith('- [')).length >= 10,
  10,
  'Checklist de segurança contém ao menos 10 itens acionáveis.',
  'security',
);

const perfBudget = readJson(join(cwd, 'packages', 'build', 'dist', 'performance-budget.json'));
const totalBudgetChecks = Object.keys(perfBudget).length;
addResult(
  results,
  'performance_budget_defined',
  totalBudgetChecks >= 3,
  10,
  `Performance budget com ${totalBudgetChecks} categoria(s) definida(s).`,
  'reliability',
);

const ciWorkflow = readFileSync(join(cwd, '.github', 'workflows', 'ci.yml'), 'utf8');
addResult(
  results,
  'ci_quality_gates',
  ciWorkflow.includes('lint') && ciWorkflow.includes('test') && ciWorkflow.includes('typecheck'),
  12,
  'CI possui gates de lint, test e typecheck.',
  'engineering',
);

const changelog = readFileSync(join(cwd, 'CHANGELOG.md'), 'utf8');
addResult(
  results,
  'changelog_semver_signal',
  /## \[0\.1\.\d+\]/.test(changelog),
  7,
  'CHANGELOG indica trilha de releases semânticas na série 0.1.x.',
  'release',
);

const totalScore = results.reduce((sum, item) => sum + item.points, 0);
const maxScore = results.reduce((sum, item) => sum + item.maxPoints, 0);
const scorePct = (totalScore / maxScore) * 100;
const level = scoreToLevel(scorePct);

const categoryTotals = Object.fromEntries(
  Object.keys(WEIGHTS).map((category) => [category, { got: 0, max: 0 }]),
);

for (const item of results) {
  if (!categoryTotals[item.category]) {
    categoryTotals[item.category] = { got: 0, max: 0 };
  }
  categoryTotals[item.category].got += item.points;
  categoryTotals[item.category].max += item.maxPoints;
}

const lines = [
  '# Internal Audit Report',
  '',
  `- Generated at: ${new Date().toISOString()}`,
  `- Score: **${scorePct.toFixed(1)}%** (${totalScore}/${maxScore})`,
  `- Maturity: **${level.toUpperCase()}**`,
  '',
  '## Category Breakdown',
  '',
  ...Object.entries(categoryTotals).map(([category, value]) => {
    const pct = value.max === 0 ? 0 : (value.got / value.max) * 100;
    return `- ${category}: ${pct.toFixed(1)}% (${value.got}/${value.max})`;
  }),
  '',
  '## Detailed Checks',
  '',
  ...results.map((item) => `- [${item.pass ? 'x' : ' '}] **${item.id}** (${item.points}/${item.maxPoints}) — ${item.message}`),
  '',
  '## Priority Improvements',
  '',
  '- Eliminar drift de versão nos workspaces com release automation por changesets.',
  '- Incluir validação automática de SLO no CI (ex.: limiar de latency p95 em integração).',
  '- Adicionar assinatura criptográfica do SBOM para supply-chain hardening.',
];

const reportPath = join(cwd, 'docs', 'reliability-reports', 'latest-internal-audit.md');
writeFileSync(reportPath, lines.join('\n'));

console.log('Auditoria interna avançada concluída com sucesso.');
console.log(`Pontuação geral: ${scorePct.toFixed(1)}% (${totalScore}/${maxScore})`);
console.log(`Nível de maturidade: ${level.toUpperCase()}`);
console.log(`Relatório salvo em: ${reportPath}`);
