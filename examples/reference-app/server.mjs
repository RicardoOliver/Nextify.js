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
import { createLogger, createRouteMetrics, getOrCreateRequestId } from './observability.mjs';

const PORT = Number(process.env.PORT || 4010);
const SERVICE_NAME = 'reference-app';

const logger = createLogger({ service: SERVICE_NAME });
const routeMetrics = createRouteMetrics();
const middlewareRunner = composeMiddleware([securityHeaders]);

const catalogLoader = async (ctx) => {
  ctx.tag('catalog');
  return {
    items: ['starter', 'pro'],
    timestamp: Date.now()
  };
};

registerApiRoute('/api/health', () => {
  return globalThis.Response.json({ ok: true, service: SERVICE_NAME });
});

registerApiRoute('/api/catalog', async (request) => {
  const result = await executeLoader(catalogLoader, request, undefined, {
    cacheKey: 'catalog:list',
    defaultRevalidateSeconds: 120
  });

  return globalThis.Response.json(result);
});

registerApiRoute('/api/revalidate', async (request) => {
  const url = new URL(request.url);
  const tag = url.searchParams.get('tag') || 'catalog';
  const removed = invalidateDataTags([tag]);
  return globalThis.Response.json({ tag, removed });
});

registerApiRoute('/api/fail', async (request) => {
  const url = new URL(request.url);
  const reason = url.searchParams.get('reason') || 'simulated-runtime-error';
  throw new Error(reason);
});

registerApiRoute('/api/metrics', async () => {
  return globalThis.Response.json(routeMetrics.snapshot());
});

function nodeRequestToWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const url = `${protocol}://${host}${req.url}`;
  return new globalThis.Request(url, { method: req.method || 'GET' });
}

async function writeWebResponseToNode(res, response, requestId) {
  res.statusCode = response.status;
  res.setHeader('x-request-id', requestId);

  for (const [name, value] of response.headers.entries()) {
    res.setHeader(name, value);
  }

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

async function runWithObservability(req, routeLabel, handler) {
  const startedAtMs = routeMetrics.nowMs();
  const requestId = getOrCreateRequestId(req.headers);

  logger.info('request.received', {
    requestId,
    route: routeLabel,
    method: req.method,
    path: req.url
  });

  try {
    const response = await handler(requestId);
    const durationMs = routeMetrics.nowMs() - startedAtMs;

    routeMetrics.record({
      route: routeLabel,
      durationMs,
      statusCode: response.status
    });

    logger.info('request.completed', {
      requestId,
      route: routeLabel,
      statusCode: response.status,
      durationMs
    });

    return { response, requestId };
  } catch (error) {
    const durationMs = routeMetrics.nowMs() - startedAtMs;

    routeMetrics.record({
      route: routeLabel,
      durationMs,
      statusCode: 500
    });

    logger.error('request.failed', {
      requestId,
      route: routeLabel,
      durationMs,
      errorName: error?.name,
      errorMessage: error?.message
    });

    return {
      response: globalThis.Response.json(
        {
          error: 'internal_server_error',
          requestId
        },
        { status: 500 }
      ),
      requestId
    };
  }
}

createServer(async (req, res) => {
  const webRequest = nodeRequestToWebRequest(req);

  if (req.url === '/') {
    const startedAtMs = routeMetrics.nowMs();
    const requestId = getOrCreateRequestId(req.headers);

    logger.info('request.received', {
      requestId,
      route: '/',
      method: req.method,
      path: req.url
    });

    const baseResponse = await middlewareRunner(webRequest, async () => new globalThis.Response(null));
    for (const [name, value] of baseResponse.headers.entries()) {
      res.setHeader(name, value);
    }

    const element = React.createElement(
      'main',
      null,
      React.createElement('h1', null, 'Nextify Reference App'),
      React.createElement('p', null, 'SSR streaming ativo')
    );

    res.setHeader('x-request-id', requestId);
    routeMetrics.record({ route: '/', durationMs: routeMetrics.nowMs() - startedAtMs, statusCode: 200 });
    logger.info('request.completed', {
      requestId,
      route: '/',
      statusCode: 200,
      durationMs: routeMetrics.nowMs() - startedAtMs
    });

    return streamSSR(element, res);
  }

  const routeLabel = req.url?.split('?')[0] || '/unknown';
  const { response, requestId } = await runWithObservability(req, routeLabel, async () => {
    const apiResponse = await resolveApiRoute(webRequest);

    if (apiResponse) {
      return middlewareRunner(webRequest, async () => apiResponse);
    }

    return middlewareRunner(
      webRequest,
      async () => new globalThis.Response('Not Found', { status: 404 })
    );
  });

  return writeWebResponseToNode(res, response, requestId);
}).listen(PORT, () => {
  logger.info('server.started', { port: PORT, baseUrl: `http://127.0.0.1:${PORT}` });
  console.log(`reference-app running on http://127.0.0.1:${PORT}`);
});
