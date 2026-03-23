import path from 'node:path';
import fs from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 3000);
const PROJECT_ROOT = process.env.NEXTIFY_ROOT ?? process.cwd();
const PAGES_DIR = path.join(PROJECT_ROOT, 'pages');

function toRoutePath(filePath) {
  const clean = filePath
    .replace(/\\/g, '/')
    .replace(/^pages\//, '')
    .replace(/\.(t|j)sx?$/, '')
    .replace(/index$/, '');
  if (!clean) return '/';
  return '/' + clean.split('/').filter(Boolean)
    .map((seg) => seg.replace(/^\[(.+)\]$/, ':$1')).join('/');
}

function buildRouteManifest(files) {
  return files.map((file) => {
    const normalized = file.replace(/\\/g, '/');
    const routePath = toRoutePath(normalized);
    const base = path.basename(normalized);
    const kind = normalized.includes('/api/') ? 'api'
      : base.startsWith('middleware') ? 'middleware' : 'page';
    return { file: normalized, routePath, kind };
  });
}

function getPageFiles() {
  if (!fs.existsSync(PAGES_DIR)) return [];
  const files = [];

  function walk(dir, base = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        files.push(`pages/${rel}`);
      }
    }
  }

  walk(PAGES_DIR);
  return files;
}

function buildHtmlShell(routePath) {
  const fileHint = routePath === '/' ? '/pages/index' : `/pages${routePath}`;
  const currentRoute = JSON.stringify(routePath);
  const candidates = JSON.stringify([
    `${fileHint}.tsx`, `${fileHint}.jsx`, `${fileHint}.ts`, `${fileHint}.js`,
  ]);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nextify.js</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background:
          radial-gradient(circle at 0% 0%, #e0e7ff 0%, #f8fafc 45%, #ffffff 100%);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: #0f172a;
      }

      #root {
        min-height: 100vh;
        padding: clamp(20px, 4vw, 40px);
      }

      body main {
        width: min(1100px, 100%);
        margin: 0 auto;
        padding: clamp(24px, 4vw, 48px);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(148, 163, 184, 0.28);
        box-shadow: 0 24px 80px -45px rgba(15, 23, 42, 0.5);
      }

      body h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.25rem);
        line-height: 1.1;
        letter-spacing: -0.03em;
      }

      body p {
        margin: 14px 0 0;
        color: #334155;
        max-width: 68ch;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import { createElement } from 'react';
      import { createRoot } from 'react-dom/client';

      const candidates = ${candidates};
      const currentRoute = ${currentRoute};

      async function loadPage() {
        let mod;
        for (const c of candidates) {
          try {
            mod = await import(/* @vite-ignore */c);
            break;
          } catch {}
        }

        const root = document.getElementById('root');

        if (!mod?.default && currentRoute === '/') {
          root.innerHTML = \`
            <main>
              <h1>Bem-vindo ao Nextify.js 🚀</h1>
              <p>Seu projeto está no ar. Crie <code>pages/index.tsx</code> para personalizar esta tela inicial.</p>

              <p>Comece agora com o comando abaixo e acesse a documentação completa.</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
                <button id="nextify-get-started" type="button" style="border:none;border-radius:10px;background:linear-gradient(135deg,#60a5fa,#2563eb);padding:10px 16px;font-weight:700;cursor:pointer">Get Started →</button>
                <a href="https://github.com/RicardoOliver/Nextify.js#readme" target="_blank" rel="noreferrer" style="border:1px solid #94a3b84a;border-radius:10px;padding:10px 16px;color:#0f172a;text-decoration:none;font-weight:700">Read Docs</a>
              </div>
              <code id="nextify-command" style="display:inline-block;margin-top:14px;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff">npx create-nextify@latest my-app</code>
            </main>
          \`;
          const copyButton = document.getElementById('nextify-get-started');
          const commandBox = document.getElementById('nextify-command');
          copyButton?.addEventListener('click', async () => {
            const command = 'npx create-nextify@latest my-app';
            try {
              await navigator.clipboard.writeText(command);
              copyButton.textContent = 'Comando copiado ✓';
              setTimeout(() => { copyButton.textContent = 'Get Started →'; }, 1800);
            } catch {
              window.alert('Copie manualmente: ' + command);
            }
          });
          commandBox?.addEventListener('click', async () => {
            const command = 'npx create-nextify@latest my-app';
            try {
              await navigator.clipboard.writeText(command);
            } catch {}
          });

              <p>Exemplo rápido: adicione também <code>pages/api/health.ts</code> para validar rotas de API.</p>
            </main>
          \`;

          return;
        }

        if (!mod?.default) {
          root.innerHTML = '<div style="font-family:monospace;padding:2rem;color:#e53e3e"><h2>404 — Página não encontrada</h2></div>';
          return;
        }

        createRoot(root).render(createElement(mod.default));
      }

      loadPage().catch((err) => {
        document.getElementById('root').innerHTML =
          '<pre style="color:red;padding:2rem">' + err.stack + '</pre>';
      });
    </script>
  </body>
</html>`;
}

export async function startDevServer(options = {}) {
  const root = options.root ?? PROJECT_ROOT;
  const port = options.port ?? PORT;

  // ✅ IMPORT CORRETO (SEM PATH HARDCODE)
  let createViteServer, react;

  try {
    const vite = await import('vite');
    const pluginReact = await import('@vitejs/plugin-react');

    createViteServer = vite.createServer;
    react = pluginReact.default;
  } catch (err) {
    console.error('\n[nextify] Vite não encontrado. Rode:\n');
    console.error('  npm install vite @vitejs/plugin-react\n');
    console.error(err.message);
    process.exit(1);
  }

  const vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.join(root, 'src'),
      },
    },
  });

  const manifest = buildRouteManifest(getPageFiles());

  console.log('\n  nextify dev\n');
  for (const r of manifest) {
    console.log(`  ${r.kind === 'api' ? '⚡' : '○'}  ${r.routePath}`);
  }
  console.log('');

  const server = createHttpServer(async (req, res) => {
    const host = req.headers.host ?? `localhost:${port}`;
    const pathname = new URL(`http://${host}${req.url}`).pathname;

    // Assets (Vite)
    if (
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules') ||
      /\.(js|ts|tsx|jsx|css|svg|png|ico|woff2?|map)$/.test(pathname)
    ) {
      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end();
      });
      return;
    }

    // API routes
    const apiRoute = manifest.find(
      (r) => r.kind === 'api' && r.routePath === pathname
    );

    if (apiRoute) {
      try {
        const mod = await vite.ssrLoadModule(path.join(root, apiRoute.file));

        if (typeof mod.default !== 'function') {
          throw new Error('API route sem default export');
        }

        const webReq = new globalThis.Request(
          `http://${host}${req.url}`,
          { method: req.method ?? 'GET' }
        );

        const webRes = await mod.default(webReq);

        res.statusCode = webRes.status;

        for (const [k, v] of webRes.headers.entries()) {
          res.setHeader(k, v);
        }

        res.end(Buffer.from(await webRes.arrayBuffer()));
      } catch (err) {
        vite.ssrFixStacktrace(err);

        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }

      return;
    }

    // Pages
    try {
      const html = await vite.transformIndexHtml(
        req.url ?? '/',
        buildHtmlShell(pathname)
      );

      const found = pathname === '/' || manifest.some(
        (r) => r.kind === 'page' && r.routePath === pathname
      );

      res.statusCode = found ? 200 : 404;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);

      res.statusCode = 500;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<pre style="color:red;padding:2rem">${err.stack}</pre>`);
    }
  });

  server.listen(port, () => {
    console.log(`  ➜  Local:   http://localhost:${port}`);
    console.log(`  ➜  HMR:    ativo\n`);
  });

  return { server, vite };
}

// CLI
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  startDevServer().catch((err) => {
    console.error('[nextify] Falha ao iniciar dev server');
    console.error(err);
    process.exit(1);
  });
}
