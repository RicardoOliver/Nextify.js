import path from 'node:path';

export type RouteEntry = {
  file: string;
  routePath: string;
  kind: 'page' | 'api' | 'middleware';
};

export function toRoutePath(filePath: string): string {
  const clean = filePath
    .replace(/\\/g, '/')
    .replace(/^pages\//, '')
    .replace(/\.(t|j)sx?$/, '')
    .replace(/index$/, '');

  if (!clean) return '/';

  return (
    '/' +
    clean
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(/^\[(.+)\]$/, ':$1'))
      .join('/')
  );
}

export function buildRouteManifest(files: string[]): RouteEntry[] {
  return files.map((file) => {
    const normalized = file.replace(/\\/g, '/');
    const routePath = toRoutePath(normalized);
    const base = path.basename(normalized);

    const kind: RouteEntry['kind'] = normalized.includes('/api/')
      ? 'api'
      : base.startsWith('middleware')
        ? 'middleware'
        : 'page';

    return { file: normalized, routePath, kind };
  });
}
