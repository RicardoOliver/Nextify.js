import React, { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { ServerResponse } from 'node:http';
import { SmartCache } from '../cache/smartCache.js';

export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type ServerComponent<Props extends Record<string, SerializableValue>> = (props: Props) =>
  | React.ReactNode
  | Promise<React.ReactNode>;

export type ClientComponent<Props extends Record<string, SerializableValue>> = {
  id: string;
  module: string;
  exportName?: string;
  defaultProps?: Props;
};

export type RscPayload = {
  tree: SerializableValue;
  clientModules: Array<{ id: string; module: string; exportName: string }>;
  generatedAt: string;
};

const rscCache = new SmartCache<RscPayload>();

function normalizeSerializable(value: unknown): SerializableValue {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSerializable(entry));
  }

  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeSerializable(entry)])
    ) as SerializableValue;
  }

  return String(value);
}

export function defineServerComponent<Props extends Record<string, SerializableValue>>(
  component: ServerComponent<Props>
) {
  return component;
}

export function defineClientComponent<Props extends Record<string, SerializableValue>>(
  component: ClientComponent<Props>
) {
  return {
    ...component,
    exportName: component.exportName ?? 'default'
  };
}

export async function createRscPayload(
  key: string,
  treeFactory: () => Promise<unknown> | unknown,
  clients: ClientComponent<Record<string, SerializableValue>>[],
  ttlMs = 15_000
): Promise<RscPayload> {
  const hit = rscCache.get(key);
  if (hit) return hit;

  const tree = normalizeSerializable(await treeFactory());
  const payload: RscPayload = {
    tree,
    clientModules: clients.map((client) => ({
      id: client.id,
      module: client.module,
      exportName: client.exportName ?? 'default'
    })),
    generatedAt: new Date().toISOString()
  };

  rscCache.set(key, payload, ttlMs);
  return payload;
}

export function serializeRscPayload(payload: RscPayload) {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export function renderRscBoundary(options: { id: string; fallback?: string; payload: RscPayload }) {
  const encodedPayload = encodeURIComponent(serializeRscPayload(options.payload));
  return `<section data-nextify-rsc-boundary="${options.id}" data-nextify-rsc="${encodedPayload}">${options.fallback ?? ''}</section>`;
}

export function streamRscApp(
  app: React.ReactElement,
  res: ServerResponse,
  bootstrapScripts: string[] = []
) {
  const stream = renderToPipeableStream(React.createElement(Suspense, { fallback: null }, app), {
    bootstrapScripts,
    onShellReady() {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      stream.pipe(res);
    },
    onError(error) {
      res.statusCode = 500;
      res.end(`<h1>RSC stream error</h1><pre>${String(error)}</pre>`);
    }
  });
}

export function clearRscCache() {
  return rscCache;
}
