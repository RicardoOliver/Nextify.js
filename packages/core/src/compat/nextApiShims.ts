export type NextLikeHeaderValue = string | string[] | undefined;

export type NextLikeRequestContextInit = {
  headers?: Record<string, NextLikeHeaderValue>;
  cookies?: Record<string, string>;
};

export type NextLikeCookieOptions = {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
};

export type NextLikeCookie = {
  name: string;
  value: string;
  options?: NextLikeCookieOptions;
};

export type NextLikeRequestContext = {
  headers: () => Headers;
  cookies: () => {
    get: (name: string) => NextLikeCookie | undefined;
    getAll: () => NextLikeCookie[];
    has: (name: string) => boolean;
    set: (name: string, value: string, options?: NextLikeCookieOptions) => void;
    delete: (name: string) => void;
  };
};

export class NextLikeRedirectError extends Error {
  readonly location: string;
  readonly status: 307 | 308;

  constructor(location: string, permanent = false) {
    super(`NEXT_REDIRECT:${location}`);
    this.name = 'NextLikeRedirectError';
    this.location = location;
    this.status = permanent ? 308 : 307;
  }
}

export class NextLikeNotFoundError extends Error {
  constructor() {
    super('NEXT_NOT_FOUND');
    this.name = 'NextLikeNotFoundError';
  }
}

function flattenHeaderValue(value: NextLikeHeaderValue): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value ?? '';
}

export function createNextLikeRequestContext(init: NextLikeRequestContextInit = {}): NextLikeRequestContext {
  const headerStore = new Headers();
  const cookieStore = new Map<string, NextLikeCookie>();

  for (const [name, value] of Object.entries(init.headers ?? {})) {
    const normalizedValue = flattenHeaderValue(value);
    if (normalizedValue) {
      headerStore.set(name, normalizedValue);
    }
  }

  for (const [name, value] of Object.entries(init.cookies ?? {})) {
    cookieStore.set(name, { name, value });
  }

  return {
    headers: () => new Headers(headerStore),
    cookies: () => ({
      get: (name) => cookieStore.get(name),
      getAll: () => [...cookieStore.values()],
      has: (name) => cookieStore.has(name),
      set: (name, value, options) => {
        cookieStore.set(name, { name, value, ...(options ? { options } : {}) });
      },
      delete: (name) => {
        cookieStore.delete(name);
      }
    })
  };
}

export function redirect(location: string): never {
  throw new NextLikeRedirectError(location, false);
}

export function permanentRedirect(location: string): never {
  throw new NextLikeRedirectError(location, true);
}

export function notFound(): never {
  throw new NextLikeNotFoundError();
}
