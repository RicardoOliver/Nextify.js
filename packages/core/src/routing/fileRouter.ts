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

export type RouteMatch = {
  route: RouteEntry;
  params: Record<string, string>;
};

export type RouteMatcher = {
  match: (pathname: string) => RouteMatch | null;
  routes: RouteEntry[];
};

type RouteTrieNode = {
  staticChildren: Map<string, RouteTrieNode>;
  dynamicChild?: RouteTrieNode;
  dynamicParam?: string;
  route?: RouteEntry;
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

function tokenizeRoute(routePath: string): string[] {
  return routePath.split('/').filter(Boolean);
}

function createTrieNode(): RouteTrieNode {
  return {
    staticChildren: new Map<string, RouteTrieNode>()
  };
}

function normalizePathname(pathname: string): string {
  const cleanPath = pathname.split('?')[0] ?? '/';
  if (cleanPath === '' || cleanPath === '/') return '/';

  const normalized = cleanPath.replace(/\/$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
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

export function createRouteMatcher(routes: RouteEntry[]): RouteMatcher {
  const root = createTrieNode();

  const sortedRoutes = [...routes].sort((a, b) => {
    const aSegments = tokenizeRoute(a.routePath);
    const bSegments = tokenizeRoute(b.routePath);

    if (aSegments.length !== bSegments.length) {
      return aSegments.length - bSegments.length;
    }

    const aDynamicCount = aSegments.filter((segment) => segment.startsWith(':')).length;
    const bDynamicCount = bSegments.filter((segment) => segment.startsWith(':')).length;

    return aDynamicCount - bDynamicCount;
  });

  for (const route of sortedRoutes) {
    const segments = tokenizeRoute(route.routePath);
    let cursor = root;

    for (const segment of segments) {
      if (segment.startsWith(':')) {
        if (!cursor.dynamicChild) {
          cursor.dynamicChild = createTrieNode();
          cursor.dynamicParam = segment.slice(1);
        }

        cursor = cursor.dynamicChild;
        continue;
      }

      const staticChild = cursor.staticChildren.get(segment) ?? createTrieNode();
      cursor.staticChildren.set(segment, staticChild);
      cursor = staticChild;
    }

    cursor.route = route;
  }

  return {
    routes,
    match: (pathname: string) => {
      const normalizedPathname = normalizePathname(pathname);
      const segments = tokenizeRoute(normalizedPathname);
      const params: Record<string, string> = {};

      let cursor: RouteTrieNode | undefined = root;

      for (const segment of segments) {
        if (!cursor) return null;

        const staticChild = cursor.staticChildren.get(segment);
        if (staticChild) {
          cursor = staticChild;
          continue;
        }

        if (cursor.dynamicChild && cursor.dynamicParam) {
          params[cursor.dynamicParam] = decodeURIComponent(segment);
          cursor = cursor.dynamicChild;
          continue;
        }

        return null;
      }

      if (!cursor?.route) {
        return null;
      }

      return {
        route: cursor.route,
        params
      };
    }
  };
}
