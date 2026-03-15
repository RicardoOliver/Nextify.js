export type IslandDescriptor = {
    id: string;
    entry: string;
};
export declare function defineIsland(id: string, entry: string): IslandDescriptor;
export declare function renderIslandShell(id: string, props?: Record<string, unknown>, fallbackHtml?: string): string;
export declare function getIslandHydrationScript(islands: IslandDescriptor[]): string;
