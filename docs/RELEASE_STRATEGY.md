# Estratégia de Releases

## Versionamento

- SemVer rigoroso.
- `major`: mudanças breaking.
- `minor`: features compatíveis.
- `patch`: correções e melhorias sem quebra.

## Canais

- `canary`: validação antecipada da comunidade.
- `latest`: versão estável recomendada.

## Cadência

- Patch semanal (se necessário).
- Minor mensal.
- Major quando maturidade e migração estiverem claras.

## Checklist de release

1. Testes e benchmarks aprovados.
2. Changelog revisado.
3. Notas de migração para breaking changes.
4. Comunicação em múltiplos canais.

## Qualidade de release

- Nenhuma release sem documentação atualizada.
- Nenhuma release major sem codemod/migração assistida.
