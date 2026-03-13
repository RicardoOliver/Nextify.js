import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { ServerResponse } from 'node:http';

export function streamSSR(element: React.ReactElement, res: ServerResponse) {
  const stream = renderToPipeableStream(element, {
    onShellReady() {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      stream.pipe(res);
    },
    onError(error: unknown) {
      res.statusCode = 500;
      res.end(`<h1>SSR Error</h1><pre>${String(error)}</pre>`);
    }
  });
}
