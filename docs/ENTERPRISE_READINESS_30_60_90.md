# Plano de Prontidão Enterprise (30/60/90 dias) — Nextify.js

> Objetivo: elevar o Nextify.js de baseline técnico para adoção empresarial com previsibilidade de entrega, segurança operacional e confiança de release.

## Princípios de priorização

1. **Reduzir risco de produção primeiro** (quebra, regressão, incidente de segurança).
2. **Aumentar velocidade com qualidade** (CI, testes e padrões automáticos).
3. **Criar governança de release** (versionamento, canary, rollback, comunicação).

## Meta ao final de 90 dias

- CI obrigatório com gates de qualidade por pacote.
- Pirâmide mínima de testes (unit, integração e smoke E2E).
- Baseline de segurança (SAST, dependências, headers, disclosure).
- Pipeline de release com changelog, canary e checklist de promoção para `latest`.
- Pacote inicial de documentação enterprise (compatibilidade, suporte, runbook de incidentes).

## FAQ rápido (sobre "Enterprise Readiness")

### "O desenvolvimento vai ser automático?"

**Não.** O plano não significa que o projeto vai se desenvolver sozinho.

"Enterprise Readiness" é um **nível de maturidade operacional e de engenharia**:
- processos claros para construir, testar, revisar e publicar;
- automações de CI/CD para reduzir erro humano;
- critérios objetivos para aprovar releases;
- segurança, observabilidade e governança para uso em empresas.

Ou seja: há automação de partes do fluxo (testes, checks, release gates), mas a evolução do produto continua sendo conduzida pelo time mantenedor.

### Então qual é o objetivo prático deste documento?

Transformar a estratégia em **execução verificável** em 30/60/90 dias, para que empresas consigam adotar o framework com previsibilidade de qualidade, risco e suporte.

---

## 0–30 dias — Fundação de Confiabilidade (impacto mais alto)

### 1) CI obrigatório e visível

**Entregáveis**
- Workflow GitHub Actions com jobs para:
  - `install`
  - `build` por workspace
  - `typecheck`
  - `test`
  - `lint`
- Branch protection: merge só com checks verdes.
- Badge real de CI no README apontando para workflow existente.

**Critério de aceite**
- Todo PR executa pipeline completa.
- Nenhum merge sem aprovação + CI verde.

### 2) Testes mínimos por pacote (padrão inicial)

**Entregáveis**
- Framework de testes (Vitest/Jest) padronizado no monorepo.
- `@nextify/core`
  - Unitários para `fileRouter`, `taggedCache`, `composeMiddleware`.
  - Integração para `executeLoader` (cache hit/miss/invalidate tags).
- `@nextify/build`
  - Teste para avaliação de budget (pass/fail/violations).
- `@nextify/cli`
  - Smoke test de comandos `create`, `build`.

**Critério de aceite**
- Cobertura mínima inicial: **60% linhas** no `core`.
- Falha de teste bloqueia merge.

### 3) Higiene de qualidade e padronização

**Entregáveis**
- ESLint + Prettier + scripts de validação no root.
- Convenções de commit (Conventional Commits) com validação automática.
- CODEOWNERS por pacote (core/cli/build/dev-server).

**Critério de aceite**
- PR sem formatação/lint válidos não passa.

### 4) Segurança baseline (rápido ganho)

**Entregáveis**
- `SECURITY.md` com política de disclosure e SLA.
- Auditoria de dependências no CI (`npm audit` com política definida).
- Dependency update bot (Renovate/Dependabot).

**Critério de aceite**
- Vulnerabilidades críticas/bloqueantes impedem release.

**KPIs (dia 30)**
- Lead time PR -> merge < 48h (média).
- Taxa de sucesso CI > 85%.
- 0 merges sem testes.

---

## 31–60 dias — Maturidade de Produto Operável

### 1) Testes de integração ponta-a-ponta

**Entregáveis**
- Projeto de exemplo “reference app” para validar fluxo real:
  - SSR streaming
  - API routes
  - middleware/security headers
  - data runtime (cache tags)
- Smoke E2E em CI (Playwright ou similar).

**Critério de aceite**
- Cenários críticos executando automaticamente em PR e release.

### 2) Pipeline de release com canary

**Entregáveis**
- Workflow de release:
  - geração automática de changelog
  - publish `canary` por tag/branch dedicada
  - promoção manual para `latest` com checklist
- Template de release notes (breaking changes, migração, riscos).

**Critério de aceite**
- Toda release tem changelog rastreável e assinatura de responsáveis.

### 3) Observabilidade mínima para runtime

**Entregáveis**
- Logging estruturado com correlação por request-id.
- Métricas básicas por rota (latência, erro, throughput).
- Guia de troubleshooting para falhas comuns.

**Critério de aceite**
- Erros de produção reproduzíveis com evidência de logs/métricas.

### 4) Hardening de segurança no runtime

**Entregáveis**
- Evolução de CSP (modo report-only -> enforce por perfil).
- Checklist OWASP para API routes/middleware.
- Revisão de superfície de plugin system (limites e contrato).

**Critério de aceite**
- Checklist de segurança anexado a cada release minor.

**KPIs (dia 60)**
- MTTR alvo < 2h em incidentes simulados.
- Taxa de regressão release < 5%.
- 100% de releases com notas de migração quando aplicável.

---

## 61–90 dias — Enterprise Ready (adoção em empresa)

### 1) Contrato de estabilidade e suporte

**Entregáveis**
- Política de compatibilidade (Node/React/OS/Cloud).
- Definição de canal LTS + janela de suporte.
- Matriz de suporte documentada por versão.

**Critério de aceite**
- Empresa consegue planejar upgrade sem surpresa de quebra.

### 2) Compliance e governança

**Entregáveis**
- Runbook de incidentes (sev levels, comunicação, responsabilidades).
- SBOM e rastreabilidade de dependências para auditoria.
- Processo formal de RFC para mudanças breaking.

**Critério de aceite**
- Auditoria interna básica executável por terceiros.

### 3) SLOs e budgets obrigatórios

**Entregáveis**
- SLOs de build/runtime (ex.: erro, latência p95, estabilidade).
- Budget de performance obrigatório em CI (falha com regressão crítica).
- Relatório mensal de qualidade/reliability público para comunidade.

**Critério de aceite**
- Regressões críticas detectadas antes de chegar em produção.

### 4) Go-to-market técnico para empresas

**Entregáveis**
- “Enterprise Adoption Guide” com:
  - arquitetura recomendada
  - segurança
  - rollout progressivo
  - rollback
- 1 estudo de caso interno (PoC real com métricas antes/depois).

**Critério de aceite**
- Time de engenharia consegue aprovar piloto com evidência técnica.

**KPIs (dia 90)**
- Change failure rate < 10%.
- Regressões críticas por release estável <= 1.
- 90% dos PRs com ciclo completo de qualidade (lint + test + typecheck + build).

---

## Backlog priorizado (impacto x esforço)

### P0 (fazer já)
1. CI com gates obrigatórios.
2. Script de testes no root + testes mínimos do `core`.
3. `SECURITY.md` + audit de dependências no CI.
4. Release canary com changelog automatizado.

### P1 (próxima onda)
1. E2E de cenários críticos.
2. Logging estruturado + métricas por rota.
3. Política de compatibilidade e LTS.

### P2 (escala enterprise)
1. SBOM e runbook de incidentes.
2. SLO formal + relatórios públicos mensais.
3. Guia de adoção enterprise + case técnico.

---

## Riscos e mitigação

- **Risco:** aumentar burocracia e reduzir velocidade de contribuição.
  - **Mitigação:** automação forte no CI + templates + documentação curta e objetiva.

- **Risco:** cobertura de testes crescer devagar por falta de baseline.
  - **Mitigação:** meta incremental por pacote, começando no `core`.

- **Risco:** release canary sem feedback real.
  - **Mitigação:** programa de early adopters e janela de validação antes de promover `latest`.

---

## Checklist de saída (90 dias)

- [ ] CI obrigatório com branch protection.
- [ ] Testes unit/integration/E2E para cenários críticos.
- [ ] Security baseline e processo de disclosure ativo.
- [ ] Release process canary -> latest com rollback documentado.
- [ ] Política de compatibilidade + LTS publicada.
- [ ] Runbook de incidentes e SLOs definidos.
- [ ] Guia de adoção enterprise publicado.
