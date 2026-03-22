export type NextifyHookName = 'beforeRequest' | 'afterResponse' | 'buildStart' | 'buildEnd';

export type NextifyPluginContext = {
  registerHook: (hook: NextifyHookName, handler: () => void) => void;
};

export const SUPPORTED_PLUGIN_API_VERSIONS = ['1.x'] as const;
export type NextifyPluginApiVersion = (typeof SUPPORTED_PLUGIN_API_VERSIONS)[number];

export type NextifyPlugin = {
  name: string;
  setup: (ctx: NextifyPluginContext) => void;
  apiVersion?: NextifyPluginApiVersion;
};

export type PluginSystemOptions = {
  maxPlugins?: number;
  maxHooksPerPlugin?: number;
};

const VALID_HOOKS: NextifyHookName[] = ['beforeRequest', 'afterResponse', 'buildStart', 'buildEnd'];

function isSupportedApiVersion(version: string | undefined) {
  if (!version) return true;
  return SUPPORTED_PLUGIN_API_VERSIONS.includes(version as NextifyPluginApiVersion);
}

export class PluginSystem {
  private hooks = new Map<NextifyHookName, Array<() => void>>();
  private plugins = new Set<string>();
  private readonly maxPlugins: number;
  private readonly maxHooksPerPlugin: number;

  constructor(options: PluginSystemOptions = {}) {
    this.maxPlugins = options.maxPlugins ?? 30;
    this.maxHooksPerPlugin = options.maxHooksPerPlugin ?? 10;
  }

  use(plugin: NextifyPlugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin precisa ser um objeto válido');
    }

    if (typeof plugin.name !== 'string') {
      throw new Error('Plugin precisa ter atributo name do tipo string');
    }

    if (typeof plugin.setup !== 'function') {
      throw new Error(`Plugin ${plugin.name} precisa implementar setup(ctx)`);
    }

    if (!isSupportedApiVersion(plugin.apiVersion)) {
      throw new Error(
        `Plugin ${plugin.name} usa apiVersion não suportada (${plugin.apiVersion}). Versões suportadas: ${SUPPORTED_PLUGIN_API_VERSIONS.join(', ')}`,
      );
    }

    const name = plugin.name.trim();
    if (!name) throw new Error('Plugin precisa ter nome não vazio');
    if (this.plugins.has(name)) throw new Error(`Plugin duplicado: ${name}`);
    if (this.plugins.size >= this.maxPlugins) throw new Error('Limite máximo de plugins excedido');

    let registeredHooks = 0;

    plugin.setup({
      registerHook: (hook, handler) => {
        if (!VALID_HOOKS.includes(hook)) throw new Error(`Hook inválido: ${hook}`);
        if (typeof handler !== 'function') {
          throw new Error(`Hook ${hook} do plugin ${name} precisa ser uma função`);
        }
        if (registeredHooks >= this.maxHooksPerPlugin) {
          throw new Error(`Plugin ${name} excedeu limite de hooks (${this.maxHooksPerPlugin})`);
        }

        const entries = this.hooks.get(hook) ?? [];
        entries.push(handler);
        this.hooks.set(hook, entries);
        registeredHooks += 1;
      }
    });

    this.plugins.add(name);
  }

  runHook(name: NextifyHookName) {
    if (!VALID_HOOKS.includes(name)) throw new Error(`Hook inválido: ${name}`);

    const entries = this.hooks.get(name) ?? [];
    for (const fn of entries) fn();
  }
}
