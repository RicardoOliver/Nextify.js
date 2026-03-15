import { createServer } from 'node:http';
import React from 'react';
import {
  composeMiddleware,
  securityHeaders,
  registerApiRoute,
  resolveApiRoute,
  executeLoader,
  invalidateDataTags,
  streamSSR
} from '@nextify/core';

const PORT = Number(process.env.PORT || 4010);

const middlewareRunner = composeMiddleware([securityHeaders]);

const catalogLoader = async (ctx) => {
  ctx.tag('catalog');
  return {
    items: ['starter', 'pro'],
    timestamp: Date.now()
  };
};

registerApiRoute('/api/health', () => {
  return Response.json({ ok: true, service: 'reference-app' });
});

registerApiRoute('/api/catalog', async (request) => {
  const result = await executeLoader(catalogLoader, request, undefined, {
    cacheKey: 'catalog:list',
    defaultRevalidateSeconds: 120
  });

  return Response.json(result);
});

registerApiRoute('/api/revalidate', async (request) => {
  const url = new URL(request.url);
  const tag = url.searchParams.get('tag') || 'catalog';
  const removed = invalidateDataTags([tag]);
  return Response.json({ tag, removed });
});

function nodeRequestToWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const url = `${protocol}://${host}${req.url}`;
  return new Request(url, { method: req.method || 'GET' });
}

async function writeWebResponseToNode(res, response) {
  res.statusCode = response.status;
  for (const [name, value] of response.headers.entries()) {
    res.setHeader(name, value);
  }

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

createServer(async (req, res) => {
  const webRequest = nodeRequestToWebRequest(req);

  if (req.url === '/') {
    const baseResponse = await middlewareRunner(webRequest, async () => new Response(null));
    for (const [name, value] of baseResponse.headers.entries()) {
      res.setHeader(name, value);
    }

    const element = React.createElement(
      'main',
      null,
      React.createElement('h1', null, 'Nextify Reference App'),
      React.createElement('p', null, 'SSR streaming ativo')
    );

    return streamSSR(element, res);
  }

  const apiResponse = await resolveApiRoute(webRequest);

  if (apiResponse) {
    const securedResponse = await middlewareRunner(webRequest, async () => apiResponse);
    return writeWebResponseToNode(res, securedResponse);
  }

  const notFound = await middlewareRunner(
    webRequest,
    async () => new Response('Not Found', { status: 404 })
  );

  return writeWebResponseToNode(res, notFound);
}).listen(PORT, () => {
  console.log(`reference-app running on http://127.0.0.1:${PORT}`);
});
