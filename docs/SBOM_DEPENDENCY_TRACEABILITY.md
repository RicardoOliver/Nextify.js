# SBOM e Rastreabilidade de Dependências — Nextify.js

## Objetivo

Garantir que terceiros consigam auditar, de forma repetível, quais dependências estão presentes e qual lockfile foi usado como fonte da árvore de dependências.

## Artefatos gerados

Após executar `npm run sbom:generate`, os seguintes arquivos são produzidos:

- `artifacts/sbom/sbom-npm.json`
  - SBOM no formato interno `nextify-sbom-v1`.
  - Inclui árvore completa (`npm ls --all --json`) e árvore de produção (`npm ls --omit=dev --all --json`).
- `artifacts/sbom/traceability.json`
  - Data/hora de geração.
  - Hash SHA-256 do lockfile detectado (`package-lock.json`, `pnpm-lock.yaml` ou `yarn.lock`).
  - Quando não houver lockfile no repositório, o relatório registra explicitamente essa condição.
  - Evidências de comando usadas para geração.

## Processo operacional

1. Atualizar dependências e lockfile via PR.
2. Executar `npm run sbom:generate`.
3. Anexar os artefatos SBOM ao PR/release.
4. Executar `npm run audit:internal` para validar presença dos entregáveis.

## Comandos de auditoria por terceiros

```bash
npm ci
npm run sbom:generate
npm run audit:internal
```

Se todos os comandos passarem, o auditor consegue reproduzir a árvore de dependências e verificar o vínculo com o lockfile versionado (quando presente).
