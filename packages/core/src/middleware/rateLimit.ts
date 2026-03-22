import type { NextifyMiddleware } from './compose.js';

type RateLimitWindow = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  bypass?: (req: Request) => boolean;
};

function defaultKeyGenerator(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();

  return forwarded || realIp || 'anonymous';
}

export function createRateLimit(options: RateLimitOptions): NextifyMiddleware {
  if (options.maxRequests <= 0) {
    throw new Error('maxRequests precisa ser maior que zero');
  }

  if (options.windowMs <= 0) {
    throw new Error('windowMs precisa ser maior que zero');
  }

  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;
  const windows = new Map<string, RateLimitWindow>();

  return async (req, next) => {
    if (options.bypass?.(req)) {
      return next();
    }

    const now = Date.now();
    const key = keyGenerator(req);
    const current = windows.get(key);

    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + options.windowMs });
      const response = await next();
      response.headers.set('X-RateLimit-Limit', String(options.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(options.maxRequests - 1));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil((now + options.windowMs) / 1000)));
      return response;
    }

    if (current.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(options.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(current.resetAt / 1000))
        }
      });
    }

    current.count += 1;
    windows.set(key, current);

    const response = await next();
    response.headers.set('X-RateLimit-Limit', String(options.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(options.maxRequests - current.count));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    return response;
  };
}
