#!/usr/bin/env node
import http from 'node:http';
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  cpSync,
  readdirSync,
  readFileSync
} from 'node:fs';
import { join, relative } from 'node:path';

function createProject(target = 'nextify-app') {
  const root = join(process.cwd(), target);

  if (existsSync(root)) {
    console.error(`Erro: a pasta "${target}" já existe.`);
    process.exit(1);
  }

  mkdirSync(join(root, 'pages', 'api'), { recursive: true });

  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify(
      {
        name: target,
        private: true,
        type: 'module',
        scripts: {
          dev: 'nextify dev',
          build: 'nextify build',
          start: 'nextify start'
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1'
        },
        devDependencies: {
          'create-nextify': 'latest',
          vite: '^5.4.19',
          '@vitejs/plugin-react': '^4.3.4',
          '@types/react': '^18.3.1',
          '@types/react-dom': '^18.3.1',
          typescript: '^5.0.0'
        }
      },
      null,
      2
    )
  );

  writeFileSync(join(root, 'pages', 'index.tsx'), `export default function Home() { return <main>Nextify</main>; }`);

  writeFileSync(
    join(root, 'pages', 'api', 'health.ts'),
    `export default async function handler() { return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } }); }`
  );

  console.log(`\n✔ Projeto criado em: ${root}`);
}

async function runDevServer(port: number) {
  try {
    const devServerUrl = new URL('./devServer.js', import.meta.url).href;
    const { startDevServer } = await import(devServerUrl);
    await startDevServer({ root: process.cwd(), port });
  } catch (err) {
    console.error('[nextify] Erro ao iniciar dev server:', (err as Error).message);
    process.exit(1);
  }
}

function runProdServer(port: number) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Nextify production server ativo 🚀');
  });
  server.listen(port, () => {
    console.log(`Nextify start em http://localhost:${port}`);
  });
}

function runBuild() {
  mkdirSync(join(process.cwd(), 'dist'), { recursive: true });
  writeFileSync(
    join(process.cwd(), 'dist', 'route-manifest.json'),
    JSON.stringify({ note: 'Manifesto de rotas gerado pelo build do Nextify', generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log('✔ Build concluído. Artefatos em dist/');
}

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

function migrateNextProject(root = process.cwd()) {
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

function showHelp() {
  console.log(`
Uso:

  create-nextify [nome-do-projeto]

ou

  nextify create [nome-do-projeto]
  nextify dev [porta]
  nextify build
  nextify start [porta]
  nextify migrate
`);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const command = args[0];
const portArg = Number(process.env.PORT ?? args[1] ?? 3000);
const port = Number.isFinite(portArg) ? portArg : 3000;

switch (command) {
  case 'create':
    createProject(args[1]);
    break;
  case 'dev':
    runDevServer(port);
    break;
  case 'build':
    runBuild();
    break;
  case 'start':
    runProdServer(port);
    break;
  case 'migrate':
    migrateNextProject(process.cwd());
    break;
  default:
    createProject(command);
}

export { migrateNextProject };
