#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const engineConstraint = packageJson?.engines?.node ?? '';
const minVersionMatch = engineConstraint.match(/>=\s*(\d+\.\d+\.\d+)/);
const MIN_NODE_VERSION = minVersionMatch?.[1] ?? '24.14.0';

function parseVersion(version) {
  return version
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10));
}

function compareVersions(a, b) {
  const maxLength = Math.max(a.length, b.length);

  for (let i = 0; i < maxLength; i += 1) {
    const aPart = a[i] ?? 0;
    const bPart = b[i] ?? 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}


const skipCheck = process.env.NEXTIFY_SKIP_NODE_VERSION_CHECK === '1';

if (skipCheck) {
  console.warn('[Nextify] Verificação de versão do Node ignorada (NEXTIFY_SKIP_NODE_VERSION_CHECK=1).');
  process.exit(0);
}

const currentNodeVersion = process.versions.node;
const isCompatible = compareVersions(parseVersion(currentNodeVersion), parseVersion(MIN_NODE_VERSION)) >= 0;

if (!isCompatible) {
  console.error('\n[Nextify] Versão do Node incompatível.');
  console.error(`[Nextify] Detectado: ${currentNodeVersion}`);
  console.error(`[Nextify] Requerido: >= ${MIN_NODE_VERSION}\n`);
  console.error('Atualize seu Node e tente novamente.');
  console.error('Sugestão com nvm:');
  console.error(`  nvm install ${MIN_NODE_VERSION}`);
  console.error(`  nvm use ${MIN_NODE_VERSION}\n`);
  process.exit(1);
}
