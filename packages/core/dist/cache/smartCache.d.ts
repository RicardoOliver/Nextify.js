export type CacheMode = 'force-cache' | 'stale-while-revalidate' | 'no-store';
export declare class SmartCache<T> {
    private store;
    get(key: string): T | null;
    set(key: string, value: T, ttlMs?: number): void;
}
