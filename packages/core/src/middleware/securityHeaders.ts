import type { NextifyMiddleware } from './compose.js';

export type CspMode = 'enforce' | 'report-only';

export type SecurityProfile = 'development' | 'balanced' | 'strict';

export type SecurityHeadersOptions = {
  profile?: SecurityProfile;
  cspMode?: CspMode;
  cspDirectives?: string[];
  cspReportUri?: string;
};

const PROFILE_CSP: Record<SecurityProfile, string[]> = {
  development: ["default-src 'self'", "script-src 'self' 'unsafe-eval' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'"],
  balanced: ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "connect-src 'self'"],
  strict: ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'"]
};

export function createSecurityHeaders(options: SecurityHeadersOptions = {}): NextifyMiddleware {
  const profile = options.profile ?? 'balanced';
  const cspMode = options.cspMode ?? (profile === 'development' ? 'report-only' : 'enforce');
  const directives = options.cspDirectives ?? PROFILE_CSP[profile];

  if (directives.length === 0) {
    throw new Error('CSP precisa ter ao menos uma diretiva');
  }

  const cspValue = [
    ...directives,
    options.cspReportUri ? `report-uri ${options.cspReportUri}` : ''
  ]
    .filter(Boolean)
    .join('; ');

  return async (_req, next) => {
    const response = await next();

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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
