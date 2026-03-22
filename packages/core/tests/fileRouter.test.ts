import { describe, expect, it } from 'vitest';
import {
  buildRouteManifest,
  createMiddlewareContract,
  detectRuntimeTarget,
  toRoutePath
} from '../src/routing/fileRouter';

describe('fileRouter', () => {
  it('converte caminhos para rotas estáticas e dinâmicas em pages e app router', () => {
    expect(toRoutePath('pages/index.tsx')).toBe('/');
    expect(toRoutePath('pages/blog/[slug].tsx')).toBe('/blog/:slug');
    expect(toRoutePath('pages\\api\\users\\index.ts')).toBe('/api/users');
    expect(toRoutePath('app/(marketing)/blog/[slug]/page.tsx')).toBe('/blog/:slug');
    expect(toRoutePath('app/dashboard/layout.tsx')).toBe('/dashboard');
  });

  it('gera manifesto com tipos modernos de segmento para app router', () => {
    const manifest = buildRouteManifest([
      'app/(commerce)/products/[slug]/layout.tsx',
      'app/(commerce)/products/[slug]/loading.tsx',
      'app/(commerce)/products/[slug]/error.tsx',
      'app/(commerce)/products/[slug]/metadata.ts',
      'app/(commerce)/products/[slug]/not-found.tsx',
      'app/(commerce)/products/[slug]/page.tsx'
    ]);

    expect(manifest).toEqual([
      {
        file: 'app/(commerce)/products/[slug]/layout.tsx',
        routePath: '/products/:slug',
        kind: 'layout',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      },
      {
        file: 'app/(commerce)/products/[slug]/loading.tsx',
        routePath: '/products/:slug',
        kind: 'loading',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      },
      {
        file: 'app/(commerce)/products/[slug]/error.tsx',
        routePath: '/products/:slug',
        kind: 'error',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      },
      {
        file: 'app/(commerce)/products/[slug]/metadata.ts',
        routePath: '/products/:slug',
        kind: 'metadata',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      },
      {
        file: 'app/(commerce)/products/[slug]/not-found.tsx',
        routePath: '/products/:slug',
        kind: 'not-found',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      },
      {
        file: 'app/(commerce)/products/[slug]/page.tsx',
        routePath: '/products/:slug',
        kind: 'page',
        segmentPath: '/products/:slug',
        routeGroup: 'commerce'
      }
    ]);
  });

  it('mantém contrato estável de middleware por rota e runtime edge/node', () => {
    const manifest = buildRouteManifest([
      'pages/middleware.ts',
      'app/dashboard/middleware.edge.ts',
      'app/shop/middleware.ts'
    ]);

    expect(manifest).toEqual([
      {
        file: 'pages/middleware.ts',
        routePath: '/middleware',
        kind: 'middleware',
        segmentPath: '/middleware',
        middleware: {
          scope: 'route',
          matcher: '/middleware',
          runtime: 'node'
        }
      },
      {
        file: 'app/dashboard/middleware.edge.ts',
        routePath: '/dashboard',
        kind: 'middleware',
        segmentPath: '/dashboard',
        middleware: {
          scope: 'route',
          matcher: '/dashboard',
          runtime: 'edge'
        }
      },
      {
        file: 'app/shop/middleware.ts',
        routePath: '/shop',
        kind: 'middleware',
        segmentPath: '/shop',
        middleware: {
          scope: 'route',
          matcher: '/shop',
          runtime: 'node'
        }
      }
    ]);

    expect(detectRuntimeTarget('app/middleware.edge.ts')).toBe('edge');
    expect(detectRuntimeTarget('app/middleware.ts')).toBe('node');
    expect(createMiddlewareContract('app/middleware.edge.ts', '/')).toEqual({
      scope: 'global',
      matcher: '/',
      runtime: 'edge'
    });
  });
});
