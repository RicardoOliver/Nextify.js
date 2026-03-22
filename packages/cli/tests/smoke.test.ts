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

  it('migrate converte pages para app router com middleware', () => {
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
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
