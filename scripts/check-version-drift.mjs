import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packagesDir = path.join(rootDir, 'packages');

if (!fs.existsSync(packagesDir)) {
  console.error('Diretório packages/ não encontrado.');
  process.exit(1);
}

const packageDirs = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const packages = packageDirs
  .map((dirName) => {
    const packageJsonPath = path.join(packagesDir, dirName, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    return {
      name: pkg.name ?? dirName,
      version: pkg.version,
      path: path.relative(rootDir, packageJsonPath),
    };
  })
  .filter(Boolean);

if (packages.length === 0) {
  console.error('Nenhum package.json encontrado em packages/.');
  process.exit(1);
}

const versionBuckets = new Map();
for (const pkg of packages) {
  const bucket = versionBuckets.get(pkg.version) ?? [];
  bucket.push(pkg);
  versionBuckets.set(pkg.version, bucket);
}

if (versionBuckets.size > 1) {
  console.error('❌ Version drift detectado entre pacotes do monorepo.');
  console.error('Todos os pacotes em packages/* devem compartilhar a mesma versão.\n');

  for (const [version, pkgs] of [...versionBuckets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(`Versão ${version}:`);
    for (const pkg of pkgs.sort((a, b) => a.name.localeCompare(b.name))) {
      console.error(`  - ${pkg.name} (${pkg.path})`);
    }
  }

  console.error('\nPara corrigir, use o fluxo de changesets (npm run changeset:version).');
  process.exit(1);
}

const [[version, pkgs]] = versionBuckets;
console.log(`✅ Política de versão sincronizada válida: ${version}.`);
console.log(`Pacotes verificados: ${pkgs.length}.`);
