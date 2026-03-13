export class PluginSystem {
    hooks = new Map();
    use(plugin) {
        plugin.setup({ hooks: this.hooks });
    }
    runHook(name) {
        const entries = this.hooks.get(name) ?? [];
        for (const fn of entries)
            fn();
    }
}
