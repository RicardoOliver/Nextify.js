import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cwd = process.cwd();
const packageJsonPath = join(cwd, 'package.json');
const outputPath = join(cwd, 'artifacts', 'upgrades', 'upgrade-plan.latest.json');

const currentVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
const targetVersion = process.env.NEXTIFY_TARGET_VERSION ?? process.argv[2] ?? `${currentVersion}-next`;
const generatedAt = new Date().toISOString();

function classifyUpgradeRisk(fromVersion, toVersion) {
  const normalize = (value) => value.replace(/^v/, '').split('-')[0].split('.').map((entry) => Number(entry));
  const [fromMajor = 0, fromMinor = 0] = normalize(fromVersion);
  const [toMajor = 0, toMinor = 0] = normalize(toVersion);

  if (toMajor > fromMajor) return 'high';
  if (toMinor > fromMinor + 1) return 'high';
  if (toMinor > fromMinor) return 'medium';
  return 'low';
}

const risk = classifyUpgradeRisk(currentVersion, targetVersion);

const playbook = {
  generatedAt,
  project: 'nextify-monorepo',
  fromVersion: currentVersion,
  toVersion: targetVersion,
  risk,
  strategy: 'assistido-com-rollout-progressivo',
  phases: [
    {
      id: 'preflight',
      title: 'Pré-check de compatibilidade',
      required: true,
      commands: ['npm run validate', 'npm run sbom:generate', 'npm run provenance:verify'],
      outputs: ['artifacts/sbom/*'],
    },
    {
      id: 'breaking-changes-review',
      title: 'Review de breaking changes e RFC',
      required: true,
      references: ['docs/RFC_BREAKING_CHANGES_PROCESS.md', 'docs/ASSISTED_UPGRADE_PLAYBOOK.md'],
      checklist: [
        'Mapear APIs afetadas e consumidores internos.',
        'Gerar plano de mitigação para APIs removidas/renomeadas.',
        'Definir janela de rollback e feature flags de contenção.',
      ],
    },
    {
      id: 'canary',
      title: 'Rollout canary assistido',
      required: true,
      commands: ['npm run benchmark:synthetic', 'npm run benchmark:regression'],
      successCriteria: [
        'Sem regressão p95 acima do threshold.',
        'SLOs de runtime mantidos em rotas críticas.',
      ],
    },
    {
      id: 'production',
      title: 'Promoção e validação pós-upgrade',
      required: true,
      commands: ['npm run audit:internal', 'npm run engineering-health:panel'],
      outputs: ['docs/reliability-reports/latest-internal-audit.md'],
    },
  ],
  guidanceByRisk: {
    low: 'Upgrade patch ou minor incremental. Pode seguir rollout padrão com monitoramento base.',
    medium:
      'Upgrade minor com mudanças de contrato potenciais. Exigir dry-run em staging e comunicação prévia para consumidores.',
    high:
      'Upgrade de alto impacto. Exigir RFC aprovada, duas janelas de canary e plano de rollback validado antes da promoção final.',
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(playbook, null, 2)}\n`, 'utf8');

console.log(`Plano de upgrade assistido gerado em: ${outputPath}`);
console.log(`Versão atual: ${currentVersion} -> alvo: ${targetVersion} (risco ${risk}).`);
