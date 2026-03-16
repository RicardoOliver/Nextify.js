<p align="center">
  <img src="https://img.shields.io/badge/Nextify.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Nextify.js" />
</p>

<h1 align="center">Nextify.js</h1>

<p align="center">
  <strong>The modular React framework for performance-critical applications</strong>
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

**Nextify.js** is a next-generation React framework designed for teams building performance-critical, scalable web applications. Built with a modular architecture, it delivers exceptional developer experience while maintaining enterprise-grade reliability.

```bash
npx create-nextify@latest my-app
```

<br />

## Features

<table>
<tr>
<td width="50%">

### Core Capabilities

- **File-based Routing** — Intuitive routing with dynamic segments
- **Hybrid Rendering** — SSR, SSG, ISR in a unified engine
- **Streaming SSR** — React 18+ with Suspense boundaries
- **Edge Runtime** — Execute at the edge for minimal latency
- **Smart Caching** — Multi-layer cache with tag-based invalidation
- **API Routes** — Built-in serverless API endpoints

</td>
<td width="50%">

### Developer Experience

- **Ultra-fast Dev Server** — Millisecond startup with HMR
- **TypeScript First** — Full type safety out of the box
- **Plugin System** — Extensible architecture for customization
- **Zero Config** — Sensible defaults, progressive configuration
- **Built-in Observability** — Traces, logs, and metrics
- **Error Overlay** — Rich debugging with source maps

</td>
</tr>
</table>

<br />

## Quick Start

### Create a New Project

```bash
# Create a new Nextify.js application
npx create-nextify@latest my-app

# Navigate to project directory
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

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
| [**Contributing**](./CONTRIBUTING.md) | Guidelines for contributors |
| [**Security**](./SECURITY.md) | Security policies and reporting |

<br />

## Architecture

Nextify.js is organized as a **monorepo** with specialized packages for maximum modularity:

```
nextify/
├── packages/
│   ├── core/          # Routing, rendering, cache, middleware, plugins
│   ├── cli/           # Command-line interface (dev, build, start)
│   ├── build/         # Build pipeline and manifest generation
│   └── dev-server/    # Development runtime with HMR
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
| [`@nextify/core`](./packages/core) | ![npm](https://img.shields.io/badge/0.1.0-blue) | Core framework runtime |
| [`@nextify/cli`](./packages/cli) | ![npm](https://img.shields.io/badge/0.1.0-blue) | Command-line interface |
| [`@nextify/build`](./packages/build) | ![npm](https://img.shields.io/badge/0.1.0-blue) | Build pipeline |
| [`@nextify/dev-server`](./packages/dev-server) | ![npm](https://img.shields.io/badge/0.1.0-blue) | Development server |

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
