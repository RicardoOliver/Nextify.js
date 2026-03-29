import { describe, expect, it } from 'vitest';
import {
  createNextLikeRequestContext,
  NextLikeNotFoundError,
  NextLikeRedirectError,
  notFound,
  permanentRedirect,
  redirect
} from '../src/compat/nextApiShims.js';

describe('next api shims', () => {
  it('fornece headers e cookies em formato semelhante ao next/*', () => {
    const context = createNextLikeRequestContext({
      headers: {
        'x-request-id': 'abc',
        accept: ['application/json', 'text/plain']
      },
      cookies: {
        theme: 'dark'
      }
    });

    const headers = context.headers();
    const cookies = context.cookies();

    expect(headers.get('x-request-id')).toBe('abc');
    expect(headers.get('accept')).toBe('application/json, text/plain');
    expect(cookies.get('theme')?.value).toBe('dark');

    cookies.set('session', 'token', { httpOnly: true, path: '/' });
    expect(cookies.has('session')).toBe(true);
    expect(cookies.get('session')?.options?.httpOnly).toBe(true);

    cookies.delete('theme');
    expect(cookies.has('theme')).toBe(false);
  });

  it('sinaliza redirect e permanentRedirect via erro de controle', () => {
    expect(() => redirect('/login')).toThrowError(NextLikeRedirectError);
    expect(() => redirect('/login')).toThrowError(/NEXT_REDIRECT:\/login/);

    try {
      permanentRedirect('/docs');
    } catch (error) {
      expect(error).toBeInstanceOf(NextLikeRedirectError);
      expect((error as NextLikeRedirectError).status).toBe(308);
      expect((error as NextLikeRedirectError).location).toBe('/docs');
    }
  });

  it('sinaliza notFound via erro dedicado', () => {
    expect(() => notFound()).toThrowError(NextLikeNotFoundError);
  });
});
