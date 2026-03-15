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
    JSON.stringify({
      name: target,
      private: true,
      type: 'module',
      scripts: {
        dev: 'nextify dev',
        build: 'nextify build',
        start: 'nextify start',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        'create-nextify': 'latest',
        vite: '^5.4.19',
        '@vitejs/plugin-react': '^4.3.4',
        '@types/react': '^18.3.1',
        '@types/react-dom': '^18.3.1',
        typescript: '^5.0.0',
      },
    }, null, 2)
  );

  writeFileSync(
    join(root, 'pages', 'index.tsx'),
`export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Bem-vindo ao Nextify.js 🚀</h1>
      <p>Edite <code>pages/index.tsx</code> para começar.</p>
    </main>
  );
}
`
  );

  writeFileSync(
    join(root, 'pages', 'api', 'health.ts'),
`export default async function handler() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
`
  );

  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['pages', 'src'],
    }, null, 2)
  );

  console.log(`\n✔ Projeto criado em: ${root}`);
  console.log('\nPróximos passos:\n');
  console.log(`  cd ${target}`);
  console.log('  npm install');
  console.log('  npm run dev\n');
}

async function runDevServer(port: number) {
  try {
    // devServer.js está embutido no próprio pacote create-nextify (dist/devServer.js)
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
    JSON.stringify({ generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log('✔ Build concluído. Artefatos em dist/');
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

if (args.length === 0) { showHelp(); process.exit(0); }

const command = args[0];
const portArg = Number(process.env.PORT ?? args[1] ?? 3000);
const port = Number.isFinite(portArg) ? portArg : 3000;

switch (command) {
  case 'create': createProject(args[1]); break;
  case 'dev':    runDevServer(port); break;
  case 'build':  runBuild(); break;
  case 'start':  runProdServer(port); break;
  default:       createProject(command);
}