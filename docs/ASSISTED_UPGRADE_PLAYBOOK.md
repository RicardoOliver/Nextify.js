# Trilha de Upgrade Assistido para Breaking Changes

## Objetivo

Padronizar upgrades com risco de *breaking changes* através de um fluxo assistido, rastreável e com rollback explícito.

## Como executar

```bash
npm run upgrade:assist -- 0.2.0
```

O comando gera `artifacts/upgrades/upgrade-plan.latest.json` com fases, critérios e comandos obrigatórios.

## Fases obrigatórias

1. **Pré-check de compatibilidade**
   - Rodar validações de qualidade (`npm run validate`).
   - Gerar SBOM + trilha de proveniência (`npm run sbom:generate`).
2. **Review de breaking changes**
   - Aplicar processo formal em `docs/RFC_BREAKING_CHANGES_PROCESS.md`.
   - Inventariar APIs impactadas e plano de mitigação para consumidores.
3. **Canary assistido**
   - Executar benchmark sintético e gate de regressão.
   - Validar SLOs p95 de runtime antes da promoção.
4. **Promoção controlada**
   - Fechar auditoria interna e painel de saúde de engenharia.
   - Registrar resultado no changelog/release notes.

## Regras de rollback

- Todo upgrade classificado como risco **high** deve ter rollback testado em staging.
- O rollback precisa estar definido em RFC antes de iniciar canary.
- Incidentes no canary bloqueiam promoção automática.

## Entregáveis por upgrade

- `artifacts/upgrades/upgrade-plan.latest.json`
- RFC aprovada (quando aplicável)
- Evidência de benchmark comparativo
- Registro de decisão no changelog
