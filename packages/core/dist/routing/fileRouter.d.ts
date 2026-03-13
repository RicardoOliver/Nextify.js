export type RouteEntry = {
    file: string;
    routePath: string;
    kind: 'page' | 'api' | 'middleware';
};
export declare function toRoutePath(filePath: string): string;
export declare function buildRouteManifest(files: string[]): RouteEntry[];
