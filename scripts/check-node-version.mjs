#!/usr/bin/env node

const MIN_NODE_VERSION = '20.19.0';

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
