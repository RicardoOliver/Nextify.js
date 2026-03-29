import type { NextifyMiddleware } from './compose.js';

export type CspMode = 'enforce' | 'report-only';

export type SecurityProfile = 'development' | 'balanced' | 'strict';

export type SecurityHeadersOptions = {
  profile?: SecurityProfile;
  cspMode?: CspMode;
  cspDirectives?: string[];
  cspReportUri?: string;
  includeHsts?: boolean;
  hstsMaxAge?: number;
  includeNoStore?: boolean;
  permissionsPolicy?: string;
};

const PROFILE_CSP: Record<SecurityProfile, string[]> = {
  development: ["default-src 'self'", "script-src 'self' 'unsafe-eval' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'"],
  balanced: ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "connect-src 'self'"],
  strict: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ]
};

const DEFAULT_PERMISSIONS_POLICY = 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()';

export function createSecurityHeaders(options: SecurityHeadersOptions = {}): NextifyMiddleware {
  const profile = options.profile ?? 'balanced';
  const cspMode = options.cspMode ?? (profile === 'development' ? 'report-only' : 'enforce');
  const directives = options.cspDirectives ?? PROFILE_CSP[profile];
  const includeHsts = options.includeHsts ?? profile !== 'development';
  const hstsMaxAge = options.hstsMaxAge ?? 31536000;
  const includeNoStore = options.includeNoStore ?? profile === 'strict';

  if (directives.length === 0) {
    throw new Error('CSP precisa ter ao menos uma diretiva');
  }

  if (includeHsts && hstsMaxAge <= 0) {
    throw new Error('hstsMaxAge precisa ser maior que zero');
  }

  const cspValue = [...directives, options.cspReportUri ? `report-uri ${options.cspReportUri}` : '']
    .filter(Boolean)
    .join('; ');

  return async (req, next) => {
    const response = await next();
    const isHttps = req.url.startsWith('https://') || req.headers.get('x-forwarded-proto') === 'https';

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('Permissions-Policy', options.permissionsPolicy ?? DEFAULT_PERMISSIONS_POLICY);

    if (includeHsts && isHttps) {
      response.headers.set('Strict-Transport-Security', `max-age=${hstsMaxAge}; includeSubDomains; preload`);
    }

    if (includeNoStore) {
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('Pragma', 'no-cache');
    }

    if (cspMode === 'report-only') {
      response.headers.set('Content-Security-Policy-Report-Only', cspValue);
      response.headers.delete('Content-Security-Policy');
    } else {
      response.headers.set('Content-Security-Policy', cspValue);
      response.headers.delete('Content-Security-Policy-Report-Only');
    }

    return response;
  };
}

export const securityHeaders = createSecurityHeaders();
