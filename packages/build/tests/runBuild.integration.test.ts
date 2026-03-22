import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { runBuild } from '../src/build.js';

describe('runBuild', () => {
  it('gera artefatos incrementais com source map e profiling por módulo', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'nextify-build-pass-'));

    try {
      const srcDir = join(cwd, 'src');
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(join(srcDir, 'index.ts'), "import './shared';\nconsole.log('ok');\n", 'utf8');
      writeFileSync(join(srcDir, 'shared.ts'), "export const value = 'nextify';\n", 'utf8');

      const firstBuild = runBuild(cwd);
      const secondBuild = runBuild(cwd);

      expect(firstBuild.status).toBe('pass');
      expect(existsSync(join(cwd, 'dist/route-manifest.json'))).toBe(true);
      expect(existsSync(join(cwd, 'dist/performance-budget.json'))).toBe(true);
      expect(existsSync(join(cwd, 'dist/build-profile.json'))).toBe(true);
      expect(existsSync(join(cwd, 'dist/index.js.map'))).toBe(true);
      expect(existsSync(join(cwd, '.nextify/build-cache.json'))).toBe(true);

      const profile = JSON.parse(readFileSync(join(cwd, 'dist/build-profile.json'), 'utf8'));
      expect(profile).toHaveLength(2);
      expect(profile[0]).toHaveProperty('module');
      expect(profile[0]).toHaveProperty('durationMs');
      expect(secondBuild.incrementalBuild.profile.every((entry) => entry.status === 'cache-hit')).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('falha o build quando detecta regressão crítica no budget', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'nextify-build-fail-'));

    try {
      const srcDir = join(cwd, 'src');
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(join(srcDir, 'vendor.js'), 'v'.repeat(200 * 1024), 'utf8');
      writeFileSync(join(srcDir, 'app.js'), 'a'.repeat(180 * 1024), 'utf8');

      expect(() => runBuild(cwd)).toThrow(/regressão crítica de performance/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
