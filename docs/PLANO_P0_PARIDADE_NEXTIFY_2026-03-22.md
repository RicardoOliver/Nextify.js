# Plano P0 — Paridade de Plataforma Nextify.js

**Data:** 2026-03-22.  
**Objetivo:** transformar os quatro gaps críticos em entregas executáveis, mensuráveis e auditáveis por release.

## Escopo obrigatório (deve ser criado)

1. **Paridade de roteamento moderno**
   - layouts aninhados;
   - boundaries por segmento (`loading`/`error`/`not-found`);
   - Metadata API por rota/layout;
   - route groups e convenções avançadas de arquivo.

2. **Pipeline de rendering/dados realmente integrada**
   - semântica consistente entre dev e produção para SSR/SSG/ISR;
   - revalidação determinística (tempo, tag e evento) com suporte distribuído.

3. **Build incremental em larga escala**
   - cache persistente de artefatos;
   - rebuild previsível para bases grandes com invalidação por grafo de dependências.

4. **Confiabilidade de release em nível enterprise**
   - CI monorepo continuamente verde como critério de merge;
   - meta de regressão crítica `< 1` por release estável.

---

## Entregáveis por trilha

### Trilha A — Roteamento moderno

**Entregáveis técnicos**
- Manifesto de rotas com suporte explícito a layout tree e boundaries por segmento.
- Resolução de `route groups` (pastas agrupadoras sem impacto em URL pública).
- Contrato de `metadata` com merge hierárquico (layout pai → layout filho → página).
- Convenções oficiais: `layout`, `page`, `loading`, `error`, `not-found`.

**Critérios de aceite**
- Testes cobrindo composição de layouts aninhados em 3 níveis.
- Testes de fallback e recuperação de erro por segmento.
- Geração de metadata final determinística para a mesma árvore de rotas.

### Trilha B — Rendering e dados integrados

**Entregáveis técnicos**
- Única engine de execução para dev/prod, com flags de ambiente apenas para otimizações.
- Contrato unificado de cache/revalidate entre loaders, SSR, SSG e ISR.
- Backend de revalidação distribuída (Redis/KV) com semântica idempotente.

**Critérios de aceite**
- Snapshot de resposta idêntica entre `dev` e `start` (exceto headers não determinísticos).
- Testes de revalidação por tempo, tag e evento com comportamento reproduzível.
- Telemetria de hit/miss/revalidate por rota.

### Trilha C — Build incremental em larga escala

**Entregáveis técnicos**
- Cache local persistente por hash de entrada + versão de compilador.
- Camada opcional de cache remoto para CI distribuída.
- Invalidação por grafo (mudanças localizadas não recompilam todo o workspace).

**Critérios de aceite**
- Redução do tempo de rebuild p95 em app de referência com > 2k módulos.
- Rebuild consecutivo com desvio padrão controlado (previsibilidade).
- Relatório por módulo: tempo, cache hit e motivo de invalidação.

### Trilha D — Confiabilidade de release enterprise

**Entregáveis técnicos**
- Pipeline CI monorepo com gates obrigatórios (`lint`, `test`, `build`, `performance-budget`).
- Política de branch protegida com bloqueio em falha de suite crítica.
- Dashboard de qualidade por release (defeitos críticos, MTTR, taxa de rollback).

**Critérios de aceite**
- Janela contínua mínima de 30 dias com CI verde > 95%.
- Zero release estável sem checklist de regressão concluído.
- Indicador trimestral de regressão crítica `< 1` por release estável.

---

## Fases de execução (90 dias)

### 0–30 dias
- Fechar contrato de rotas/layouts/boundaries e publicar RFC técnica.
- Implementar infraestrutura de cache persistente local de build.
- Definir SLO operacional de CI e baseline de regressões.

### 31–60 dias
- Entregar route groups + metadata API + boundaries por segmento.
- Unificar semântica de revalidação entre dev/prod e ativar backend distribuído opcional.
- Publicar métricas de rebuild incremental em app de referência.

### 61–90 dias
- Endurecer gates de release com política enterprise e auditoria de regressão.
- Consolidar dashboard de confiabilidade por release.
- Publicar relatório de paridade P0 com evidências de testes e benchmark.

## Métricas oficiais de sucesso

- **Routing parity coverage:** > 90% dos cenários-alvo cobertos por testes de integração.
- **Dev/Prod semantic drift:** < 2% de divergência permitida em suíte de snapshots.
- **Incremental rebuild p95:** queda mínima de 40% vs baseline inicial.
- **Critical regression rate:** `< 1` por release estável em janela trimestral.

## Riscos e mitigação

- **Risco:** aumento de complexidade da árvore de roteamento.  
  **Mitigação:** contratos estritos + testes de snapshot de manifesto.

- **Risco:** inconsistência de cache distribuído entre provedores.  
  **Mitigação:** interface única de storage + suíte de conformidade por adaptador.

- **Risco:** CI lenta ao adicionar gates.  
  **Mitigação:** particionamento por matriz e cache remoto de build/test.
