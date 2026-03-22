import { execSync } from 'node:child_process';
import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

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

const run = (cmd) => {
  execSync(cmd, {
    stdio: 'inherit',
    encoding: 'utf8',
    env: process.env,
  });
};

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyLocalFallback() {
  const sbomBuffer = await readFile('artifacts/sbom/sbom-npm.json');
  const signatureRaw = (await readFile('artifacts/sbom/sbom-npm.json.sig', 'utf8')).trim();
  const certRaw = await readFile('artifacts/sbom/sbom-npm.json.cert', 'utf8');
  const attestationRaw = await readFile('artifacts/sbom/sbom-npm.intoto.jsonl', 'utf8');

  const cert = JSON.parse(certRaw);
  ensure(cert.mode === 'local-dev-fallback', 'Certificado não indica modo local-dev-fallback.');
  ensure(cert.algorithm === 'ed25519', 'Algoritmo inesperado para assinatura local.');
  ensure(typeof cert.publicKeyPem === 'string' && cert.publicKeyPem.includes('BEGIN PUBLIC KEY'), 'Chave pública PEM ausente.');

  const signature = Buffer.from(signatureRaw, 'base64');
  const isValid = cryptoVerify(null, sbomBuffer, createPublicKey(cert.publicKeyPem), signature);
  ensure(isValid, 'Assinatura local inválida para o SBOM.');

  const statement = JSON.parse(attestationRaw.trim().split('\n').find(Boolean) ?? '{}');
  ensure(
    statement.predicateType === 'https://nextify.dev/attestation/sbom-traceability/v1',
    'predicateType inválido na attestation.',
  );
  ensure(statement.predicate?.signingMode === 'local-dev-fallback', 'attestation não indica assinatura local.');
  ensure(statement.predicate?.signature === signatureRaw, 'Assinatura na attestation difere do arquivo .sig.');

  const expectedSha = createHash('sha256').update(sbomBuffer).digest('hex');
  const attestedSha = statement.subject?.[0]?.digest?.sha256;
  ensure(attestedSha === expectedSha, 'Digest SHA-256 da attestation não confere com o SBOM.');
}

async function main() {
  const certRaw = await readFile('artifacts/sbom/sbom-npm.json.cert', 'utf8');
  let certJson = null;

  try {
    certJson = JSON.parse(certRaw);
  } catch {
    certJson = null;
  }

  if (certJson?.mode === 'local-dev-fallback') {
    await verifyLocalFallback();
    console.log('Política de proveniência validada com sucesso (modo local-dev-fallback).');
    return;
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

  const identityFlag = certIdentity
    ? `--certificate-identity "${certIdentity}"`
    : `--certificate-identity-regexp "${certIdentityRegexp}"`;

  const verifyBlobFlags =
    certJson?.mode === 'sigstore-keyless' && certJson?.format === 'bundle'
      ? '--bundle artifacts/sbom/sbom-npm.json.sig'
      : '--signature artifacts/sbom/sbom-npm.json.sig --certificate artifacts/sbom/sbom-npm.json.cert';

  run(
    `cosign verify-blob ${identityFlag} --certificate-oidc-issuer "${certIssuer}" ${verifyBlobFlags} artifacts/sbom/sbom-npm.json`,
  );

  run(
    `cosign verify-blob-attestation ${identityFlag} --certificate-oidc-issuer "${certIssuer}" --type https://nextify.dev/attestation/sbom-traceability/v1 --bundle artifacts/sbom/sbom-npm.intoto.jsonl artifacts/sbom/sbom-npm.json`,
  );

  console.log('Política de proveniência validada com sucesso.');
}

main().catch(() => {
  console.error('Falha na validação de proveniência. Artefato rejeitado pela política de release.');
  process.exit(1);
});
