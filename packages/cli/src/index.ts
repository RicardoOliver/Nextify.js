#!/usr/bin/env node
import http from 'node:http';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
        scripts: {
          dev: 'nextify dev',
          build: 'nextify build',
          start: 'nextify start'
        },
        devDependencies: {
          "create-nextify": "^0.1.0"
        }
      },
      null,
      2
    )
  );

  writeFileSync(
    join(root, 'pages', 'index.tsx'),
`export default function Home() {
  return (
    <main>
      <h1>Bem-vindo ao Nextify.js 🚀</h1>
    </main>
  );
}
`
  );

  writeFileSync(
    join(root, 'pages', 'api', 'health.ts'),
`export default async function handler() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' }
  });
}
`
  );

  console.log(`\n✔ Projeto criado em: ${root}`);
  console.log('\nPróximos passos:\n');
  console.log(`  cd ${target}`);
  console.log('  npm install');
  console.log('  npm run dev\n');
}

function runDevServer(port: number) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Nextify dev server ativo 🚀');
  });

  server.listen(port, () => {
    console.log(`Nextify dev server em http://localhost:${port}`);
  });
}

function runProdServer(port: number) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Nextify production server ativo 🚀');
  });

  server.listen(port, () => {
    console.log(`Nextify start server em http://localhost:${port}`);
  });
}

function runBuild() {
  mkdirSync(join(process.cwd(), 'dist'), { recursive: true });

  writeFileSync(
    join(process.cwd(), 'dist', 'route-manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: 'Manifesto de rotas gerado pelo CLI do Nextify.'
      },
      null,
      2
    )
  );

  console.log('✔ Build do Nextify concluído. Artefatos em dist/');
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

  default:
    // suporta: npx create-nextify minha-app
    createProject(command);
}