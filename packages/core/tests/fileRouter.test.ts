import { describe, expect, it } from 'vitest';
import { buildRouteManifest, toRoutePath } from '../src/routing/fileRouter';

describe('fileRouter', () => {
  it('converte caminhos para rotas estáticas e dinâmicas', () => {
    expect(toRoutePath('pages/index.tsx')).toBe('/');
    expect(toRoutePath('pages/blog/[slug].tsx')).toBe('/blog/:slug');
    expect(toRoutePath('pages\\api\\users\\index.ts')).toBe('/api/users');
  });

  it('gera manifesto com tipo de rota', () => {
    const manifest = buildRouteManifest([
      'pages/index.tsx',
      'pages/api/health.ts',
      'pages/middleware.ts'
    ]);

    expect(manifest).toEqual([
      { file: 'pages/index.tsx', routePath: '/', kind: 'page' },
      { file: 'pages/api/health.ts', routePath: '/api/health', kind: 'api' },
      { file: 'pages/middleware.ts', routePath: '/middleware', kind: 'middleware' }
    ]);
  });
});
