export type RuntimeTarget = 'node' | 'edge' | 'serverless';

export type RuntimeRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type RuntimeResponse = {
  status: number;
  headers?: Record<string, string>;
  body: string;
};

export type RuntimeHandler = (request: RuntimeRequest) => Promise<RuntimeResponse>;

export type RuntimeAdapter = {
  name: string;
  target: RuntimeTarget;
  coldStartMs: number;
  execute: RuntimeHandler;
  deploy: (options: { outDir: string; entrypoint: string }) => Promise<{ artifact: string }>;
};

export class AdapterRegistry {
  private adapters = new Map<string, RuntimeAdapter>();

  register(adapter: RuntimeAdapter) {
    if (this.adapters.has(adapter.name)) {
      throw new Error(`Adapter duplicado: ${adapter.name}`);
    }

    this.adapters.set(adapter.name, adapter);
  }

  get(name: string) {
    return this.adapters.get(name) ?? null;
  }

  list(target?: RuntimeTarget) {
    const items = [...this.adapters.values()];
    return target ? items.filter((entry) => entry.target === target) : items;
  }
}

export function createNodeAdapter(handler: RuntimeHandler): RuntimeAdapter {
  return {
    name: 'node-http',
    target: 'node',
    coldStartMs: 2,
    execute: handler,
    async deploy({ outDir, entrypoint }) {
      return { artifact: `${outDir}/node/${entrypoint}` };
    }
  };
}

export function createEdgeAdapter(handler: RuntimeHandler): RuntimeAdapter {
  return {
    name: 'edge-runtime',
    target: 'edge',
    coldStartMs: 0,
    execute: handler,
    async deploy({ outDir, entrypoint }) {
      return { artifact: `${outDir}/edge/${entrypoint}` };
    }
  };
}

export function createServerlessAdapter(handler: RuntimeHandler): RuntimeAdapter {
  return {
    name: 'serverless-lambda',
    target: 'serverless',
    coldStartMs: 120,
    execute: handler,
    async deploy({ outDir, entrypoint }) {
      return { artifact: `${outDir}/lambda/${entrypoint}.zip` };
    }
  };
}
