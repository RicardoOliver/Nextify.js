import type { CacheMode } from '../cache/smartCache.js';
import { TaggedCache } from '../cache/taggedCache.js';
export type DataParams = Record<string, string | string[]>;
export type DataContext = {
    request: Request;
    params?: DataParams;
    revalidateSeconds?: number;
    tags: Set<string>;
    tag: (...values: string[]) => void;
};
export type Loader<T> = (ctx: DataContext) => Promise<T> | T;
export type Action<T> = (ctx: DataContext) => Promise<T> | T;
export type LoaderOptions = {
    cacheKey?: string;
    mode?: CacheMode;
    cache?: TaggedCache<unknown>;
    defaultRevalidateSeconds?: number;
};
export type LoaderResult<T> = {
    data: T;
    source: 'cache' | 'origin';
    tags: string[];
};
export declare function defineLoader<T>(loader: Loader<T>): Loader<T>;
export declare function defineAction<T>(action: Action<T>): Action<T>;
export declare function executeLoader<T>(loader: Loader<T>, request: Request, params?: DataParams, options?: LoaderOptions): Promise<LoaderResult<T>>;
export declare function invalidateDataTags(tags: string[], cache?: TaggedCache<unknown>): number;
