import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createServer as createHttpServer } from 'node:http';
import { buildRouteManifest } from '@nextify/core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PORT = Number(process.env.PORT ?? 3000);
const PROJECT_ROOT = process.env.NEXTIFY_ROOT ?? process.cwd();
const PAGES_DIR = path.join(PROJECT_ROOT, 'pages');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeRequestToWebRequest(req, host) {
  const url = `http://${host}${req.url}`;
  return new globalThis.Request(url, { method: req.method ?? 'GET' });
}

function getPageFiles() {
  if (!fs.existsSync(PAGES_DIR)) return [];

  const files = [];
  function walk(dir, base = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        files.push(`pages/${rel}`);
      }
    }
  }
  walk(PAGES_DIR);
  return files;
}

// ─── HTML shell ───────────────────────────────────────────────────────────────

function buildHtmlShell(routePath, viteBase = '/') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nextify.js</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import { createElement } from 'react';
      import { createRoot } from 'react-dom/client';

      // Descobre qual página carregar pela rota atual
      const route = ${JSON.stringify(routePath)};
      
      async function loadPage() {
        try {
          // Tenta importar o módulo da página via Vite HMR
          const mod = await import(${JSON.stringify(`/pages${routePath === '/' ? '/index' : routePath}.tsx`)});
          const Page = mod.default;
          if (!Page) throw new Error('Página sem default export');
          
          const root = document.getElementById('root');
          createRoot(root).render(createElement(Page));
        } catch (err) {
          document.getElementById('root').innerHTML = \`
            <div style="font-family:monospace;padding:2rem;color:#e53e3e">
              <h2>Erro ao carregar a página</h2>
              <pre>\${err.message}</pre>
            </div>
          \`;
        }
      }

      loadPage();
    </script>
  </body>
</html>`;
}

// ─── Dev server principal ─────────────────────────────────────────────────────

export async function startDevServer(options = {}) {
  const root = options.root ?? PROJECT_ROOT;
  const port = options.port ?? PORT;

  // 1. Sobe o Vite em modo middleware (sem porta própria)
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

  // 2. Gera o manifesto de rotas a partir dos arquivos em pages/
  const pageFiles = getPageFiles();
  const manifest = buildRouteManifest(pageFiles);

  console.log('\n  nextify dev\n');
  for (const route of manifest) {
    const icon = route.kind === 'api' ? '⚡' : '○';
    console.log(`  ${icon}  ${route.routePath}`);
  }
  console.log('');

  // 3. Cria o servidor HTTP que orquestra Vite + rotas
  const server = createHttpServer(async (req, res) => {
    const host = req.headers.host ?? `localhost:${port}`;
    const url = new URL(`http://${host}${req.url}`);
    const pathname = url.pathname;

    // ── Arquivos estáticos e HMR do Vite (js, css, @vite, node_modules) ──
    const isViteInternal =
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules') ||
      pathname.match(/\.(js|ts|tsx|jsx|css|svg|png|ico|woff2?)$/);

    if (isViteInternal) {
      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end('Not found');
      });
      return;
    }

    // ── API Routes ──
    const apiRoute = manifest.find(
      (r) => r.kind === 'api' && r.routePath === pathname
    );

    if (apiRoute) {
      try {
        const mod = await vite.ssrLoadModule(path.join(root, apiRoute.file));
        const handler = mod.default;
        if (typeof handler !== 'function') {
          res.statusCode = 500;
          res.end('API route sem default export');
          return;
        }

        const webReq = nodeRequestToWebRequest(req, host);
        const webRes = await handler(webReq);

        res.statusCode = webRes.status;
        for (const [key, value] of webRes.headers.entries()) {
          res.setHeader(key, value);
        }
        const body = await webRes.arrayBuffer();
        res.end(Buffer.from(body));
      } catch (err) {
        vite.ssrFixStacktrace(err);
        console.error('[nextify] API route error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err.message) }));
      }
      return;
    }

    // ── Páginas React — entrega o HTML shell para o Vite hidratar ──
    const pageRoute = manifest.find(
      (r) => r.kind === 'page' && r.routePath === pathname
    );

    const routePath = pageRoute ? pageRoute.routePath : pathname;

    try {
      let html = buildHtmlShell(routePath);
      // Deixa o Vite injetar o client HMR e transformar o HTML
      html = await vite.transformIndexHtml(req.url ?? '/', html);
      res.statusCode = pageRoute ? 200 : 404;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      console.error('[nextify] render error:', err);
      res.statusCode = 500;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<pre style="color:red">${err.stack}</pre>`);
    }
  });

  server.listen(port, () => {
    console.log(`  ➜  Local:   \x1b[36mhttp://localhost:${port}\x1b[0m`);
    console.log(`  ➜  HMR:    ativo\n`);
  });

  return { server, vite };
}

// Entrada direta: node devServer.js
startDevServer();