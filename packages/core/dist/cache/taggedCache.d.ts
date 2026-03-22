export type TaggedCacheEntry<T> = {
    value: T;
    createdAt: number;
    ttlMs: number;
    tags: string[];
};
export type TaggedCacheEvent<T> = {
    type: 'set';
    key: string;
    tags: string[];
    ttlMs: number;
    value: T;
} | {
    type: 'invalidate-key';
    key: string;
    tags: string[];
    reason: 'manual' | 'expired';
} | {
    type: 'invalidate-tag';
    tag: string;
    removedKeys: number;
} | {
    type: 'invalidate-tags';
    tags: string[];
    removedKeys: number;
};
export type TaggedCacheListener<T> = (event: TaggedCacheEvent<T>) => void;
export declare class TaggedCache<T> {
    private entries;
    private tagIndex;
    private listeners;
    get(key: string): T | null;
    set(key: string, value: T, ttlMs?: number, tags?: string[]): void;
    invalidateTag(tag: string): number;
    invalidateTags(tags: string[]): number;
    invalidateKey(key: string, reason?: 'manual' | 'expired'): number;
    subscribe(listener: TaggedCacheListener<T>): () => boolean;
    stats(): {
        keys: number;
        tags: number;
        listeners: number;
    };
    private emit;
}
