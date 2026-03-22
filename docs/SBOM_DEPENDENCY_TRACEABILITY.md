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
- `artifacts/sbom/sbom-npm.json.sig`
  - Assinatura Sigstore/Cosign keyless do SBOM.
- `artifacts/sbom/sbom-npm.json.cert`
  - Certificado efêmero emitido por Fulcio para a assinatura keyless.
- `artifacts/sbom/sbom-npm.intoto.jsonl`
  - Bundle de attestation in-toto com predicate `https://nextify.dev/attestation/sbom-traceability/v1`.

## Processo operacional

1. Atualizar dependências e lockfile via PR.
2. Executar `npm run sbom:generate`.
3. Anexar os artefatos SBOM ao PR/release.
4. Executar `npm run audit:internal` para validar presença dos entregáveis.
5. Executar `npm run provenance:verify` para aplicar a política de rejeição de artefatos sem proveniência válida.

## Pipeline de segurança (GitHub Actions)

Os workflows `.github/workflows/ci.yml`, `.github/workflows/release-canary.yml` e `.github/workflows/release-promote.yml` incluem:

1. `npm run sbom:generate`
2. `cosign sign-blob` (assinatura do SBOM)
3. `cosign attest-blob` (geração de attestation)
4. `npm run provenance:verify` (gate de rejeição)

Se a assinatura/certificado/attestation estiver ausente ou inválida, o job falha e o pipeline rejeita o artefato.

## Comandos de auditoria por terceiros

```bash
npm ci
npm run sbom:generate
npm run audit:internal
```

Se todos os comandos passarem, o auditor consegue reproduzir a árvore de dependências e verificar o vínculo com o lockfile versionado (quando presente).
