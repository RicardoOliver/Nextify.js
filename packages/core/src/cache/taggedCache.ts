export type TaggedCacheEntry<T> = {
  value: T;
  createdAt: number;
  ttlMs: number;
  tags: string[];
};

export type TaggedCacheEvent<T> =
  | { type: 'set'; key: string; tags: string[]; ttlMs: number; value: T }
  | { type: 'invalidate-key'; key: string; tags: string[]; reason: 'manual' | 'expired' }
  | { type: 'invalidate-tag'; tag: string; removedKeys: number }
  | { type: 'invalidate-tags'; tags: string[]; removedKeys: number };

export type TaggedCacheListener<T> = (event: TaggedCacheEvent<T>) => void;

export class TaggedCache<T> {
  private entries = new Map<string, TaggedCacheEntry<T>>();
  private tagIndex = new Map<string, Set<string>>();
  private listeners = new Set<TaggedCacheListener<T>>();

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.invalidateKey(key, 'expired');
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs = 60_000, tags: string[] = []) {
    this.invalidateKey(key);
    const uniqueTags = [...new Set(tags)];

    this.entries.set(key, {
      value,
      createdAt: Date.now(),
      ttlMs,
      tags: uniqueTags
    });

    for (const tag of uniqueTags) {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag)?.add(key);
    }

    this.emit({ type: 'set', key, tags: uniqueTags, ttlMs, value });
  }

  invalidateTag(tag: string) {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let removed = 0;
    for (const key of [...keys]) {
      removed += this.invalidateKey(key);
    }

    this.tagIndex.delete(tag);
    this.emit({ type: 'invalidate-tag', tag, removedKeys: removed });
    return removed;
  }

  invalidateTags(tags: string[]) {
    const removed = tags.reduce((acc, tag) => acc + this.invalidateTag(tag), 0);
    this.emit({ type: 'invalidate-tags', tags: [...tags], removedKeys: removed });
    return removed;
  }

  invalidateKey(key: string, reason: 'manual' | 'expired' = 'manual') {
    const entry = this.entries.get(key);
    if (!entry) return 0;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      keys?.delete(key);
      if (keys && keys.size === 0) this.tagIndex.delete(tag);
    }

    this.entries.delete(key);
    this.emit({ type: 'invalidate-key', key, tags: [...entry.tags], reason });
    return 1;
  }

  subscribe(listener: TaggedCacheListener<T>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  stats() {
    return {
      keys: this.entries.size,
      tags: this.tagIndex.size,
      listeners: this.listeners.size
    };
  }

  private emit(event: TaggedCacheEvent<T>) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
