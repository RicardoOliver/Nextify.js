#!/usr/bin/env node
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function createProject(target = 'nextify-app') {
  const root = join(process.cwd(), target);

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
          'create-nextify': '^0.1.0'
        }
      },
      null,
      2
    )
  );

  writeFileSync(
    join(root, 'pages', 'index.tsx'),
    `export default function Home() {\n  return <main>Bem-vindo ao Nextify.js</main>;\n}\n`
  );

  writeFileSync(
    join(root, 'pages', 'api', 'health.ts'),
    `export default async function handler() {\n  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });\n}\n`
  );

  console.log(`Projeto criado em: ${root}`);
  console.log('Próximos passos:');
  console.log(`  cd ${target}`);
  console.log('  npm install');
  console.log('  npm run dev');
}

function runDevServer(port: number) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Nextify dev server ativo.');
  });

  server.listen(port, () => {
    console.log(`Nextify dev server em http://localhost:${port}`);
  });
}

function runProdServer(port: number) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Nextify production server ativo.');
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

  console.log('Build do Nextify concluído. Artefatos em dist/.');
}

const [, , command, ...args] = process.argv;
const portArg = Number(process.env.PORT ?? args[0] ?? 3000);
const port = Number.isFinite(portArg) ? portArg : 3000;

if (!command || command === 'create') {
  createProject(args[0]);
} else if (command === 'dev') {
  runDevServer(port);
} else if (command === 'build') {
  runBuild();
} else if (command === 'start') {
  runProdServer(port);
} else {
  console.log('Uso:');
  console.log('  create-nextify [nome-do-projeto]');
  console.log('  nextify create [nome-do-projeto]');
  console.log('  nextify dev [porta]');
  console.log('  nextify build');
  console.log('  nextify start [porta]');
  process.exit(1);
}
