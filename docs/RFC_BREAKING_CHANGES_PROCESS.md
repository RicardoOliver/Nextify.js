# Processo Formal de RFC para Breaking Changes — Nextify.js

## Escopo

Este processo é obrigatório para qualquer mudança que:

- altere APIs públicas;
- mude contrato de comportamento de runtime;
- introduza migração obrigatória para usuários existentes.

## Fluxo de RFC

1. **Abertura da RFC**
   - Criar documento a partir de `docs/templates/RFC_TEMPLATE.md`.
   - Nome recomendado: `docs/rfcs/YYYY-MM-DD-slug.md`.
2. **Review técnico**
   - Mínimo de 2 revisores mantenedores.
   - Registrar riscos, alternativas e plano de rollback.
3. **Período de comentários**
   - Janela mínima de 7 dias corridos.
   - Comentários e decisões devem ficar no próprio PR.
4. **Decisão**
   - Status: `Accepted`, `Rejected`, `Superseded` ou `Withdrawn`.
5. **Implementação controlada**
   - PR de implementação deve referenciar a RFC aprovada.
   - Release notes devem incluir seção de migração.
6. **Pós-release**
   - Coletar feedback e registrar impacto real vs. esperado.

## Critérios de aprovação

Uma RFC de breaking change só pode ser aprovada com:

- justificativa clara de negócio/técnica;
- alternativas consideradas;
- plano de migração com exemplos;
- estratégia de compatibilidade temporária quando viável;
- plano de rollback;
- definição de observabilidade para detectar regressões.

## Governança e rastreabilidade

- Toda RFC aprovada deve ser citada no `CHANGELOG.md`.
- Commits de implementação devem referenciar o ID da RFC.
- A release responsável deve apontar explicitamente para o guia de migração.


## Trilha de upgrade assistido

- Antes de implantar breaking changes, executar `npm run upgrade:assist -- <versao-alvo>`.
- O plano gerado em `artifacts/upgrades/upgrade-plan.latest.json` deve ser anexado ao PR da RFC e da implementação.
- Seguir o playbook em `docs/ASSISTED_UPGRADE_PLAYBOOK.md` para garantir rollout canary e rollback testado.
