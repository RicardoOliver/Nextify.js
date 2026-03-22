# SLOs e Budget de Performance Obrigatório

Este documento define os SLOs mínimos de build/runtime do Nextify.js e como o budget de performance é aplicado como *quality gate* obrigatório no CI.

## 1) SLOs obrigatórios

### 1.1 Build reliability

- **SLO-BUILD-ERROR**: taxa de falha de build em `main` <= **2%** por janela móvel de 30 dias.
- **SLO-BUILD-LATENCY-P95**: tempo p95 do job de validação (`lint + typecheck + test + build`) <= **12 minutos**.
- **SLO-BUILD-STABILITY**: sucesso das execuções de CI em PR >= **95%** (excluindo falhas por infraestrutura externa).

### 1.2 Runtime reliability (reference app + ambientes de produção)

- **SLO-RUNTIME-ERROR**: taxa de erro HTTP 5xx <= **1%** por rota crítica.
- **SLO-RUNTIME-LATENCY-P95**: latência p95 <= **300ms** para rotas SSR e <= **120ms** para API de saúde/diagnóstico.
- **SLO-RUNTIME-AVAILABILITY**: disponibilidade mensal >= **99,5%**.

## 2) Error budgets

Cada SLO possui um budget mensal para controlar degradações:

- Build reliability: até **14h24min** de indisponibilidade/degradação equivalente por mês.
- Runtime availability 99,5%: até **3h36min** de indisponibilidade mensal.
- Runtime error-rate: consumo de budget quando 5xx > 1% em rotas críticas.

Se o budget mensal for esgotado, novas mudanças não críticas devem ser pausadas até a recuperação dos indicadores.

## 3) Budget de performance obrigatório em CI

O pacote `@nextify/build` aplica budget de JavaScript no build:

- **Máximo por asset JS**: 170KB.
- **Máximo total JS no build**: 350KB.
- **Comportamento**: quando um limite é excedido, o build falha e o CI bloqueia merge/release.

Esse gate existe para evitar regressões críticas de bundle size antes de produção.

## 4) Relatório mensal público de qualidade/reliability

Publicamos o relatório mensal em `docs/reliability-reports/` com:

- Status de cumprimento de SLOs de build e runtime.
- Consumo de error budget do mês.
- Incidentes relevantes e ações corretivas.
- Tendência vs. mês anterior e riscos para o próximo ciclo.

Template padrão: `docs/reliability-reports/REPORT_TEMPLATE.md`.

## 5) Benchmark sintético versionado (PR + release candidates)

- Thresholds de latência ficam versionados em `artifacts/benchmarks/thresholds.synthetic.v1.json` com limites por cenário (p50/p95).
- O script `npm run benchmark:synthetic` executa cenários sintéticos reprodutíveis e gera o relatório em `artifacts/benchmarks/synthetic-benchmark.latest.json`.
- O gate roda automaticamente no workflow de PR (`.github/workflows/ci.yml`) e no fluxo de release candidate (`.github/workflows/release-canary.yml`).
- Qualquer regressão acima dos thresholds definidos bloqueia merge/publicação canary até ajuste de performance ou revisão explícita da versão de thresholds.



## 6) Benchmark comparativo com metodologia aberta

- Executar `npm run benchmark:comparative` após o benchmark sintético para gerar `artifacts/benchmarks/comparative-benchmark.latest.json`.
- A metodologia aberta e reproduzível está em `docs/OPEN_BENCHMARK_METHODOLOGY.md` com pré-requisitos, comandos e limitações declaradas.
- O relatório comparativo deve acompanhar release candidates para validação externa.
