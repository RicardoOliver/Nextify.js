# Nextify.js — Arquitetura de um Framework React estilo Next.js

Este documento descreve o design de um framework React moderno chamado **Nextify.js**, construído com **Node.js + React** e focado em escalabilidade, DX (Developer Experience) e deploy em ambientes modernos (serverless/edge).

---

## 1) Visão geral da arquitetura

A arquitetura do Nextify.js é modular e separada em pacotes internos para facilitar manutenção, evolução e versionamento.

```txt
packages/
  cli/                # Comando `create-nextify` e utilitários de scaffolding
  core/               # Núcleo: rotas, middleware, plugins, config
  dev-server/         # Servidor de desenvolvimento + HMR
  renderer/           # SSR/SSG com ReactDOMServer e hidratação
  bundler/            # Integração com Vite (ou esbuild/webpack)
  api-runtime/        # Execução de API Routes
  edge-adapter/       # Adapter para deploy edge/serverless
  shared/             # Tipos, helpers e utilitários comuns
```

### Fluxo de execução

1. **CLI** cria projeto base com convenções de pastas.
2. **Dev Server** lê `nextify.config.ts`, carrega plugins e middlewares.
3. **Router** gera mapa de rotas via File-Based Routing (`src/pages` e `src/app`).
4. **Renderer** decide SSR/SSG/CSR por rota.
5. **Bundler** produz chunks otimizados (code splitting + lazy loading).
6. **Adapters** empacotam para Node, serverless ou edge.

---

## 2) Estrutura de diretórios recomendada

Estrutura escalável do projeto de aplicação:

```txt
my-nextify-app/
  src/
    app/                    # Rotas por segmento (opcional estilo app-router)
    pages/                  # File-based routing tradicional
      index.tsx
      about.tsx
      blog/
        [slug].tsx
      api/
        hello.ts            # API Routes
    components/
    layouts/
    lib/
    middleware/
      auth.ts
      logging.ts
    styles/
  public/
  .env
  .env.local
  nextify.config.ts
  package.json
```

### Convenções de roteamento

- `src/pages/index.tsx` → `/`
- `src/pages/about.tsx` → `/about`
- `src/pages/blog/[slug].tsx` → `/blog/:slug`
- `src/pages/api/*.ts` → endpoints HTTP (`/api/*`)

---

## 3) Componente principal: Core do framework

O núcleo organiza registro de rotas, middlewares, plugins e configuração.

```ts
// packages/core/src/types.ts
export type NextifyConfig = {
  srcDir?: string;
  outDir?: string;
  plugins?: NextifyPlugin[];
  envPrefix?: string; // ex: NEXTIFY_PUBLIC_
};

export type RouteDefinition = {
  path: string;
  file: string;
  type: 'page' | 'api';
  ssr?: boolean;
  ssg?: boolean;
};

export type NextifyPlugin = {
  name: string;
  setup?(ctx: PluginContext): Promise<void> | void;
};
```

```ts
// packages/core/src/plugin-system.ts
export async function applyPlugins(plugins: NextifyPlugin[], ctx: PluginContext) {
  for (const plugin of plugins) {
    await plugin.setup?.(ctx);
  }
}
```

---

## 4) File-Based Routing

Scanner de arquivos gera tabela de rotas.

```ts
// packages/core/src/router/file-router.ts
import fg from 'fast-glob';
import path from 'node:path';

export async function generateRoutes(srcDir: string): Promise<RouteDefinition[]> {
  const files = await fg(['pages/**/*.{tsx,ts,jsx,js}'], { cwd: srcDir });

  return files.map((file) => {
    const normalized = file
      .replace(/^pages\//, '')
      .replace(/\.(tsx|ts|jsx|js)$/, '')
      .replace(/index$/, '')
      .replace(/\[(.+?)\]/g, ':$1');

    const routePath = `/${normalized}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const type = file.startsWith('pages/api/') ? 'api' : 'page';

    return { path: routePath, file: path.join(srcDir, file), type };
  });
}
```

---

## 5) SSR com React

Para SSR, renderizamos no servidor e enviamos HTML hidratável.

```ts
// packages/renderer/src/ssr.ts
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';

export function renderSSR(App: React.FC, props: Record<string, unknown>, res: NodeJS.WritableStream) {
  const { pipe } = renderToPipeableStream(<App {...props} />, {
    bootstrapScripts: ['/assets/client-entry.js'],
    onShellReady() {
      res.write('<!doctype html><html><body><div id="root">');
      pipe(res);
      res.write('</div></body></html>');
    }
  });
}
```

Página com coleta de dados SSR:

```ts
// src/pages/products.tsx
export async function getServerSideProps(ctx: { query: URLSearchParams }) {
  const data = await fetch('https://api.example.com/products').then(r => r.json());
  return { props: { data } };
}

export default function ProductsPage({ data }: { data: any[] }) {
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

## 6) SSG (Static Site Generation)

No build, páginas SSG são pré-renderizadas em HTML.

```ts
// src/pages/blog/[slug].tsx
export async function getStaticPaths() {
  const slugs = ['introducao', 'arquitetura'];
  return slugs.map((slug) => ({ params: { slug } }));
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = await loadPost(params.slug);
  return { props: { post } };
}

export default function PostPage({ post }: any) {
  return <article>{post.title}</article>;
}
```

Pipeline do builder:
1. Descobre páginas com `getStaticPaths`.
2. Executa `getStaticProps` para cada variação.
3. Gera `dist/<rota>/index.html`.

---

## 7) API Routes integradas

Arquivos em `pages/api` recebem `req`/`res`.

```ts
// src/pages/api/hello.ts
import type { NextifyApiHandler } from 'nextify';

const handler: NextifyApiHandler = async (req, res) => {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ message: 'Hello from Nextify API' }));
};

export default handler;
```

Runtime simplificado:

```ts
// packages/api-runtime/src/execute.ts
export async function executeApiRoute(mod: any, req: any, res: any) {
  const handler = mod.default;
  if (typeof handler !== 'function') throw new Error('API route sem default export');
  await handler(req, res);
}
```

---

## 8) Dev Server + Hot Reload

Use Vite como motor de dev pela velocidade e HMR nativo.

```ts
// packages/dev-server/src/start.ts
import { createServer as createViteServer } from 'vite';

export async function startDevServer(root: string) {
  const vite = await createViteServer({
    root,
    server: { port: 3000 },
    appType: 'custom'
  });

  await vite.listen();
  console.log('Nextify dev server rodando em http://localhost:3000');
}
```

Em alterações de arquivos:
- HMR atualiza componentes React sem refresh total.
- Para mudanças de rota/arquivo, router é regenerado dinamicamente.

---

## 9) Build, bundling e otimização automática

### Requisitos
- code splitting por rota
- lazy loading de componentes pesados
- minificação e tree-shaking

Exemplo de lazy loading em página:

```tsx
import React, { Suspense, lazy } from 'react';

const AnalyticsPanel = lazy(() => import('../components/AnalyticsPanel'));

export default function Dashboard() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <AnalyticsPanel />
    </Suspense>
  );
}
```

No bundler (Vite/Rollup), configurar chunks manuais por domínio funcional para cache eficiente.

---

## 10) Middleware

Middleware global por request com suporte a encadeamento.

```ts
// packages/core/src/middleware.ts
export type NextifyMiddleware = (ctx: any, next: () => Promise<void>) => Promise<void>;

export async function runMiddlewares(middlewares: NextifyMiddleware[], ctx: any) {
  let idx = -1;
  async function dispatch(i: number): Promise<void> {
    if (i <= idx) throw new Error('next() chamado múltiplas vezes');
    idx = i;
    const fn = middlewares[i];
    if (!fn) return;
    await fn(ctx, () => dispatch(i + 1));
  }
  await dispatch(0);
}
```

Exemplo:

```ts
// src/middleware/auth.ts
export default async function auth(ctx, next) {
  if (!ctx.req.headers.authorization) {
    ctx.res.statusCode = 401;
    return ctx.res.end('Unauthorized');
  }
  await next();
}
```

---

## 11) Sistema de plugins

Plugin permite estender build, rotas e runtime.

```ts
// nextify.config.ts
import { defineConfig } from 'nextify';

export default defineConfig({
  plugins: [
    {
      name: 'plugin-sitemap',
      async setup(ctx) {
        ctx.hooks.on('build:done', async () => {
          await ctx.emitFile('sitemap.xml', '<urlset>...</urlset>');
        });
      }
    }
  ]
});
```

Boas práticas:
- hooks explícitos (`build:start`, `route:extend`, `server:request`)
- contrato tipado
- isolamento de falhas por plugin

---

## 12) Variáveis de ambiente

Carregamento com `dotenv` e separação entre server/public.

```ts
// packages/core/src/env.ts
import dotenv from 'dotenv';

export function loadEnv(mode: string) {
  dotenv.config({ path: `.env` });
  dotenv.config({ path: `.env.${mode}`, override: true });

  const publicEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('NEXTIFY_PUBLIC_'))
  );

  return { all: process.env, public: publicEnv };
}
```

- `NEXTIFY_PUBLIC_*`: expostas no client bundle.
- demais variáveis: somente servidor.

---

## 13) Deploy serverless/edge

Criar adapters por plataforma:

- `@nextify/adapter-node`
- `@nextify/adapter-flyio`
- `@nextify/adapter-cloudflare`

Contrato sugerido:

```ts
export interface DeploymentAdapter {
  name: string;
  build(config: BuildOutput): Promise<void>;
  start?(options: any): Promise<void>;
}
```

Exemplo edge (Fetch API):

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    return handleNextifyRequest(request);
  }
};
```

---

## 14) CLI para criação de projetos

### Comandos

- `create-nextify my-app`
- `nextify dev`
- `nextify build`
- `nextify start`

Exemplo com `commander`:

```ts
#!/usr/bin/env node
import { Command } from 'commander';
import { scaffoldApp } from './scaffold';

const program = new Command();

program
  .name('create-nextify')
  .argument('<project-name>')
  .option('--ts', 'usar TypeScript', true)
  .action(async (projectName, options) => {
    await scaffoldApp({ projectName, typescript: options.ts });
  });

program.parse();
```

Scaffolding:
1. copia template (`templates/base-ts`)
2. ajusta `package.json`
3. instala dependências
4. inicializa git

---

## 15) Empacotamento NPM

`package.json` do framework (pacote principal):

```json
{
  "name": "nextify",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "bin": {
    "nextify": "dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

Passos de release:
1. `pnpm -r build`
2. `pnpm -r test`
3. versionamento semântico (Changesets)
4. `npm publish --access public`

---

## 16) Exemplo de projeto com Nextify.js

### Código

```tsx
// src/pages/index.tsx
export default function Home() {
  return <h1>Bem-vindo ao Nextify.js</h1>;
}
```

```tsx
// src/pages/about.tsx
export default function About() {
  return <p>Framework React com SSR, SSG e API routes.</p>;
}
```

```ts
// src/pages/api/health.ts
export default function handler(req, res) {
  res.statusCode = 200;
  res.end('ok');
}
```

### Como rodar

```bash
# criar projeto
npx create-nextify meu-app
cd meu-app

# desenvolvimento
npm run dev

# build de produção
npm run build

# iniciar servidor de produção
npm run start
```

---

## 17) Boas práticas de engenharia para o Nextify.js

- **Arquitetura em camadas**: core, runtime, tooling e adapters desacoplados.
- **Tipagem forte** com TypeScript em APIs públicas.
- **Contratos estáveis** para plugins/middlewares.
- **Testes**:
  - unitários (router, plugins, env)
  - integração (SSR/API)
  - e2e (dev server + navegação)
- **Observabilidade**: logs estruturados, métricas e tracing.
- **Compatibilidade incremental**: recursos opt-in e migrações versionadas.

Com essa base, o **Nextify.js** consegue entregar DX comparável ao Next.js, com foco em modularidade, extensibilidade e alto desempenho em produção.
