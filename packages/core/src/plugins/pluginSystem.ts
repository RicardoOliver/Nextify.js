export type NextifyPlugin = {
  name: string;
  setup: (ctx: { hooks: Map<string, Array<() => void>> }) => void;
};

export class PluginSystem {
  private hooks = new Map<string, Array<() => void>>();

  use(plugin: NextifyPlugin) {
    plugin.setup({ hooks: this.hooks });
  }

  runHook(name: string) {
    const entries = this.hooks.get(name) ?? [];
    for (const fn of entries) fn();
  }
}
