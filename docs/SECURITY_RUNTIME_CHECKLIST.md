# Checklist de Segurança Runtime (OWASP) — Nextify.js

> Aplicação: API routes, middleware e extensões via plugin system.
> 
> Obrigatório: anexar este checklist preenchido em **toda release minor**.

## Como usar na release

1. Copiar este checklist para as release notes.
2. Marcar cada item com evidência (PR, teste, log, dashboard).
3. Se houver exceção, documentar risco residual, owner e prazo de correção.

---

## A) API routes (OWASP API Security Top 10)

- [ ] **API1 — BOLA**: validação de autorização por recurso (não confiar em IDs enviados pelo cliente).
- [ ] **API2 — Broken Authentication**: tokens com expiração/rotação e validação de assinatura.
- [ ] **API3 — Excessive Data Exposure**: resposta apenas com campos necessários (sem dados sensíveis).
- [ ] **API4 — Lack of Resources & Rate Limiting**: limites por IP/chave e timeouts definidos.
- [ ] **API5 — Broken Function Level Authorization**: checagem explícita por ação/role.
- [ ] **API7 — Security Misconfiguration**: headers de segurança ativos e ambiente sem segredos hardcoded.
- [ ] **API8 — Injection**: validação/sanitização de entrada e uso de APIs seguras de acesso a dados.
- [ ] **API10 — Unsafe Consumption of APIs**: validação de respostas upstream e timeouts/retries controlados.

## B) Middleware

- [ ] CSP configurado por perfil (`development` report-only; `balanced|strict` enforce por padrão).
- [ ] `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy` ativos.
- [ ] Fluxo de erro evita leak de stack trace em produção.
- [ ] Middleware idempotente e sem chamar `next()` múltiplas vezes.
- [ ] Correlação de request-id em logs para investigação de incidentes.

## C) Plugin system (superfície de ataque)

- [ ] Plugins com nome único, não vazio e rastreável em logs.
- [ ] Hooks permitidos por contrato fechado (allowlist), sem nomes arbitrários.
- [ ] Limite de hooks por plugin para reduzir risco de abuso.
- [ ] Limite global de plugins carregados por runtime.
- [ ] Documentação de capacidade: plugin não recebe acesso implícito a segredos/processo.

## D) Operação e resposta

- [ ] Simulado de incidente executado no último ciclo (meta MTTR < 2h).
- [ ] Taxa de regressão por release monitorada (meta < 5%).
- [ ] Release com notas de migração quando aplicável (meta 100%).

## Evidências da release

- Versão:
- Data:
- Responsáveis:
- Links (PRs/tests/dashboards):
- Exceções e plano de ação:
