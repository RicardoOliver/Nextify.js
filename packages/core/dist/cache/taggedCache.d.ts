export type TaggedCacheEntry<T> = {
    value: T;
    createdAt: number;
    ttlMs: number;
    tags: string[];
};
export declare class TaggedCache<T> {
    private entries;
    private tagIndex;
    get(key: string): T | null;
    set(key: string, value: T, ttlMs?: number, tags?: string[]): void;
    invalidateTag(tag: string): number;
    invalidateTags(tags: string[]): number;
    invalidateKey(key: string): number;
    stats(): {
        keys: number;
        tags: number;
    };
}
