# Nextify.js ⚡

> Framework React open source, modular e focado em produtividade, performance e colaboração.

[![CI](https://github.com/nextifyjs/nextify/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nextifyjs/nextify/actions/workflows/ci.yml)
[![npm package](https://img.shields.io/npm/v/create-nextify)](https://www.npmjs.com/package/create-nextify)
[![license](https://img.shields.io/github/license/nextifyjs/nextify)](#)

Nextify.js é um framework desenvolvido para criação de aplicações React com uma arquitetura modular, experiência de desenvolvimento eficiente e base sólida para crescimento em comunidade.

## O que é o Nextify.js

O projeto é organizado como um monorepo e separado em pacotes para facilitar evolução, manutenção e contribuição.

### Pacotes principais

- `packages/core`: roteamento, rendering, cache, middleware e API de plugins.
- `packages/dev-server`: runtime de desenvolvimento e HMR.
- `packages/build`: pipeline de build e geração de manifest.
- `packages/cli`: comandos de linha (`dev`, `build`, `start`) e scaffolding.

## Estrutura do repositório

```txt
nextify.js/
  .github/
    ISSUE_TEMPLATE/
    workflows/
  docs/
    COMMUNITY_STRATEGY.md
    DEVELOPER_GUIDE.md
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

## Como usar o Nextify.js

Para criar um novo projeto com Nextify.js:

```bash
npx create-nextify@latest minha-app
cd minha-app
npm install
npm run dev
```

## Como acessar e rodar este repositório

Se você quer contribuir diretamente no framework (este monorepo):

```bash
git clone https://github.com/nextifyjs/nextify.git
cd nextify
npm install
npm run build
npm run dev
```

Para testar o gerador de projeto local (`create-nextify`) dentro do monorepo:

```bash
npm exec create-nextify -- minha-app
```

## Documentação recomendada

- Arquitetura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Guia de contribuição: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Guia de desenvolvimento: [`docs/DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md)
- Roadmap: [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- Estratégia de releases: [`docs/RELEASE_STRATEGY.md`](./docs/RELEASE_STRATEGY.md)
- Comunidade: [`docs/COMMUNITY_STRATEGY.md`](./docs/COMMUNITY_STRATEGY.md)

## Comunidade

- Discussões técnicas e RFCs: GitHub Discussions.
- Bugs e solicitações: GitHub Issues.
- Comunicação rápida: Discord da comunidade.

## Licença

MIT.
![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=UNDER%20DEVELOPMENT&color=GREEN&style=for-the-badge)
