import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Framework = 'nextjs';

type CompatibilityCheck = {
  generatedAt: string;
  framework: Framework;
  compatible: boolean;
  projectRoot: string;
  findings: string[];
  recommendations: string[];
};

function detectFramework(root: string): Framework | null {
  const packageJsonPath = join(root, 'package.json');
  if (!existsSync(packageJsonPath)) return null;

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (deps.next) return 'nextjs';

  return null;
}

export function runFrameworkCheck(root = process.cwd()) {
  const detected = detectFramework(root);

  if (!detected) {
    console.error('Nenhum framework suportado detectado (atualmente: Next.js).');
    process.exit(1);
  }

  const findings: string[] = [];
  const recommendations: string[] = [];

  if (existsSync(join(root, 'pages'))) {
    findings.push('Pasta pages/ detectada: migração para app router recomendada.');
    recommendations.push('Executar: nextify migrate');
  }

  if (existsSync(join(root, 'middleware.ts')) || existsSync(join(root, 'middleware.js'))) {
    findings.push('Middleware legado detectado na raiz do projeto.');
    recommendations.push('Validar middlewares em app/middleware.* após migração.');
  }

  if (!findings.length) {
    findings.push('Nenhum risco crítico detectado no pré-check.');
  }

  const report: CompatibilityCheck = {
    generatedAt: new Date().toISOString(),
    framework: detected,
    compatible: true,
    projectRoot: root,
    findings,
    recommendations
  };

  const outputPath = join(root, 'artifacts', 'upgrades', 'framework-check.latest.json');
  mkdirSync(join(root, 'artifacts', 'upgrades'), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Pré-check de compatibilidade concluído: ${outputPath}`);
  console.log(`Framework detectado: ${detected}.`);
}

export function initFrameworkMigration(root = process.cwd()) {
  const detected = detectFramework(root);

  if (!detected) {
    console.error('Não foi possível inicializar migração: framework não suportado.');
    process.exit(1);
  }

  const outputPath = join(root, 'nextify.framework-migration.json');
  const plan = {
    generatedAt: new Date().toISOString(),
    sourceFramework: detected,
    targetFramework: 'nextify',
    mode: 'assistido',
    steps: [
      {
        id: 'check',
        command: 'nextify check',
        required: true
      },
      {
        id: 'migrate',
        command: 'nextify migrate',
        required: true
      },
      {
        id: 'upgrade-playbook',
        command: 'npm run upgrade:assist',
        required: true
      }
    ]
  };

  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

  console.log(`Inicialização de migração assistida concluída: ${outputPath}`);
}

