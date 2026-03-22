# Engineering Health Panel

- Generated at: 2026-03-22T16:58:19.868Z
- Internal Audit: 85% (STRONG)
- Synthetic Benchmark: ✅ pass
- SBOM Traceability version: unknown
- Performance budget categories: 5

## Performance Regression

| Scenario | Status | Measured p50/p95 (ms) | Threshold p50/p95 (ms) | Delta vs baseline (p50/p95) |
| --- | --- | --- | --- | --- |
| ssr_reference | ✅ | 185 / 226 | 190 / 260 | +0.00% / +0.00% |
| api_health | ✅ | 75 / 90 | 80 / 120 | +0.00% / +0.00% |
| build_validation | ✅ | 251350 / 278750 | 300000 / 360000 | +0.00% / +0.00% |
