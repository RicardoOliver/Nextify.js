# Internal Audit Report

- Generated at: 2026-03-22T16:21:39.364Z
- Score: **85.0%** (85/100)
- Maturity: **STRONG**

## Category Breakdown

- governance: 100.0% (8/8)
- security: 100.0% (30/30)
- reliability: 100.0% (20/20)
- engineering: 100.0% (27/27)
- release: 0.0% (0/15)

## Detailed Checks

- [x] **sbom_freshness** (10/10) — SBOM atualizado em 2026-03-22T15:32:47.740Z
- [x] **traceability_freshness** (10/10) — Matriz de rastreabilidade atualizada em 2026-03-22T15:32:47.740Z
- [ ] **workspace_version_alignment** (0/8) — 7 workspace(s) com versão desalinhada em relação ao root (0.1.23).
- [x] **test_density** (15/15) — Densidade aproximada de testes: 70.8% (17 testes / 24 arquivos TS).
- [x] **reliability_report_presence** (10/10) — Último report de confiabilidade encontrado: 2026-03.md.
- [x] **roadmap_current_year** (8/8) — Roadmap validado para horizonte 2026+.
- [x] **security_checklist_depth** (10/10) — Checklist de segurança contém ao menos 10 itens acionáveis.
- [x] **performance_budget_defined** (10/10) — Performance budget com 5 categoria(s) definida(s).
- [x] **ci_quality_gates** (12/12) — CI possui gates de lint, test e typecheck.
- [ ] **changelog_semver_signal** (0/7) — CHANGELOG indica trilha de releases semânticas na série 0.1.x.

## Priority Improvements

- Eliminar drift de versão nos workspaces com release automation por changesets.
- Incluir validação automática de SLO no CI (ex.: limiar de latency p95 em integração).
- Adicionar assinatura criptográfica do SBOM para supply-chain hardening.