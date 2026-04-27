import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

function walk(dir, matcher, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;

    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, matcher, acc);
      continue;
    }

    if (matcher(absolute)) acc.push(absolute);
  }

  return acc;
}

function countByPattern(files, pattern) {
  return files.filter((file) => pattern.test(file)).length;
}

const testFiles = walk(join(root, 'packages'), (file) => /\.test\.(t|j)sx?$/.test(file));
const testFilesByType = {
  unit: testFiles.length - countByPattern(testFiles, /\.integration\.test\./) - countByPattern(testFiles, /\.e2e\.test\./),
  integration: countByPattern(testFiles, /\.integration\.test\./),
  e2e: countByPattern(testFiles, /\.e2e\.test\./),
};

const ciWorkflow = readFileSync(join(root, '.github', 'workflows', 'ci.yml'), 'utf8');

const qualityGates = {
  lint: /- name: Lint/m.test(ciWorkflow),
  typecheck: /- name: Typecheck/m.test(ciWorkflow),
  tests: /- name: Test/m.test(ciWorkflow),
  npmAudit: /npm audit --omit=dev --audit-level=high/m.test(ciWorkflow),
  internalAudit: /- name: Generate internal audit report/m.test(ciWorkflow),
  sbomProvenance: /- name: Enforce provenance policy/m.test(ciWorkflow),
};

const payload = {
  generatedAt: new Date().toISOString(),
  narrative: {
    positioning: 'IA com engenharia de verdade',
    statement:
      'A IA acelera a entrega, mas cada mudança relevante só entra após quality gates objetivos e revisão humana.',
  },
  metrics: {
    tests: {
      totalFiles: testFiles.length,
      unitFiles: testFilesByType.unit,
      integrationFiles: testFilesByType.integration,
      e2eFiles: testFilesByType.e2e,
      sample: testFiles.slice(0, 10).map((file) => relative(root, file)),
    },
    qualityGates,
  },
  evidence: {
    ciWorkflow: '.github/workflows/ci.yml',
    testDirectory: 'packages/**/tests',
    engineeringHealthPanel: 'artifacts/health/engineering-health-panel.json',
  },
};

const outputDir = join(root, 'artifacts', 'health');
mkdirSync(outputDir, { recursive: true });

const jsonPath = join(outputDir, 'ai-quality-metrics.json');
const mdPath = join(outputDir, 'ai-quality-metrics.md');

const gateIcon = (value) => (value ? '✅' : '❌');

const markdown = `# IA com Engenharia de Verdade\n\n- Generated at: ${payload.generatedAt}\n- Posicionamento: ${payload.narrative.positioning}\n- Mensagem: ${payload.narrative.statement}\n\n## Métricas objetivas\n\n- Test files totais: ${payload.metrics.tests.totalFiles}\n- Unit: ${payload.metrics.tests.unitFiles}\n- Integração: ${payload.metrics.tests.integrationFiles}\n- E2E: ${payload.metrics.tests.e2eFiles}\n\n## Quality gates no CI\n\n| Gate | Ativo no CI |
| --- | --- |
| Lint | ${gateIcon(payload.metrics.qualityGates.lint)} |
| Typecheck | ${gateIcon(payload.metrics.qualityGates.typecheck)} |
| Testes | ${gateIcon(payload.metrics.qualityGates.tests)} |
| Audit de dependências | ${gateIcon(payload.metrics.qualityGates.npmAudit)} |
| Audit interno | ${gateIcon(payload.metrics.qualityGates.internalAudit)} |
| Provenance/SBOM | ${gateIcon(payload.metrics.qualityGates.sbomProvenance)} |
\n## Evidências\n\n- Workflow: \`${payload.evidence.ciWorkflow}\`\n- Cobertura de testes (arquivos): \`${payload.evidence.testDirectory}\`\n- Health panel consolidado: \`${payload.evidence.engineeringHealthPanel}\`\n`;

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(mdPath, markdown);

console.log(`AI quality metrics geradas em:\n- ${jsonPath}\n- ${mdPath}`);
