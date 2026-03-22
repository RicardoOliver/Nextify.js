import { createEdgeAdapter } from '@nextify/core/dist/index.js';

export function vercelEdgeAdapter(handler) {
  return createEdgeAdapter(async (request) => {
    const response = await handler(request);
    return {
      ...response,
      headers: {
        'x-nextify-runtime': 'vercel-edge',
        ...(response.headers ?? {})
      }
    };
  });
}
