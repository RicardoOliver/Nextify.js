# Developer Guide — Nextify.js

## 1. Visão de arquitetura por pacote

- `@nextify/core`: router, render engine, cache, middleware, plugin API.
- `@nextify/dev-server`: servidor dev e integração com HMR.
- `@nextify/build`: empacotamento, manifests e targets.
- `@nextify/cli`: experiência de uso e comandos de desenvolvimento.

## 2. Organização interna sugerida

```txt
packages/core/src/
  routing/
  rendering/
  cache/
  data/
  middleware/
  plugins/
  rendering/islands.ts
```

## 3. Princípios de design

1. Interfaces pequenas e explícitas.
2. Testes por comportamento, não por implementação.
3. Compatibilidade progressiva com ecossistema React.
4. Extensibilidade por plugins em vez de flags internas.

## 4. Como propor mudanças grandes

- Abra uma RFC (`rfc` label).
- Descreva contexto, alternativas e riscos.
- Aguarde consenso mínimo antes de codar.

## 5. Qualidade e testes

- Unitários por pacote.
- Integração para fluxo de renderização e roteamento.
- E2E para cenários críticos: SSR, API routes e middleware.

## 6. DX para contribuidores

- Scripts previsíveis de lint/test/build.
- Erros com mensagens acionáveis.
- Issues com passos de reprodução obrigatórios.


## 7. Capacidades já implementadas (baseline técnico)

- **Data runtime com cache por tags** (`defineLoader`, `defineAction`, `executeLoader`, `invalidateDataTags`).
- **Rendering com islands** (`defineIsland`, `renderIslandShell`, `getIslandHydrationScript`).
- **Performance budget no build** com relatório em `dist/performance-budget.json`.

Esses blocos formam a base para evoluir o Nextify para um framework de nível enterprise com DX e performance mensuráveis.
