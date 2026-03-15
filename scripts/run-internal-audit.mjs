import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'docs/INCIDENT_RESPONSE_RUNBOOK.md',
  'docs/SBOM_DEPENDENCY_TRACEABILITY.md',
  'docs/RFC_BREAKING_CHANGES_PROCESS.md',
  'docs/templates/RFC_TEMPLATE.md',
  'artifacts/sbom/sbom-npm.json',
  'artifacts/sbom/traceability.json',
];

const missing = requiredFiles.filter((file) => !existsSync(join(process.cwd(), file)));

if (missing.length > 0) {
  console.error('Auditoria falhou. Arquivos obrigatórios ausentes:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const sbomPath = join(process.cwd(), 'artifacts', 'sbom', 'sbom-npm.json');
const stats = statSync(sbomPath);
console.log('Auditoria interna básica concluída com sucesso.');
console.log(`SBOM encontrado e atualizado em: ${stats.mtime.toISOString()}`);
