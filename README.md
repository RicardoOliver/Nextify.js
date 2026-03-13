# Nextify.js ⚡

> O framework React para times que querem velocidade de desenvolvimento, performance de produção e arquitetura extensível por padrão.

[![CI](https://img.shields.io/github/actions/workflow/status/nextifyjs/nextify/ci.yml?branch=main)](#)
[![npm version](https://img.shields.io/npm/v/nextify-monorepo)](#)
[![license](https://img.shields.io/github/license/nextifyjs/nextify)](#)
[![Discord](https://img.shields.io/discord/000000000000000000?label=discord)](#)

Nextify.js é um framework open source inspirado no melhor ecossistema React moderno e projetado para ser **modular**, **rápido** e **amigável para contribuidores**.

## Por que Nextify.js pode virar um projeto viral?

- 🚀 **Time-to-value em minutos**: CLI para scaffold e DX focada em produtividade.
- 🧩 **Arquitetura modular real**: pacotes independentes (`core`, `cli`, `dev-server`, `build`).
- 🧠 **Performance-first**: SSR streaming, SSG, ISR e estratégia de cache inteligente.
- 🌍 **Pronto para Node + Edge**: output separado por target e adaptadores.
- 🤝 **OSS-friendly desde o dia 1**: roadmap público, governança, good first issues e templates.

## TL;DR da estratégia para escalar no GitHub

1. **Posicionamento claro**: “Next.js-like framework, com arquitetura plugável e foco em contribuição”.
2. **Documentação impecável**: onboarding de 10 minutos para usuário e contribuidor.
3. **Exemplos úteis de mercado**: SaaS, e-commerce e docs portal.
4. **Distribuição contínua**: conteúdo técnico, benchmark transparente e comunidade ativa.
5. **Release process confiável**: changelog rigoroso, semver e canary releases.

> A estratégia completa está na pasta [`docs/`](./docs), no guia de arquitetura [`ARCHITECTURE.md`](./ARCHITECTURE.md) e no blueprint Big Tech [`docs/NEXTIFY_BIGTECH_BLUEPRINT.md`](./docs/NEXTIFY_BIGTECH_BLUEPRINT.md).

---

## Estrutura ideal do repositório

```txt
nextify.js/
  .github/
    ISSUE_TEMPLATE/
    workflows/
  docs/
    COMMUNITY_STRATEGY.md
    DEVELOPER_GUIDE.md
    MARKETING_STRATEGY.md
    RELEASE_STRATEGY.md
    ROADMAP.md
  examples/
    blog/
    ecommerce-storefront/
    saas-dashboard/
  packages/
    core/
    cli/
    dev-server/
    build/
  ARCHITECTURE.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  README.md
```

## Organização do código (monorepo)

- `packages/core`: roteamento, rendering, cache, middleware e plugin API.
- `packages/dev-server`: runtime de desenvolvimento e HMR.
- `packages/build`: pipeline de build e geração de manifest.
- `packages/cli`: comandos `dev`, `build`, `start` e scaffolding.

Esse layout permite evoluir partes isoladas sem gerar acoplamento excessivo.

## Arquitetura modular

- Kernel de framework no `core` com interfaces estáveis.
- Extensões por plugins (analytics, auth, image, adapters).
- Contratos explícitos entre build/runtime para facilitar contribuições.

Veja o detalhamento em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Documentação recomendada

- **Usuário**: quickstart, conceitos, deploy e troubleshooting.
- **Contribuidor**: setup local, padrões de código, fluxo de PR e labels.
- **Mantenedor**: políticas de release, governança e triagem.
- **Empresas**: adoção em produção, segurança e roadmap de estabilidade.

Comece por [`docs/DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md).

## Guia de contribuição

Leia o arquivo [`CONTRIBUTING.md`](./CONTRIBUTING.md) para:

- fluxo de branch/commit/PR,
- padrões de testes,
- labels e prioridades,
- como pegar uma `good first issue`.

## Roadmap público

Roadmap por fases com entregas trimestrais: [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Estratégia de releases

SemVer + canary + changelog verificável em [`docs/RELEASE_STRATEGY.md`](./docs/RELEASE_STRATEGY.md).

---

## Estratégia para atrair cada público

### 1) Contribuidores OSS
- Issues bem definidas e triagem semanal.
- Labels `good first issue`, `help wanted`, `needs reproduction`.
- Mentoria pública em PRs com feedback rápido (<48h).

### 2) Desenvolvedores React
- Migração simples de projetos Next.js.
- Exemplos reais prontos para deploy.
- Benchmark transparente (sem cherry-picking).

### 3) Empresas interessadas
- Política de compatibilidade e suporte LTS.
- Segurança: disclosure policy, advisories e auditoria de dependências.
- Estudos de caso com métricas de custo/performance.

### 4) Mantenedores
- Governança clara (owners por pacote).
- Rotina de release automatizada.
- Documentação operacional para evitar knowledge silos.

---

## Exemplos incluídos

- [`examples/blog`](./examples/blog): blog com SSR + rotas dinâmicas.
- [`examples/saas-dashboard`](./examples/saas-dashboard): autenticação e painel.
- [`examples/ecommerce-storefront`](./examples/ecommerce-storefront): catálogo e página de produto.

## Como começar

Instale o framework publicado no npm:

```bash
npm install nextify-monorepo
```

Crie um arquivo `index.js`:

```js
const nextify = require("nextify-monorepo");

nextify.start({
  port: 3000,
});
```

Depois execute:

```bash
node index.js
```

ou:

```bash
npm run dev
```

> Queremos evoluir para um fluxo com CLI (`create-nextify-app`) para onboarding em uma linha, no estilo `npx create-nextify-app minha-app`.

## Comunidade

- Discussões técnicas e RFCs: GitHub Discussions.
- Bugs e features: GitHub Issues.
- Troca rápida e networking: Discord da comunidade.

Consulte o plano de comunidade em [`docs/COMMUNITY_STRATEGY.md`](./docs/COMMUNITY_STRATEGY.md).

## Licença

MIT.
