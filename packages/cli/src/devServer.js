import path from 'node:path';
import fs from 'node:fs';
import { createServer as createHttpServer } from 'node:http';

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
      else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(`pages/${rel}`);
    }
  }
  walk(PAGES_DIR);
  return files;
}

function buildHtmlShell(routePath) {
  const fileHint = routePath === '/' ? '/pages/index' : `/pages${routePath}`;
  const candidates = JSON.stringify([
    `${fileHint}.tsx`, `${fileHint}.jsx`, `${fileHint}.ts`, `${fileHint}.js`,
  ]);
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
      const candidates = ${candidates};
      async function loadPage() {
        let mod;
        for (const c of candidates) { try { mod = await import(c); break; } catch {} }
        const root = document.getElementById('root');
        if (!mod?.default) {
          root.innerHTML = '<div style="font-family:monospace;padding:2rem;color:#e53e3e"><h2>404 — Página não encontrada</h2></div>';
          return;
        }
        createRoot(root).render(createElement(mod.default));
      }
      loadPage().catch((err) => {
        document.getElementById('root').innerHTML = '<pre style="color:red;padding:2rem">' + err.stack + '</pre>';
      });
    </script>
  </body>
</html>`;
}

export async function startDevServer(options = {}) {
  const root = options.root ?? PROJECT_ROOT;
  const port = options.port ?? PORT;

  // Resolve vite e plugin-react a partir do projeto do usuário (node_modules local)
  const vitePath = path.join(root, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  const reactPluginPath = path.join(root, 'node_modules', '@vitejs', 'plugin-react', 'dist', 'index.mjs');

  let createViteServer, react;
  try {
    ({ createServer: createViteServer } = await import(vitePath));
    ({ default: react } = await import(reactPluginPath));
  } catch (err) {
    console.error('[nextify] Vite não encontrado. Rode: npm install vite @vitejs/plugin-react');
    console.error(err.message);
    process.exit(1);
  }

  const vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [react()],
    resolve: { alias: { '@': path.join(root, 'src') } },
  });

  const manifest = buildRouteManifest(getPageFiles());
  console.log('\n  nextify dev\n');
  for (const r of manifest) console.log(`  ${r.kind === 'api' ? '⚡' : '○'}  ${r.routePath}`);
  console.log('');

  const server = createHttpServer(async (req, res) => {
    const host = req.headers.host ?? `localhost:${port}`;
    const pathname = new URL(`http://${host}${req.url}`).pathname;

    if (pathname.startsWith('/@') || pathname.startsWith('/node_modules') ||
        /\.(js|ts|tsx|jsx|css|svg|png|ico|woff2?|map)$/.test(pathname)) {
      vite.middlewares(req, res, () => { res.statusCode = 404; res.end(); });
      return;
    }

    const apiRoute = manifest.find((r) => r.kind === 'api' && r.routePath === pathname);
    if (apiRoute) {
      try {
        const mod = await vite.ssrLoadModule(path.join(root, apiRoute.file));
        if (typeof mod.default !== 'function') throw new Error('API route sem default export');
        const webReq = new globalThis.Request(`http://${host}${req.url}`, { method: req.method ?? 'GET' });
        const webRes = await mod.default(webReq);
        res.statusCode = webRes.status;
        for (const [k, v] of webRes.headers.entries()) res.setHeader(k, v);
        res.end(Buffer.from(await webRes.arrayBuffer()));
      } catch (err) {
        vite.ssrFixStacktrace(err);
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    try {
      const html = await vite.transformIndexHtml(req.url ?? '/', buildHtmlShell(pathname));
      const found = manifest.some((r) => r.kind === 'page' && r.routePath === pathname);
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
    console.log(`  ➜  Local:   \x1b[36mhttp://localhost:${port}\x1b[0m`);
    console.log(`  ➜  HMR:    ativo\n`);
  });

  return { server, vite };
}

startDevServer();