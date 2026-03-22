import { createHash, generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const outputDir = join(workspaceRoot, 'artifacts', 'sbom');
const generatedAt = new Date().toISOString();
const sbomPath = join(outputDir, 'sbom-npm.json');
const traceabilityPath = join(outputDir, 'traceability.json');
const signaturePath = join(outputDir, 'sbom-npm.json.sig');
const certificatePath = join(outputDir, 'sbom-npm.json.cert');
const attestationPath = join(outputDir, 'sbom-npm.intoto.jsonl');
const predicateType = 'https://nextify.dev/attestation/sbom-traceability/v1';

const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
const lockfilePath = lockfiles.find((file) => existsSync(join(workspaceRoot, file)));

const lockfile = lockfilePath
  ? {
      path: lockfilePath,
      sha256: createHash('sha256')
        .update(readFileSync(join(workspaceRoot, lockfilePath), 'utf8'))
        .digest('hex'),
    }
  : {
      path: null,
      sha256: null,
      note: 'Nenhum lockfile encontrado no repositório durante a geração.',
    };


function runNpmLs(args) {
  const result = spawnSync('npm', ['ls', ...args, '--json'], { encoding: 'utf8' });

  if (!result.stdout) {
    throw new Error(`Falha ao executar npm ls ${args.join(' ')}: sem saída JSON.`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`Falha ao parsear saída de npm ls ${args.join(' ')}.`);
  }
}

const dependencyTree = runNpmLs(['--all']);
const prodDependencyTree = runNpmLs(['--omit=dev', '--all']);

const sbomDocument = {
  metadata: {
    format: 'nextify-sbom-v1',
    generatedAt,
    generatedBy: 'scripts/generate-sbom.mjs',
    packageManager: 'npm',
    lockfile,
  },
  dependencies: {
    all: dependencyTree,
    production: prodDependencyTree,
  },
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(sbomPath, JSON.stringify(sbomDocument, null, 2));

const sbomBuffer = readFileSync(sbomPath);
const sbomSha256 = createHash('sha256').update(sbomBuffer).digest('hex');

const traceabilityReport = {
  generatedAt,
  lockfile,
  sbom: {
    path: 'artifacts/sbom/sbom-npm.json',
    sha256: sbomSha256,
  },
  attestations: [
    {
      statement: 'SBOM generated from current workspace dependency graph.',
      evidence: ['npm ls --all --json', 'npm ls --omit=dev --all --json'],
    },
  ],
};

function hasCosignBinary() {
  const probe = spawnSync('cosign', ['version'], { encoding: 'utf8' });
  return probe.status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Comando falhou: ${command} ${args.join(' ')}`);
  }
}

function writeFallbackAttestation(algorithm, publicKeyPem, signatureBase64) {
  const statement = {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [
      {
        name: 'artifacts/sbom/sbom-npm.json',
        digest: { sha256: sbomSha256 },
      },
    ],
    predicateType,
    predicate: {
      generator: 'scripts/generate-sbom.mjs',
      generatedAt,
      signingMode: 'local-dev-fallback',
      algorithm,
      signature: signatureBase64,
      verificationMaterial: {
        publicKeyPem,
      },
      lockfile,
      evidence: traceabilityReport.attestations[0].evidence,
    },
  };

  writeFileSync(attestationPath, `${JSON.stringify(statement)}\n`);
}

function generateFallbackSignature() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const signature = cryptoSign(null, sbomBuffer, privateKey).toString('base64');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  writeFileSync(signaturePath, `${signature}\n`);
  writeFileSync(
    certificatePath,
    JSON.stringify(
      {
        generatedAt,
        mode: 'local-dev-fallback',
        algorithm: 'ed25519',
        issuer: 'nextify-local',
        publicKeyPem,
      },
      null,
      2,
    ),
  );

  writeFallbackAttestation('ed25519', publicKeyPem, signature);

  return {
    mode: 'local-dev-fallback',
    algorithm: 'ed25519',
    note: 'Cosign não encontrado. Assinatura local gerada para trilha criptográfica de desenvolvimento.',
  };
}

function generateCosignArtifacts() {
  run('cosign', [
    'sign-blob',
    '--yes',
    '--output-signature',
    signaturePath,
    '--output-certificate',
    certificatePath,
    sbomPath,
  ]);

  run('cosign', [
    'attest-blob',
    '--yes',
    '--type',
    predicateType,
    '--output-attestation',
    attestationPath,
    sbomPath,
  ]);

  return {
    mode: 'sigstore-keyless',
    algorithm: 'sigstore/cosign',
    note: 'Assinatura keyless e attestation in-toto emitidas via Cosign.',
  };
}

const signingSummary = hasCosignBinary() ? generateCosignArtifacts() : generateFallbackSignature();

traceabilityReport.signature = {
  ...signingSummary,
  artifacts: {
    signature: 'artifacts/sbom/sbom-npm.json.sig',
    certificate: 'artifacts/sbom/sbom-npm.json.cert',
    attestation: 'artifacts/sbom/sbom-npm.intoto.jsonl',
  },
};

writeFileSync(traceabilityPath, JSON.stringify(traceabilityReport, null, 2));

console.log('SBOM gerado com sucesso em artifacts/sbom/.');
console.log(`Assinatura ativa: ${signingSummary.mode}.`);
