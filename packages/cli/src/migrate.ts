import { mkdirSync, writeFileSync, existsSync, cpSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

function discoverMigrationRoots(root: string) {
  const roots = [root];
  const candidates = ['apps', 'packages'];

  for (const candidate of candidates) {
    const candidatePath = join(root, candidate);
    if (!existsSync(candidatePath)) continue;

    for (const entry of readdirSync(candidatePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const appRoot = join(candidatePath, entry.name);
      if (existsSync(join(appRoot, 'pages'))) roots.push(appRoot);
    }
  }

  return [...new Set(roots)];
}

function migrateSingleProject(root: string) {
  const pagesDir = join(root, 'pages');
  const appDir = join(root, 'app');

  if (!existsSync(pagesDir)) {
    return { root, migrated: [], middlewareMigrated: false, skipped: true };
  }

  mkdirSync(appDir, { recursive: true });
  const migrated: string[] = [];
  const queue = [pagesDir];

  while (queue.length) {
    const current = queue.pop() as string;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      const rel = relative(pagesDir, fullPath);
      if (rel.startsWith('api')) {
        const target = join(appDir, rel.replace(/^api\//, 'api/'));
        mkdirSync(join(target, '..'), { recursive: true });
        cpSync(fullPath, target);
        migrated.push(`api/${rel}`);
        continue;
      }

      if (/\.(tsx|jsx|ts|js)$/.test(entry.name)) {
        const routeFolder = join(appDir, rel.replace(/\.[^.]+$/, ''));
        mkdirSync(routeFolder, { recursive: true });
        const source = readFileSync(fullPath, 'utf8');
        const transformed = source.includes('export default') ? source : `${source}\nexport default function Page(){return null}`;
        writeFileSync(join(routeFolder, 'page.tsx'), transformed, 'utf8');
        migrated.push(rel);
      }
    }
  }

  const middlewareFile = ['middleware.ts', 'middleware.js'].find((file) => existsSync(join(root, file)));
  let middlewareMigrated = false;
  if (middlewareFile) {
    cpSync(join(root, middlewareFile), join(appDir, middlewareFile));
    middlewareMigrated = true;
  }

  return {
    root,
    migrated,
    middlewareMigrated,
    skipped: false
  };
}

export function migrateNextProject(root = process.cwd()) {
  const projects = discoverMigrationRoots(root).map((projectRoot) => migrateSingleProject(projectRoot));
  const migratedTotal = projects.reduce((acc, project) => acc + project.migrated.length, 0);

  if (migratedTotal === 0) {
    console.error('Nenhuma pasta pages/ encontrada para migração.');
    process.exit(1);
  }

  const migrationConfigPath = join(root, 'nextify.migration.json');
  writeFileSync(
    migrationConfigPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        strategy: 'progressive-compat',
        monorepo: existsSync(join(root, 'apps')) || existsSync(join(root, 'packages')),
        projects: projects.map((project) => ({
          root: relative(root, project.root) || '.',
          migrated: project.migrated,
          middlewareMigrated: project.middlewareMigrated,
          skipped: project.skipped
        })),
        notes: [
          'Middlewares migrados para app/middleware.* quando presentes.',
          'Revisar páginas dinâmicas e middlewares personalizados após migração automática.'
        ]
      },
      null,
      2
    )
  );

  const migratedProjects = projects.filter((project) => !project.skipped).length;
  console.log(`Migração concluída. ${migratedTotal} arquivos convertidos em ${migratedProjects} projeto(s).`);
  console.log(`Arquivo de compatibilidade: ${migrationConfigPath}`);
}
