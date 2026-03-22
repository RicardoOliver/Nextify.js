# Metodologia Aberta de Benchmark Comparativo

## Objetivo

Publicar benchmark comparativo reproduzível entre o desempenho atual do Nextify e um baseline público versionado.

## Artefatos

- Baseline versionado: `artifacts/benchmarks/synthetic-benchmark.baseline.v1.json`
- Execução atual: `artifacts/benchmarks/synthetic-benchmark.latest.json`
- Comparativo publicado: `artifacts/benchmarks/comparative-benchmark.latest.json`

## Procedimento reproduzível

```bash
npm ci
npm run benchmark:synthetic
npm run benchmark:comparative
```

## Hipóteses e limites

- O benchmark é sintético, com cenários determinísticos para reduzir ruído.
- O comparativo usa métricas p50/p95 por cenário (`ssr_reference`, `api_health`, `build_validation`).
- Resultados devem ser interpretados junto com SLOs em `docs/SLOS_AND_PERFORMANCE_BUDGET.md`.

## Governança

- Mudanças de baseline exigem revisão explícita via PR.
- Regressões acima do gate devem bloquear promoção de release até justificativa técnica.
- O relatório comparativo deve ser anexado em release candidate para auditoria externa.
