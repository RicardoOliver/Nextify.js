import { describe, expect, it } from 'vitest';
import { evaluatePerformanceBudget } from '../src/build.js';

describe('evaluatePerformanceBudget', () => {
  it('retorna pass sem violações dentro do budget', () => {
    const result = evaluatePerformanceBudget([
      { file: 'a.js', size: 100 * 1024 },
      { file: 'b.js', size: 50 * 1024 }
    ]);

    expect(result.status).toBe('pass');
    expect(result.violations).toHaveLength(0);
    expect(result.totalKb).toBe(150);
  });

  it('retorna fail com violações quando excede limite', () => {
    const result = evaluatePerformanceBudget([
      { file: 'vendor.js', size: 200 * 1024 },
      { file: 'app.js', size: 180 * 1024 }
    ]);

    expect(result.status).toBe('fail');
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    expect(result.largestAssetKb).toBe(200);
    expect(result.totalKb).toBe(380);
  });
});
