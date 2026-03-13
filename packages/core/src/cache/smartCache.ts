export type CacheMode = 'force-cache' | 'stale-while-revalidate' | 'no-store';

type CacheEntry<T> = {
  value: T;
  createdAt: number;
  ttlMs: number;
};

export class SmartCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = 60_000) {
    this.store.set(key, { value, createdAt: Date.now(), ttlMs });
  }
}
