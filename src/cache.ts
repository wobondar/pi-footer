export const CACHE_NAMESPACES = { runtime: "runtime", git: "git" } as const;
type CacheNamespace = (typeof CACHE_NAMESPACES)[keyof typeof CACHE_NAMESPACES];

interface CacheEntry<V> {
  value: V | null;
  updatedAt: number | null;
  pending: Promise<void> | null;
  // Bumped by invalidate(); a refresh that started before the bump must not mark the entry fresh.
  generation: number;
  listeners: Set<() => void>;
}

export class AsyncCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(maxEntries = 200, now: () => number = () => Date.now()) {
    this.maxEntries = maxEntries;
    this.now = now;
  }

  get<K, V, F>(
    ns: CacheNamespace,
    key: K,
    ttlMs: number,
    filter: F,
    fetcher: (filter: F) => Promise<V | null>,
    onRefresh?: () => void,
  ): V | null {
    const cacheKey = this.cacheKey(ns, key);
    const entry = this.entryFor<V>(cacheKey);
    if (this.isFresh(entry, ttlMs)) return entry.value;

    this.addListener(entry, onRefresh);
    if (!entry.pending) entry.pending = this.refresh(entry, filter, fetcher);

    return entry.value;
  }

  clear(): void {
    this.entries.clear();
  }

  // Keep cached values for display, but force the next get() in the namespace to refetch.
  invalidate(ns: CacheNamespace): void {
    const prefix = `${ns}:`;
    for (const [key, entry] of this.entries) {
      if (!key.startsWith(prefix)) continue;
      entry.updatedAt = null;
      entry.generation += 1;
    }
  }

  private entryFor<V>(cacheKey: string): CacheEntry<V> {
    const cached = this.entries.get(cacheKey);
    if (cached) return cached as CacheEntry<V>;

    const entry: CacheEntry<V> = {
      value: null,
      updatedAt: null,
      pending: null,
      generation: 0,
      listeners: new Set(),
    };
    this.entries.set(cacheKey, entry as CacheEntry<unknown>);
    this.evictOldestEntry();
    return entry;
  }

  private isFresh<V>(entry: CacheEntry<V>, ttlMs: number): boolean {
    return entry.updatedAt !== null && this.now() - entry.updatedAt < ttlMs;
  }

  private addListener<V>(entry: CacheEntry<V>, listener: (() => void) | undefined): void {
    if (listener) entry.listeners.add(listener);
  }

  private async refresh<V, F>(
    entry: CacheEntry<V>,
    filter: F,
    fetcher: (filter: F) => Promise<V | null>,
  ): Promise<void> {
    const generation = entry.generation;
    try {
      entry.value = await fetcher(filter);
    } catch {
      entry.value = null;
    } finally {
      entry.updatedAt = entry.generation === generation ? this.now() : null;
      entry.pending = null;
      this.notify(entry);
    }
  }

  private notify<V>(entry: CacheEntry<V>): void {
    const listeners = [...entry.listeners];
    entry.listeners.clear();

    for (const listener of listeners) {
      try {
        listener();
      } catch {
        // Cache refresh notifications are best-effort.
      }
    }
  }

  private evictOldestEntry(): void {
    if (this.entries.size <= this.maxEntries) return;
    const oldestKey = this.entries.keys().next().value;
    if (oldestKey !== undefined) this.entries.delete(oldestKey);
  }

  private cacheKey<K>(ns: CacheNamespace, key: K): string {
    return `${ns}:${String(key)}`;
  }
}

export const asyncCache = new AsyncCache();
