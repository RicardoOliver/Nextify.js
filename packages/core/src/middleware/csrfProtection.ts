import type { NextifyMiddleware } from './compose.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type CsrfProtectionOptions = {
  tokenHeader?: string;
  cookieName?: string;
  originAllowList?: string[];
  requireOriginHeader?: boolean;
  blockCrossSiteFetch?: boolean;
};

function extractCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((item) => item.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=');
    if (name === cookieName) {
      return rest.join('=');
    }
  }

  return null;
}

function sameOrigin(origin: string, url: string): boolean {
  try {
    return new URL(origin).origin === new URL(url).origin;
  } catch {
    return false;
  }
}

export function createCsrfProtection(options: CsrfProtectionOptions = {}): NextifyMiddleware {
  const tokenHeader = options.tokenHeader ?? 'x-csrf-token';
  const cookieName = options.cookieName ?? 'csrf-token';
  const requireOriginHeader = options.requireOriginHeader ?? true;
  const blockCrossSiteFetch = options.blockCrossSiteFetch ?? true;

  return async (req, next) => {
    const method = req.method.toUpperCase();
    if (SAFE_METHODS.has(method)) {
      return next();
    }

    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    if (options.originAllowList?.length) {
      const allowed = (origin && options.originAllowList.includes(origin)) ||
        (referer && options.originAllowList.some((candidate) => referer.startsWith(candidate)));

      if (!allowed) {
        return new Response('Forbidden origin', { status: 403 });
      }
    } else if (requireOriginHeader) {
      if (!origin && !referer) {
        return new Response('Missing origin', { status: 403 });
      }

      if (origin && !sameOrigin(origin, req.url)) {
        return new Response('Forbidden origin', { status: 403 });
      }

      if (!origin && referer && !sameOrigin(referer, req.url)) {
        return new Response('Forbidden referer', { status: 403 });
      }
    }

    if (blockCrossSiteFetch) {
      const fetchSite = req.headers.get('sec-fetch-site');
      if (fetchSite === 'cross-site') {
        return new Response('Cross-site request blocked', { status: 403 });
      }
    }

    const headerToken = req.headers.get(tokenHeader);
    const cookieToken = extractCookieValue(req.headers.get('cookie'), cookieName);

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return new Response('Invalid CSRF token', { status: 403 });
    }

    return next();
  };
}
