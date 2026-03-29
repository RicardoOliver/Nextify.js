import { describe, expect, it } from 'vitest';
import { createSecurityHeaders } from '../src/middleware/securityHeaders';

describe('securityHeaders', () => {
  it('usa enforce por padrão no perfil balanced', async () => {
    const middleware = createSecurityHeaders({ profile: 'balanced' });
    const response = await middleware(new Request('http://localhost/'), async () => new Response('ok'));

    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(response.headers.get('Content-Security-Policy-Report-Only')).toBeNull();
    expect(response.headers.get('X-DNS-Prefetch-Control')).toBe('off');
    expect(response.headers.get('Permissions-Policy')).toContain('geolocation=()');
  });

  it('usa report-only automaticamente no perfil development', async () => {
    const middleware = createSecurityHeaders({ profile: 'development' });
    const response = await middleware(new Request('http://localhost/'), async () => new Response('ok'));

    expect(response.headers.get('Content-Security-Policy-Report-Only')).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(response.headers.get('Content-Security-Policy')).toBeNull();
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('aceita report-uri no valor de CSP', async () => {
    const middleware = createSecurityHeaders({
      profile: 'strict',
      cspMode: 'report-only',
      cspReportUri: '/api/security/csp-report'
    });

    const response = await middleware(new Request('http://localhost/'), async () => new Response('ok'));

    expect(response.headers.get('Content-Security-Policy-Report-Only')).toContain('report-uri /api/security/csp-report');
  });

  it('aplica hsts quando request é https', async () => {
    const middleware = createSecurityHeaders({ profile: 'strict' });
    const response = await middleware(new Request('https://app.nextify.dev/'), async () => new Response('ok'));

    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
