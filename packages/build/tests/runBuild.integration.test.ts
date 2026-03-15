import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { runBuild } from '../src/build.js';

describe('runBuild', () => {
  it('gera artefatos do build e mantém status pass dentro do budget', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'nextify-build-pass-'));

    try {
      const result = runBuild(cwd);

      expect(result.status).toBe('pass');
      expect(existsSync(join(cwd, 'dist/route-manifest.json'))).toBe(true);
      expect(existsSync(join(cwd, 'dist/performance-budget.json'))).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('falha o build quando detecta regressão crítica no budget', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'nextify-build-fail-'));

    try {
      const distDir = join(cwd, 'dist');
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'vendor.js'), 'v'.repeat(200 * 1024), 'utf8');
      writeFileSync(join(distDir, 'app.js'), 'a'.repeat(180 * 1024), 'utf8');

      expect(() => runBuild(cwd)).toThrow(/regressão crítica de performance/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
