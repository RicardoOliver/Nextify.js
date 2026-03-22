import { describe, expect, it } from 'vitest';
import { authorize, csrfTokenFor, sanitizeHtml, validateInput } from '../src/middleware/enterpriseSecurity.js';

describe('enterprise security', () => {
  it('sanitiza payload e valida campos', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('scriptalert(1)/script');

    const validation = validateInput(
      { email: 'admin@nextify.dev' },
      [{ field: 'email', required: true, pattern: /^[^@]+@[^@]+\.[^@]+$/ }]
    );

    expect(validation.ok).toBe(true);
    expect(authorize(['admin'], 'admin')).toBe(true);
    expect(csrfTokenFor('session-1', 'secret')).toMatch(/^csrf_/);
  });
});
