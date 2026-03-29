import { describe, expect, it } from 'vitest';
import { mkdtempSync, existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const cliEntry = join(process.cwd(), 'dist/index.js');

function runCli(args: string[], cwd: string) {
  return spawnSync(process.execPath, [cliEntry, ...args], {
    cwd,
    encoding: 'utf-8'
  });
}

describe('CLI smoke', () => {
  it('create gera estrutura inicial de projeto', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-create-'));
    const projectName = 'my-app';

    try {
      const result = runCli(['create', projectName], root);

      expect(result.status).toBe(0);
      expect(existsSync(join(root, projectName, 'package.json'))).toBe(true);
      expect(existsSync(join(root, projectName, 'pages', 'index.tsx'))).toBe(true);
      expect(existsSync(join(root, projectName, 'pages', 'api', 'health.ts'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('build gera manifesto em dist', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-build-'));

    try {
      const result = runCli(['build'], root);
      const manifestPath = join(root, 'dist', 'route-manifest.json');

      expect(result.status).toBe(0);
      expect(existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
        note: string;
      };
      expect(manifest.note).toContain('Manifesto de rotas');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('migrate converte pages para app router', () => {

    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-migrate-'));

    try {
      mkdirSync(join(root, 'pages', 'api'), { recursive: true });
      writeFileSync(join(root, 'pages', 'index.tsx'), 'export default function Home(){return <main>home</main>}', 'utf8');
      writeFileSync(join(root, 'pages', 'api', 'hello.ts'), 'export default function handler(){}', 'utf8');

      writeFileSync(join(root, 'middleware.ts'), 'export function middleware(){}', 'utf8');

      const result = runCli(['migrate'], root);
      expect(result.status).toBe(0);
      expect(existsSync(join(root, 'app', 'index', 'page.tsx'))).toBe(true);
      expect(existsSync(join(root, 'app', 'api', 'hello.ts'))).toBe(true);

      expect(existsSync(join(root, 'app', 'middleware.ts'))).toBe(true);
      expect(existsSync(join(root, 'nextify.migration.json'))).toBe(true);

      const report = JSON.parse(readFileSync(join(root, 'nextify.migration.json'), 'utf8'));
      expect(report.projects[0].migrated.some((entry: string) => entry.includes('index.tsx'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('migrate suporta monorepo em apps/*', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-mono-'));

    try {
      mkdirSync(join(root, 'apps', 'shop', 'pages'), { recursive: true });
      writeFileSync(
        join(root, 'apps', 'shop', 'pages', 'index.tsx'),
        'export default function Home(){return <main>shop</main>}',
        'utf8'
      );

      const result = runCli(['migrate'], root);
      expect(result.status).toBe(0);
      expect(existsSync(join(root, 'apps', 'shop', 'app', 'index', 'page.tsx'))).toBe(true);

      const report = JSON.parse(readFileSync(join(root, 'nextify.migration.json'), 'utf8'));
      expect(report.monorepo).toBe(true);
      expect(report.projects.some((entry: { root: string }) => entry.root === 'apps/shop')).toBe(true);

      expect(existsSync(join(root, 'nextify.migration.json'))).toBe(true);

    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('check gera diagnóstico de compatibilidade para projeto Next.js', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-check-'));

    try {
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'legacy-next', dependencies: { next: '^15.0.0' } }, null, 2),
        'utf8'
      );
      mkdirSync(join(root, 'pages'), { recursive: true });

      const result = runCli(['check'], root);
      const reportPath = join(root, 'artifacts', 'upgrades', 'framework-check.latest.json');

      expect(result.status).toBe(0);
      expect(existsSync(reportPath)).toBe(true);

      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      expect(report.framework).toBe('nextjs');
      expect(report.findings.some((entry: string) => entry.includes('pages/'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('init gera plano de migração assistida', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-init-'));

    try {
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'legacy-next', dependencies: { next: '^15.0.0' } }, null, 2),
        'utf8'
      );

      const result = runCli(['init'], root);
      const planPath = join(root, 'nextify.framework-migration.json');

      expect(result.status).toBe(0);
      expect(existsSync(planPath)).toBe(true);

      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      expect(plan.sourceFramework).toBe('nextjs');
      expect(plan.targetFramework).toBe('nextify');
      expect(plan.steps.some((entry: { id: string }) => entry.id === 'check')).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('deploy cloudflare cria config e chama wrangler deploy', () => {
    const root = mkdtempSync(join(tmpdir(), 'nextify-cli-deploy-'));
    const binDir = join(root, 'bin');
    const npxPath = join(binDir, 'npx');
    const markerPath = join(root, 'wrangler-invocation.txt');

    try {
      mkdirSync(binDir, { recursive: true });
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'nextify-cloudflare-demo' }, null, 2),
        'utf8'
      );
      writeFileSync(
        npxPath,
        `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(markerPath)}, process.argv.slice(2).join(' '), 'utf8');
`,
        'utf8'
      );
      spawnSync('chmod', ['+x', npxPath], { encoding: 'utf-8' });

      const result = spawnSync(process.execPath, [cliEntry, 'deploy', 'cloudflare'], {
        cwd: root,
        encoding: 'utf-8',
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ''}`
        }
      });

      expect(result.status).toBe(0);
      expect(existsSync(join(root, 'wrangler.toml'))).toBe(true);
      expect(existsSync(join(root, 'dist', '_worker.js'))).toBe(true);
      expect(existsSync(markerPath)).toBe(true);
      expect(readFileSync(markerPath, 'utf8')).toContain('wrangler deploy');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
