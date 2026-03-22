# Changesets

Este diretório armazena os arquivos de changeset usados para versionamento e changelog.

## Fluxo

1. Crie um changeset para cada mudança de produto:
   - `npm run changeset`
2. Em PRs, garanta que o check de versão sincronizada esteja verde.
3. Ao preparar release, aplique os bumps:
   - `npm run changeset:version`
4. Publique os pacotes a partir das versões geradas.

## Política de sincronização estrita

Todos os pacotes dentro de `packages/*` devem compartilhar exatamente a mesma versão.
Qualquer drift de versão falha no CI e bloqueia merge.
