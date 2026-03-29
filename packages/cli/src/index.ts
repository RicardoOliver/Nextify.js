#!/usr/bin/env node
import http from 'node:http';
import { spawnSync } from 'node:child_process';

import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync
} from 'node:fs';
import { join } from 'node:path';
// Mantém a lógica de migração isolada para evitar conflitos recorrentes no entrypoint da CLI.
import { migrateNextProject } from './migrate.js';
import { initFrameworkMigration, runFrameworkCheck } from './frameworkMigration.js';


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
          react: '^19.2.4',
          'react-dom': '^19.2.4'
        },
        devDependencies: {
          'create-nextify': 'latest',
          vite: '^8.0.1',
          '@vitejs/plugin-react': '^6.0.1',
          '@types/react': '^19.2.2',
          '@types/react-dom': '^19.2.2',
          typescript: '^5.0.0'
        }
      },
      null,
      2
    )
  );

  writeFileSync(
    join(root, 'pages', 'index.tsx'),

    `import { useState } from 'react';

const docsUrl = 'https://github.com/RicardoOliver/Nextify.js#readme';
const command = 'npx create-nextify@latest my-app';

const features = [
  { title: 'Vite-Powered HMR', description: 'Atualizações instantâneas em desenvolvimento.' },
  { title: 'File-based Routing', description: 'Rotas automáticas via estrutura de arquivos.' },
  { title: 'API Routes', description: 'Endpoints em /pages/api com Web APIs.' },
];

export default function Home() {
  const [copied, setCopied] = useState(false);

  async function onGetStarted() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.alert('Copie manualmente: ' + command);
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', background: '#020617', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ width: 'min(1100px, 100%)', margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 6vw, 4rem)' }}>The modern React framework</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Build full-stack React applications com file-based routing e API routes.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button type="button" onClick={onGetStarted} style={{ border: 'none', borderRadius: '10px', padding: '12px 18px', fontWeight: 800, background: '#60a5fa', cursor: 'pointer' }}>
            {copied ? 'Comando copiado ✓' : 'Get Started →'}
          </button>
          <a href={docsUrl} target="_blank" rel="noreferrer" style={{ border: '1px solid #334155', borderRadius: '10px', padding: '12px 18px', color: '#e2e8f0', textDecoration: 'none', fontWeight: 700 }}>
            Read Docs
          </a>
        </div>
        <code style={{ display: 'inline-block', marginTop: '16px', background: '#0f172a', borderRadius: '10px', padding: '10px 14px' }}>
          $ {command}
        </code>
        <section style={{ display: 'grid', gap: '14px', marginTop: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {features.map((feature) => (
            <article key={feature.title} style={{ background: '#0b1220', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px' }}>
              <h3 style={{ margin: 0 }}>{feature.title}</h3>
              <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>{feature.description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
`
  );

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

function ensureCloudflareDeploymentFiles() {
  const root = process.cwd();
  const cwdName = root.split('/').filter(Boolean).pop() ?? 'nextify-app';
  const packageName = existsSync(join(root, 'package.json'))
    ? (() => {
      try {
        const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string };
        return packageJson.name;
      } catch {
        return undefined;
      }
    })()
    : undefined;

  const workerName = (packageName ?? cwdName).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const wranglerPath = join(root, 'wrangler.toml');
  const workerEntrypointPath = join(root, 'dist', '_worker.js');

  if (!existsSync(wranglerPath)) {
    writeFileSync(
      wranglerPath,
      `name = "${workerName}"
main = "dist/_worker.js"
compatibility_date = "2025-01-01"
`,
      'utf8'
    );
    console.log('✔ wrangler.toml criado automaticamente.');
  }

  mkdirSync(join(root, 'dist'), { recursive: true });
  if (!existsSync(workerEntrypointPath)) {
    writeFileSync(
      workerEntrypointPath,
      `export default {
  async fetch() {
    const body = JSON.stringify({
      ok: true,
      runtime: 'cloudflare-workers',
      framework: 'nextify'
    });

    return new Response(body, {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};
`,
      'utf8'
    );
    console.log('✔ dist/_worker.js criado para deploy Cloudflare.');
  }
}

function runCloudflareDeploy() {
  ensureCloudflareDeploymentFiles();
  runBuild();

  const wranglerBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const deploy = spawnSync(wranglerBin, ['wrangler', 'deploy'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (deploy.status !== 0) {
    process.exit(deploy.status ?? 1);
  }

  console.log('🚀 Deploy Cloudflare concluído.');
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
  nextify check
  nextify init
  nextify migrate
  nextify deploy cloudflare
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
  case 'check':
    runFrameworkCheck(process.cwd());
    break;
  case 'init':
    initFrameworkMigration(process.cwd());
    break;
  case 'migrate':
    migrateNextProject(process.cwd());
    break;
  case 'deploy':
    if (args[1] === 'cloudflare') {
      runCloudflareDeploy();
      break;
    }
    console.error('Erro: target de deploy não suportado. Use "nextify deploy cloudflare".');
    process.exit(1);
    break;
  default:
    createProject(command);
}

export { migrateNextProject };
