<p align="center">
  <img src="https://img.shields.io/badge/Nextify.js-111827?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="Nextify.js" />
</p>

<h1 align="center">Nextify.js</h1>

<p align="center">
  <strong>Framework React modular com roteamento baseado em arquivos, SSR e runtime de dados com cache por tags</strong>
</p>

<p align="center">
  <a href="https://github.com/RicardoOliver/Nextify.js/actions/workflows/ci.yml">
    <img src="https://github.com/RicardoOliver/Nextify.js/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI Status" />
  </a>
  <a href="https://www.npmjs.com/package/create-nextify">
    <img src="https://img.shields.io/npm/v/create-nextify?color=blue&label=npm" alt="npm version" />
  </a>
  <a href="https://github.com/RicardoOliver/Nextify.js/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  </a>
  <a href="https://github.com/RicardoOliver/Nextify.js/releases">
    <img src="https://img.shields.io/github/v/release/RicardoOliver/Nextify.js?include_prereleases&label=release" alt="Release" />
  </a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#benchmarks">Benchmarks</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

**Nextify.js** é um framework React open source focado em arquitetura modular, DX e performance previsível. O projeto está organizado em monorepo e evolui por pacotes independentes (core, CLI, build, dev server e adapters).

```bash
npx create-nextify@latest my-app
```

## Como construímos com IA e qualidade

No Nextify, IA é **acelerador de produtividade**, não substituto de engenharia.

- IA pode escrever parte relevante do código.
- Cada linha ainda passa por quality gates automatizados e revisão humana.
- A narrativa pública é sustentada por evidências versionadas no próprio repositório.

### Evidências objetivas (fonte versionada)

- **Métricas IA + qualidade**: [`artifacts/health/ai-quality-metrics.md`](./artifacts/health/ai-quality-metrics.md)
- **Painel técnico consolidado**: [`artifacts/health/engineering-health-panel.md`](./artifacts/health/engineering-health-panel.md)
- **Gates por PR no CI**: lint, typecheck, testes, benchmark/regressão, auditorias e provenance/SBOM em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

> Princípio de rastreabilidade: sempre que a mensagem pública muda, a fonte de dados muda no mesmo PR.

Para atualizar os números antes de abrir PR:

```bash
npm run engineering-health:panel
npm run metrics:ai-quality
```

### Estado atual do projeto (v0.2.4)

- ✅ Monorepo com pacotes versionados em `0.2.4`.
- ✅ Runtime de dados com `loader/action` e invalidação por tags.
- ✅ Rendering com islands e shell de hidratação.
- ✅ Build com relatório de performance budget.
- ✅ Adapters dedicados para AWS Lambda e Cloudflare Workers.

### Atualizações implementadas em **29 de março de 2026**

- ✅ **CLI: deploy Cloudflare em um comando** com `nextify deploy cloudflare`, incluindo bootstrap automático de `wrangler.toml` e `dist/_worker.js` quando ausentes.
- ✅ **CLI: migração assistida** com comandos de pré-check de compatibilidade e inicialização de plano de migração (`nextify check` e `nextify init`).
- ✅ **Core: camada progressiva de compatibilidade Next-style APIs** para facilitar adoção incremental.
- ✅ **CI: workflow de revisão automática de PR com IA** para reforçar quality gates no repositório.
- ✅ **Documentação estratégica expandida** para benchmark público contínuo e plano de reaproveitamento técnico do projeto Vinext.

<br />

## Features

<table>
<tr>
<td width="50%">

### Capacidades implementadas

- **Roteamento baseado em arquivos** — com segmentos dinâmicos
- **SSR com streaming** — integração com React 18+
- **Runtime de dados** — `defineLoader`, `defineAction` e execução no servidor
- **Cache por tags** — `invalidateDataTags` para invalidação granular
- **Middleware** — interceptação de request/response no ciclo de render
- **API Routes** — rotas server-side para endpoints da aplicação

</td>
<td width="50%">

### Experiência de desenvolvimento

- **CLI unificada** — `create-nextify` para bootstrap e fluxo local
- **Dev server dedicado** — hot reload e validação rápida no ciclo de dev
- **Build modular** — geração de artefatos e manifests por pacote
- **Adapters de deploy** — suporte específico para edge/serverless
- **Workspace npm** — padronização de scripts para build/test/typecheck
- **E2E de referência** — cobertura ponta-a-ponta com app de referência

</td>
</tr>
</table>

<br />

## Quick Start

### Criar um novo projeto

Você pode iniciar um app Nextify.js com diferentes gerenciadores de pacote:

```bash
# npm (npx)
npx create-nextify@latest my-app

# npm (create)
npm create nextify@latest my-app

# pnpm
pnpm create nextify@latest my-app

# yarn
yarn create nextify my-app

# bun
bunx create-nextify@latest my-app
```

### Iniciar ambiente local

```bash
# Acesse a pasta do projeto
cd my-app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### One-command Deploy (Cloudflare Workers)

Se seu projeto já usa o adapter Cloudflare, você pode preparar configuração + build + deploy com um único comando:

```bash
nextify deploy cloudflare
```

Esse comando cria `wrangler.toml` e `dist/_worker.js` automaticamente (quando ainda não existirem), roda o build e em seguida executa `wrangler deploy`.

### Project Structure

```
my-app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── blog/
│       └── [slug]/
│           └── page.tsx    # Dynamic route
├── api/
│   └── users/
│       └── route.ts        # API endpoint
├── middleware.ts           # Edge middleware
├── public/                 # Static assets
├── nextify.config.ts       # Configuration
└── package.json
```

<br />

## Documentation

| Resource | Description |
|----------|-------------|
| [**Architecture**](./ARCHITECTURE.md) | Technical deep-dive into framework internals |
| [**Developer Guide**](./docs/DEVELOPER_GUIDE.md) | Complete guide for building with Nextify.js |
| [**API Reference**](./docs_nextify.md) | Full API documentation |
| [**Roadmap**](./docs/ROADMAP.md) | Public roadmap and planned features |
| [**Open Benchmark Methodology**](./docs/OPEN_BENCHMARK_METHODOLOGY.md) | Reproducible comparative benchmark process |
| [**Assisted Upgrade Playbook**](./docs/ASSISTED_UPGRADE_PLAYBOOK.md) | Guided upgrade flow for breaking changes |
| [**Contributing**](./CONTRIBUTING.md) | Guidelines for contributors |
| [**Security**](./SECURITY.md) | Security policies and reporting |

<br />

## Architecture

Nextify.js é organizado como **monorepo** com pacotes especializados:

```
nextify/
├── packages/
│   ├── core/          # Routing, rendering, cache, middleware, plugins
│   ├── cli/           # Command-line interface (dev, build, start)
│   ├── build/         # Build pipeline and manifest generation
│   └── dev-server/    # Development runtime with HMR
│   ├── adapter-aws-lambda/
│   ├── adapter-cloudflare/
│   └── adapter-experimental/
├── examples/          # Reference implementations
└── docs/              # Technical documentation
```

### Rendering Strategies

| Strategy | Use Case | Cache Behavior |
|----------|----------|----------------|
| **SSG** | Static content, docs, landing pages | Build-time, immutable |
| **ISR** | Catalogs, blogs, product pages | Stale-while-revalidate |
| **SSR** | Personalized, real-time content | Per-request |
| **Edge SSR** | Low-latency global rendering | Edge POP cache |

### Request Flow

```
User Request → CDN/Edge POP → Middleware → Router → Cache Lookup
                                                        ↓
                              Response ← Render Engine ← Cache Miss
```

<br />

## Benchmarks

Performance comparison with reference applications:

| Metric | Nextify.js | Industry Baseline |
|--------|-----------|------------------|
| **Cold Start** | < 50ms | 200-500ms |
| **TTFB (SSR)** | < 100ms | 300-800ms |
| **Build Time (1000 pages)** | < 30s | 60-120s |
| **HMR Latency** | < 50ms | 100-500ms |
| **Bundle Size (minimal)** | < 50KB | 70-150KB |

> Benchmarks measured on reference applications. Results may vary based on application complexity.

Reproduce and publish the comparative report locally:

```bash
npm run benchmark:synthetic
npm run benchmark:comparative
```

<br />

## Examples

Explore production-ready examples in the [`/examples`](./examples) directory:

| Example | Description |
|---------|-------------|
| [**Blog**](./examples/blog) | Content-focused application with ISR |
| [**E-commerce Storefront**](./examples/ecommerce-storefront) | Product catalog with dynamic routing |
| [**SaaS Dashboard**](./examples/saas-dashboard) | Authenticated dashboard with SSR |
| [**Reference App**](./examples/reference-app) | Full-featured reference implementation |

<br />

## Configuration

```typescript
// nextify.config.ts
import { defineConfig } from 'nextify'

export default defineConfig({
  runtime: 'hybrid',  // 'node' | 'edge' | 'hybrid'
  
  images: {
    formats: ['avif', 'webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
  },
  
  cache: {
    defaultStrategy: 'stale-while-revalidate',
    revalidateTags: true,
  },
  
  experimental: {
    streamingSSR: true,
    smartPrefetch: true,
  },
  
  plugins: [
    ['@nextify/plugin-analytics', { provider: 'otlp' }],
  ],
})
```

<br />

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@nextify/core`](./packages/core) | ![npm](https://img.shields.io/badge/0.2.4-blue) | Core framework runtime |
| [`create-nextify`](./packages/cli) | ![npm](https://img.shields.io/badge/0.2.4-blue) | CLI para criação e bootstrap de projetos |
| [`@nextify/build`](./packages/build) | ![npm](https://img.shields.io/badge/0.2.4-blue) | Build pipeline |
| [`@nextify/dev-server`](./packages/dev-server) | ![npm](https://img.shields.io/badge/0.2.4-blue) | Development server |
| [`@nextify/adapter-aws-lambda`](./packages/adapter-aws-lambda) | ![npm](https://img.shields.io/badge/0.2.4-blue) | Adapter para AWS Lambda |
| [`@nextify/adapter-cloudflare-workers`](./packages/adapter-cloudflare) | ![npm](https://img.shields.io/badge/0.2.4-blue) | Adapter para Cloudflare Workers |

<br />

## Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Foundation** | Q2 2026 | Stable CLI, SSR/SSG/ISR, benchmarks |
| **Ecosystem** | Q3 2026 | Plugin system v1, cloud adapters, observability |
| **Scale** | Q4 2026 | Migration tools, distributed cache, metrics dashboard |
| **Enterprise** | Q1 2027 | LTS policy, security hardening, commercial support |
| **Global Adoption** | Q2 2027 | Localization, ambassador program, case studies |

See the full [**Roadmap**](./docs/ROADMAP.md) for detailed milestones.

<br />

## Contributing

We welcome contributions from the community! Please read our [**Contributing Guide**](./CONTRIBUTING.md) before submitting a pull request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/RicardoOliver/Nextify.js.git
cd Nextify.js

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm run dev` | Start development server |
| `npm run test` | Run test suite |
| `npm run lint` | Lint codebase |
| `npm run typecheck` | TypeScript type checking |
| `npm run validate` | Full validation (lint + typecheck + test) |

<br />

## Community

<table>
<tr>
<td align="center" width="33%">
<h4>Discussions</h4>
<p>Technical discussions, RFCs, and Q&A</p>
<a href="https://github.com/RicardoOliver/Nextify.js/discussions">GitHub Discussions</a>
</td>
<td align="center" width="33%">
<h4>Issues</h4>
<p>Bug reports and feature requests</p>
<a href="https://github.com/RicardoOliver/Nextify.js/issues">GitHub Issues</a>
</td>
<td align="center" width="33%">
<h4>Discord</h4>
<p>Real-time community chat</p>
<a href="#">Join Discord</a>
</td>
</tr>
</table>

<br />

## Security

For security vulnerabilities, please review our [**Security Policy**](./SECURITY.md) and report issues responsibly.

<br />

## License

Nextify.js is [MIT licensed](./LICENSE).

---

<p align="center">
  <sub>Built with care by the Nextify.js community</sub>
</p>

<p align="center">
  <a href="https://github.com/RicardoOliver/Nextify.js/stargazers">
    <img src="https://img.shields.io/github/stars/RicardoOliver/Nextify.js?style=social" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/RicardoOliver/Nextify.js/network/members">
    <img src="https://img.shields.io/github/forks/RicardoOliver/Nextify.js?style=social" alt="GitHub Forks" />
  </a>
</p>

<br/>

![Visualizações](https://views-counter.vercel.app/badge?pageId=RicardoOliver/Nextify.js)

<br/>
