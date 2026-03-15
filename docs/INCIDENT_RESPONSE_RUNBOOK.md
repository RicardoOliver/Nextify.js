# Runbook de Resposta a Incidentes — Nextify.js

> Objetivo: padronizar severidade, comunicação e responsabilidades para reduzir MTTR e garantir rastreabilidade durante incidentes.

## 1) Classificação de severidade

| Nível | Definição | Exemplo | SLA de resposta | SLA de atualização |
|---|---|---|---|---|
| SEV-1 | Indisponibilidade total, risco alto de segurança ou perda de dados em produção | Queda total de API, vazamento de segredo ativo | até 15 min | a cada 30 min |
| SEV-2 | Degradação relevante com impacto em clientes, sem indisponibilidade total | Aumento extremo de latência, erro em rotas críticas | até 30 min | a cada 60 min |
| SEV-3 | Falha parcial com workaround aceitável | Bug em endpoint secundário | até 4 h | a cada 1 dia útil |
| SEV-4 | Incidente menor, sem impacto imediato em operação | Alerta falso-positivo, falha cosmética | até 1 dia útil | conforme combinado |

## 2) Papéis e responsabilidades

- **Incident Commander (IC):** coordena decisão, escopo e priorização.
- **Owner técnico:** executa mitigação e correção técnica.
- **Comms lead:** centraliza comunicação interna/externa e status page.
- **Scribe:** registra linha do tempo (timeline), decisões e evidências.

### Matriz RACI (resumo)

| Atividade | IC | Owner técnico | Comms lead | Scribe |
|---|---|---|---|---|
| Classificar severidade | A | R | C | C |
| Mitigar impacto | C | A/R | I | C |
| Atualizar stakeholders | C | C | A/R | I |
| Registrar timeline | I | I | I | A/R |
| Conduzir postmortem | A | R | C | R |

## 3) Fluxo operacional

1. **Detecção e triagem:** identificar sintoma, escopo e possível causa.
2. **Declaração de incidente:** abrir canal dedicado (`#inc-YYYYMMDD-<tema>`) e definir IC.
3. **Contenção imediata:** rollback, feature flag, rate limit ou bloqueio temporário.
4. **Comunicação inicial:** enviar atualização em até 15 min para SEV-1/2.
5. **Correção e validação:** aplicar fix, validar com logs/métricas/testes.
6. **Encerramento:** confirmar estabilidade por janela mínima (30–60 min).
7. **Postmortem:** publicar em até 5 dias úteis com ações corretivas.

## 4) Playbook de comunicação

### Template de atualização inicial

- Incidente: `<id/título>`
- Severidade: `<SEV-X>`
- Início (UTC): `<timestamp>`
- Impacto atual: `<descrição>`
- Ação em andamento: `<mitigação>`
- Próxima atualização: `<timestamp>`

### Canais por público

- **Interno (engenharia):** canal de incidente e issue/PR vinculados.
- **Stakeholders internos:** resumo executivo periódico.
- **Externo (quando aplicável):** status page + release notes de correção.

## 5) Evidências mínimas para auditoria

- Timeline com horário UTC e decisões.
- PR/commit de mitigação e fix definitivo.
- Evidência de validação (teste, log, métrica, dashboard).
- Postmortem com causa raiz, impacto e ações com owner + prazo.
