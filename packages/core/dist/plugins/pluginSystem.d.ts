export type NextifyPlugin = {
    name: string;
    setup: (ctx: {
        hooks: Map<string, Array<() => void>>;
    }) => void;
};
export declare class PluginSystem {
    private hooks;
    use(plugin: NextifyPlugin): void;
    runHook(name: string): void;
}
