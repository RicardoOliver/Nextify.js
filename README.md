# Nextify.js ⚡

> O framework React para times que querem velocidade de desenvolvimento, performance de produção e arquitetura extensível por padrão.

[![CI](https://github.com/nextifyjs/nextify/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nextifyjs/nextify/actions/workflows/ci.yml)


[![npm package](https://img.shields.io/npm/v/create-nextify)](https://www.npmjs.com/package/create-nextify)

[![npm status](https://img.shields.io/badge/npm-private-orange)](#)


[![license](https://img.shields.io/github/license/nextifyjs/nextify)](#)
[![Discord](https://img.shields.io/discord/000000000000000000?label=discord)](#)

Nextify.js é um framework open source inspirado no melhor ecossistema React moderno e projetado para ser **modular**, **rápido** e **amigável para contribuidores**.

## Por que Nextify.js pode virar um projeto viral?

- 🚀 **Time-to-value em minutos**: CLI para scaffold e DX focada em produtividade.
- 🧩 **Arquitetura modular real**: pacotes independentes (`core`, `cli`, `dev-server`, `build`).
- 🧠 **Performance-first**: SSR streaming, SSG, ISR e estratégia de cache inteligente.
- 🌍 **Pronto para Node + Edge**: output separado por target e adaptadores.
- 🤝 **OSS-friendly desde o dia 1**: roadmap público, governança, good first issues e templates.


## Resumo comparativo para 2026 (e como o Nextify vai superar)

| Framework | Foco Principal | Força atual | Estratégia do Nextify para superar |
|---|---|---|---|
| Astro | Conteúdo/Landing pages | Zero JS por padrão e ilhas | `Static-first + Islands + Streaming SSR` no mesmo runtime, sem trocar de framework. |
| Remix | Dashboards/Apps dinâmicos | Modelo de dados no servidor | Camada de dados unificada (`loaders/actions/cache tags`) com invalidação inteligente e observabilidade nativa. |
| SvelteKit | Alta performance | Bundle pequeno e simplicidade | Pipeline de build agressivo + splitting por rota + análise de custo de bundle em CI. |
| Qwik | Interatividade instantânea | Resumibilidade | Hidratação seletiva e progressiva orientada por prioridade de interação. |

### Diferencial do Nextify.js

Em vez de otimizar apenas um caso de uso, o Nextify vai unir os melhores conceitos em uma arquitetura única:

- **Content-first** para sites rápidos (como Astro).
- **Data-first** para apps complexos (como Remix).
- **Performance budget rígido** para frontend (como SvelteKit).
- **Interatividade progressiva** sem custo alto de hidratação (inspirado em Qwik).

> Meta: entregar um framework completo para conteúdo, SaaS e enterprise sem perder performance de classe mundial.



## Meta global: superar o padrão atual de DX no ecossistema React

Queremos que o Nextify.js seja escolhido por desenvolvedores do mundo todo não por marketing, mas por **resultado mensurável**.


### Princípios de produto (não-negociáveis, estilo big tech)

### Princípios de produto (não-negociáveis)


- **Mais rápido para construir**: setup inicial, hot reload e build incremental mais rápidos em projetos reais.
- **Mais simples de operar**: observabilidade nativa, erros acionáveis e deploy previsível em múltiplos provedores.
- **Mais aberto para evoluir**: APIs estáveis, RFC pública e arquitetura plugável para comunidade e empresas.
- **Mais seguro por padrão**: security headers, hardening de runtime e políticas claras de disclosure.

### Métricas públicas que vamos perseguir

- Tempo de `create -> first commit` em menos de 10 minutos para novos usuários.
- Cold build e rebuild incremental com benchmark público em apps SaaS, conteúdo e e-commerce.
- Tempo médio de resposta em issues de comunidade abaixo de 48h.
- Taxa de regressão de release monitorada com canary + changelog verificável.

> Se uma funcionalidade não melhora DX, performance, confiabilidade ou adoção global, ela não entra na prioridade.

## TL;DR da estratégia para escalar no GitHub

1. **Posicionamento claro**: “Next.js-like framework, com arquitetura plugável e foco em contribuição”.
2. **Documentação impecável**: onboarding de 10 minutos para usuário e contribuidor.
3. **Exemplos úteis de mercado**: SaaS, e-commerce e docs portal.
4. **Distribuição contínua**: conteúdo técnico, benchmark transparente e comunidade ativa.
5. **Release process confiável**: changelog rigoroso, semver e canary releases.

> A estratégia completa está na pasta [`docs/`](./docs), no guia de arquitetura [`ARCHITECTURE.md`](./ARCHITECTURE.md), no blueprint Big Tech [`docs/NEXTIFY_BIGTECH_BLUEPRINT.md`](./docs/NEXTIFY_BIGTECH_BLUEPRINT.md) e na estratégia competitiva [`docs/COMPETITIVE_STRATEGY_2026.md`](./docs/COMPETITIVE_STRATEGY_2026.md).

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

Roadmap por fases com entregas trimestrais e metas mensuráveis: [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Estratégia de releases

SemVer + canary + changelog verificável em [`docs/RELEASE_STRATEGY.md`](./docs/RELEASE_STRATEGY.md).

---

## Estratégia para atrair cada público

### 1) Contribuidores OSS
- Issues bem definidas e triagem semanal.
- Labels `good first issue`, `help wanted`, `needs reproduction`.
- Mentoria pública em PRs com feedback rápido (<48h).

### 2) Desenvolvedores React
- Migração simples de projetos Next.js com codemods e guias por cenário.
- Exemplos reais prontos para deploy em diferentes nuvens.
- Benchmark transparente (sem cherry-picking), com metodologia reproduzível.

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


Este é um **monorepo público** do Nextify.js para desenvolvimento colaborativo global.

Para criar um novo projeto Nextify (fluxo recomendado):

```bash
npx create-nextify@latest minha-app
```

Depois:

```bash
cd minha-app
npm install
npm run dev
```

Para contribuir no framework (este monorepo):


Este é um **monorepo público** do Nextify.js para desenvolvimento colaborativo global.

Para criar um novo projeto Nextify (fluxo recomendado):

```bash
npx create-nextify@latest minha-app
```

Depois:

```bash
cd minha-app
npm install
npm run dev
```

Para contribuir no framework (este monorepo):

```bash
git clone https://github.com/nextifyjs/nextify.git
cd nextify
npm install
npm run build
npm run dev

Atualmente, este repositório é um **monorepo privado** para desenvolvimento local (veja `"private": true` no `package.json`).

Se você quer usar o boilerplate open-source da equipe Nextify, utilize:

```bash
bun create saasfly
# ou
npx create-saasfly@latest
```

Para contribuir com este repositório localmente:

```bash
npm install
```

Para iniciar o ambiente de desenvolvimento do monorepo:


```bash
git clone https://github.com/nextifyjs/nextify.git
cd nextify
npm install
npm run build
npm run dev
```

Para testar o gerador de projeto local (`create-nextify`), execute:

```bash
npm exec create-nextify -- minha-app

```

## Comunidade

- Discussões técnicas e RFCs: GitHub Discussions.
- Bugs e features: GitHub Issues.
- Troca rápida e networking: Discord da comunidade.

Consulte o plano de comunidade em [`docs/COMMUNITY_STRATEGY.md`](./docs/COMMUNITY_STRATEGY.md).

## Licença

MIT.

![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=UNDER%20DEVELOPMENT&color=GREEN&style=for-the-badge)
