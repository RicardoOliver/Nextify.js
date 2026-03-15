export type TaggedCacheEntry<T> = {
  value: T;
  createdAt: number;
  ttlMs: number;
  tags: string[];
};

export class TaggedCache<T> {
  private entries = new Map<string, TaggedCacheEntry<T>>();
  private tagIndex = new Map<string, Set<string>>();

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.invalidateKey(key);
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
  }

  invalidateTag(tag: string) {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let removed = 0;
    for (const key of keys) {
      removed += this.invalidateKey(key);
    }

    this.tagIndex.delete(tag);
    return removed;
  }

  invalidateTags(tags: string[]) {
    return tags.reduce((acc, tag) => acc + this.invalidateTag(tag), 0);
  }

  invalidateKey(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return 0;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      keys?.delete(key);
      if (keys && keys.size === 0) this.tagIndex.delete(tag);
    }

    this.entries.delete(key);
    return 1;
  }

  stats() {
    return {
      keys: this.entries.size,
      tags: this.tagIndex.size
    };
  }
}
