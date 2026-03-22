import { createServerlessAdapter } from '@nextify/core/dist/index.js';

export function awsLambdaAdapter(handler) {
  return createServerlessAdapter(async (request) => {
    const response = await handler(request);
    return {
      ...response,
      headers: {
        'x-nextify-runtime': 'aws-lambda',
        ...(response.headers ?? {})
      }
    };
  });
}
