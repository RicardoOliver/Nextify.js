import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const outputDir = join(workspaceRoot, 'artifacts', 'sbom');
const generatedAt = new Date().toISOString();

const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
const lockfilePath = lockfiles.find((file) => existsSync(join(workspaceRoot, file)));

const lockfile = lockfilePath
  ? {
      path: lockfilePath,
      sha256: createHash('sha256')
        .update(readFileSync(join(workspaceRoot, lockfilePath), 'utf8'))
        .digest('hex'),
    }
  : {
      path: null,
      sha256: null,
      note: 'Nenhum lockfile encontrado no repositório durante a geração.',
    };

const dependencyTree = JSON.parse(execSync('npm ls --all --json', { encoding: 'utf8' }));
const prodDependencyTree = JSON.parse(
  execSync('npm ls --omit=dev --all --json', { encoding: 'utf8' }),
);

const sbomDocument = {
  metadata: {
    format: 'nextify-sbom-v1',
    generatedAt,
    generatedBy: 'scripts/generate-sbom.mjs',
    packageManager: 'npm',
    lockfile,
  },
  dependencies: {
    all: dependencyTree,
    production: prodDependencyTree,
  },
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'sbom-npm.json'), JSON.stringify(sbomDocument, null, 2));

const traceabilityReport = {
  generatedAt,
  lockfile,
  attestations: [
    {
      statement: 'SBOM generated from current workspace dependency graph.',
      evidence: ['npm ls --all --json', 'npm ls --omit=dev --all --json'],
    },
  ],
};

writeFileSync(
  join(outputDir, 'traceability.json'),
  JSON.stringify(traceabilityReport, null, 2),
);

console.log('SBOM gerado com sucesso em artifacts/sbom/.');
