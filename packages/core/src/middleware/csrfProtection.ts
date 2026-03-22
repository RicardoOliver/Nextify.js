import type { NextifyMiddleware } from './compose.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type CsrfProtectionOptions = {
  tokenHeader?: string;
  cookieName?: string;
  originAllowList?: string[];
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

export function createCsrfProtection(options: CsrfProtectionOptions = {}): NextifyMiddleware {
  const tokenHeader = options.tokenHeader ?? 'x-csrf-token';
  const cookieName = options.cookieName ?? 'csrf-token';

  return async (req, next) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return next();
    }

    const origin = req.headers.get('origin');
    if (options.originAllowList?.length && origin && !options.originAllowList.includes(origin)) {
      return new Response('Forbidden origin', { status: 403 });
    }

    const headerToken = req.headers.get(tokenHeader);
    const cookieToken = extractCookieValue(req.headers.get('cookie'), cookieName);

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return new Response('Invalid CSRF token', { status: 403 });
    }

    return next();
  };
}
