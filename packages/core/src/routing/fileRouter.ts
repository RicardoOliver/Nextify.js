import path from 'node:path';

export type RouteKind =
  | 'page'
  | 'api'
  | 'middleware'
  | 'layout'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'metadata';

export type RuntimeTarget = 'edge' | 'node';

export type MiddlewareContract = {
  scope: 'global' | 'route';
  matcher: string;
  runtime: RuntimeTarget;
};

export type RouteEntry = {
  file: string;
  routePath: string;
  kind: RouteKind;
  segmentPath: string;
  routeGroup?: string;
  middleware?: MiddlewareContract;
};

const APP_SPECIAL_FILES = new Set([
  'page',
  'layout',
  'loading',
  'error',
  'not-found',
  'metadata',
  'middleware',
  'route'
]);

function normalizeRouteSegments(rawSegments: string[]): { routeSegments: string[]; routeGroup?: string } {
  const routeSegments: string[] = [];
  let routeGroup: string | undefined;

  for (const segment of rawSegments.filter(Boolean)) {
    const groupMatch = /^\((.+)\)$/.exec(segment);
    if (groupMatch) {
      routeGroup ||= groupMatch[1];
      continue;
    }

    routeSegments.push(segment.replace(/^\[(.+)\]$/, ':$1'));
  }

  return { routeSegments, routeGroup };
}

function parseAppRoute(filePath: string): RouteEntry {
  const withoutExt = filePath.replace(/\.(t|j)sx?$/, '');
  const relative = withoutExt.replace(/^app\//, '');
  const segments = relative.split('/').filter(Boolean);
  const leaf = segments.at(-1) ?? 'page';
  const isApiRoute = leaf === 'route';
  const isMiddlewareFile = leaf.startsWith('middleware');
  const isAppSpecialFile = APP_SPECIAL_FILES.has(leaf) || isMiddlewareFile || isApiRoute;

  const kind: RouteKind =
    leaf === 'route'
      ? 'api'
      : isMiddlewareFile
        ? 'middleware'
        : APP_SPECIAL_FILES.has(leaf)
          ? (leaf as RouteKind)
          : 'page';

  const folderSegments = isAppSpecialFile ? segments.slice(0, -1) : segments;
  const { routeSegments, routeGroup } = normalizeRouteSegments(folderSegments);

  const segmentPath = routeSegments.length ? `/${routeSegments.join('/')}` : '/';
  const routePath = segmentPath;

  const entry: RouteEntry = {
    file: filePath,
    routePath,
    kind,
    segmentPath,
    ...(routeGroup ? { routeGroup } : {})
  };

  if (leaf.startsWith('middleware')) {
    entry.kind = 'middleware';
    entry.middleware = createMiddlewareContract(filePath, segmentPath);
  }

  return entry;
}

function parsePagesRoute(filePath: string): RouteEntry {
  const clean = filePath
    .replace(/^pages\//, '')
    .replace(/\.(t|j)sx?$/, '')
    .replace(/index$/, '');

  const { routeSegments } = normalizeRouteSegments(clean.split('/'));
  const routePath = routeSegments.length ? `/${routeSegments.join('/')}` : '/';
  const base = path.basename(filePath);

  const kind: RouteKind = filePath.includes('/api/') ? 'api' : base.startsWith('middleware') ? 'middleware' : 'page';

  return {
    file: filePath,
    routePath,
    kind,
    segmentPath: routePath,
    ...(kind === 'middleware' ? { middleware: createMiddlewareContract(filePath, routePath) } : {})
  };
}

export function toRoutePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');

  if (normalized.startsWith('app/')) {
    return parseAppRoute(normalized).routePath;
  }

  return parsePagesRoute(normalized).routePath;
}

export function detectRuntimeTarget(filePath: string): RuntimeTarget {
  if (/\.edge\.(t|j)sx?$/.test(filePath)) {
    return 'edge';
  }

  return 'node';
}

export function createMiddlewareContract(filePath: string, matcher: string): MiddlewareContract {
  const normalizedMatcher = matcher.startsWith('/') ? matcher : `/${matcher}`;

  return {
    scope: normalizedMatcher === '/' ? 'global' : 'route',
    matcher: normalizedMatcher,
    runtime: detectRuntimeTarget(filePath)
  };
}

export function buildRouteManifest(files: string[]): RouteEntry[] {
  return files.map((file) => {
    const normalized = file.replace(/\\/g, '/');

    if (normalized.startsWith('app/')) {
      return parseAppRoute(normalized);
    }

    return parsePagesRoute(normalized);
  });
}
