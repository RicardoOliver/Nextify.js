# Estratégia de Releases

## Versionamento

- SemVer rigoroso.
- `major`: mudanças breaking.
- `minor`: features compatíveis.
- `patch`: correções e melhorias sem quebra.

## Canais

- `canary`: validação antecipada da comunidade.
- `latest`: versão estável recomendada.

## Pipeline de release

### 1) Canary automatizado (`.github/workflows/release-canary.yml`)

- Gatilho por branch dedicada (`release/canary`) ou tags `canary-v*`.
- Geração automática de changelog rastreável em `CHANGELOG.md` com:
  - hash de commit;
  - branch/tag de origem;
  - autor das mudanças;
  - responsável pelo publish.
- Publicação de todos os pacotes da monorepo no npm com `dist-tag` `canary`.
- Criação de prerelease no GitHub com o mesmo conteúdo do changelog da execução.

### 2) Promoção manual para latest (`.github/workflows/release-promote.yml`)

- Gatilho manual com `workflow_dispatch`.
- Bloqueio por checklist obrigatório:
  1. testes e benchmarks;
  2. changelog revisado;
  3. migração validada;
  4. riscos documentados.
- Campo obrigatório de assinatura de responsáveis (`owners_signoff`).
- Promoção de `dist-tag` no npm para `latest` em todos os pacotes.
- Publicação de release estável no GitHub com registro de origem canary e assinaturas.

## Template de release notes

- Arquivo padrão: `.github/release-notes-template.md`.
- Seções obrigatórias:
  - breaking changes;
  - migração;
  - riscos;
  - assinatura de responsáveis.

## Qualidade de release

- Nenhuma release sem documentação atualizada.
- Nenhuma release major sem codemod/migração assistida.
- Toda release deve possuir changelog rastreável e assinatura de responsáveis.
