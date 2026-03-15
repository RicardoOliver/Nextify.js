import { describe, expect, it } from 'vitest';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
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
});
