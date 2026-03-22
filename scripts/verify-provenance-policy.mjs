import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const requiredArtifacts = [
  'artifacts/sbom/sbom-npm.json',
  'artifacts/sbom/traceability.json',
  'artifacts/sbom/sbom-npm.json.sig',
  'artifacts/sbom/sbom-npm.json.cert',
  'artifacts/sbom/sbom-npm.intoto.jsonl',
];

const missing = requiredArtifacts.filter((artifact) => !existsSync(artifact));

if (missing.length > 0) {
  console.error('Política de proveniência: artefatos obrigatórios ausentes.');
  for (const artifact of missing) {
    console.error(` - ${artifact}`);
  }
  process.exit(1);
}

const certIdentity = process.env.COSIGN_CERT_IDENTITY;
const certIdentityRegexp = process.env.COSIGN_CERT_IDENTITY_REGEXP;
const certIssuer = process.env.COSIGN_CERT_ISSUER;

if ((!certIdentity && !certIdentityRegexp) || !certIssuer) {
  console.error(
    'Defina COSIGN_CERT_IDENTITY ou COSIGN_CERT_IDENTITY_REGEXP, além de COSIGN_CERT_ISSUER, para validação de proveniência.',
  );
  process.exit(1);
}

const run = (cmd) => {
  execSync(cmd, {
    stdio: 'inherit',
    encoding: 'utf8',
    env: process.env,
  });
};

const identityFlag = certIdentity
  ? `--certificate-identity "${certIdentity}"`
  : `--certificate-identity-regexp "${certIdentityRegexp}"`;

try {
  run(
    `cosign verify-blob ${identityFlag} --certificate-oidc-issuer "${certIssuer}" --signature artifacts/sbom/sbom-npm.json.sig --certificate artifacts/sbom/sbom-npm.json.cert artifacts/sbom/sbom-npm.json`,
  );

  run(
    `cosign verify-blob-attestation ${identityFlag} --certificate-oidc-issuer "${certIssuer}" --type https://nextify.dev/attestation/sbom-traceability/v1 --bundle artifacts/sbom/sbom-npm.intoto.jsonl artifacts/sbom/sbom-npm.json`,
  );

  console.log('Política de proveniência validada com sucesso.');
} catch {
  console.error('Falha na validação de proveniência. Artefato rejeitado pela política de release.');
  process.exit(1);
}
