export class SmartCache {
    store = new Map();
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.createdAt > entry.ttlMs) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    set(key, value, ttlMs = 60_000) {
        this.store.set(key, { value, createdAt: Date.now(), ttlMs });
    }
}
