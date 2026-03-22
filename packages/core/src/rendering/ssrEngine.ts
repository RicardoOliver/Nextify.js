import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { ServerResponse } from 'node:http';

export type SSRStreamOptions = {
  statusCode?: number;
  headers?: Record<string, string>;
  shellTimeoutMs?: number;
  bootstrapScripts?: string[];
  nonce?: string;
  onShellReady?: () => void;
  onAllReady?: () => void;
  onError?: (error: unknown) => void;
};

type PipeableStream = {
  pipe: (destination: ServerResponse) => void;
  abort: () => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function streamSSR(element: React.ReactElement, res: ServerResponse, options: SSRStreamOptions = {}) {
  const {
    statusCode = 200,
    headers = {},
    shellTimeoutMs = 10_000,
    bootstrapScripts,
    nonce,
    onShellReady,
    onAllReady,
    onError
  } = options;

  let didError = false;
  let stream: PipeableStream | null = null;
  let shellWasReady = false;

  const maybePipe = () => {
    if (shellWasReady && stream) {
      shellWasReady = false;
      stream.pipe(res);
    }
  };

  stream = renderToPipeableStream(element, {
    bootstrapScripts,
    nonce,
    onShellReady() {
      res.statusCode = didError ? 500 : statusCode;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      for (const [header, value] of Object.entries(headers)) {
        res.setHeader(header, value);
      }

      onShellReady?.();
      shellWasReady = true;
      maybePipe();
    },
    onAllReady() {
      onAllReady?.();
    },
    onError(error: unknown) {
      didError = true;
      onError?.(error);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }

      if (!res.writableEnded) {
        res.end(`<h1>SSR Error</h1><pre>${escapeHtml(String(error))}</pre>`);
      }
    }
  });

  maybePipe();

  const timeout = setTimeout(() => {
    if (!res.writableEnded && stream) {
      didError = true;
      stream.abort();

      if (!res.headersSent) {
        res.statusCode = 504;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }

      res.end('<h1>SSR Timeout</h1><p>Streaming shell exceeded the configured timeout.</p>');
    }
  }, shellTimeoutMs);

  timeout.unref?.();

  res.once('close', () => {
    clearTimeout(timeout);
  });

  res.once('finish', () => {
    clearTimeout(timeout);
  });
}
