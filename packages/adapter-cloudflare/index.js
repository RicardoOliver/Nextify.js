import { createEdgeAdapter } from '@nextify/core/dist/index.js';

export function cloudflareWorkersAdapter(handler) {
  return createEdgeAdapter(async (request) => {
    const response = await handler(request);
    return {
      ...response,
      headers: {
        'x-nextify-runtime': 'cloudflare-workers',
        ...(response.headers ?? {})
      }
    };
  });
}
