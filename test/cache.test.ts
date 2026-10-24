import { describe, expect, it, vi } from "vitest";

import { AsyncCache, CACHE_NAMESPACES, asyncCache } from "../src/cache.js";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AsyncCache", () => {
  it("exports one shared async cache instance", () => {
    expect(asyncCache).toBeInstanceOf(AsyncCache);
  });

  it("returns null on miss, loads asynchronously, and notifies listeners", async () => {
    let now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const loaded = deferred<string | null>();
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(() => loaded.promise);
    const onRefresh = vi.fn<() => void>();

    expect(
      cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher, onRefresh),
    ).toBeNull();
    expect(fetcher).toHaveBeenCalledWith("/repo");

    now = 1_010;
    loaded.resolve("node");
    await loaded.promise;
    await Promise.resolve();

    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBe("node");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("returns fresh values without reloading", async () => {
    let now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => "node");

    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBeNull();
    await Promise.resolve();

    now = 1_050;
    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBe("node");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses the request ttl for freshness", async () => {
    let now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => "node");

    cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher);
    await Promise.resolve();

    now = 1_050;
    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 10, "/repo", fetcher)).toBe("node");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("invalidate keeps the value but forces a refetch in that namespace only", async () => {
    const now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => "main");

    cache.get(CACHE_NAMESPACES.git, "/repo", 100, "/repo", fetcher);
    cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher);
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(2);

    cache.invalidate(CACHE_NAMESPACES.git);

    expect(cache.get(CACHE_NAMESPACES.git, "/repo", 100, "/repo", fetcher)).toBe("main");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBe("main");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("does not mark a refresh fresh if it was invalidated while in flight", async () => {
    const now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const inFlight = deferred<string | null>();
    const fetcher = vi
      .fn<(cwd: string) => Promise<string | null>>()
      .mockImplementationOnce(() => inFlight.promise)
      .mockImplementation(async () => "after");

    cache.get(CACHE_NAMESPACES.git, "/repo", 100, "/repo", fetcher);
    cache.invalidate(CACHE_NAMESPACES.git);
    inFlight.resolve("before");
    await inFlight.promise;
    await Promise.resolve();

    // The pre-invalidation result is shown, but the next read refetches.
    expect(cache.get(CACHE_NAMESPACES.git, "/repo", 100, "/repo", fetcher)).toBe("before");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns stale values while refreshing", async () => {
    let now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const firstFetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => "node");

    cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", firstFetcher);
    await Promise.resolve();

    now = 1_200;
    const refreshed = deferred<string | null>();
    const secondFetcher = vi.fn<(cwd: string) => Promise<string | null>>(() => refreshed.promise);
    const onRefresh = vi.fn<() => void>();

    expect(
      cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", secondFetcher, onRefresh),
    ).toBe("node");
    expect(secondFetcher).toHaveBeenCalledTimes(1);

    refreshed.resolve("bun");
    await refreshed.promise;
    await Promise.resolve();

    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", secondFetcher)).toBe("bun");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shares pending refreshes and notifies every listener once", async () => {
    const cache = new AsyncCache();
    const loaded = deferred<string | null>();
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(() => loaded.promise);
    const firstListener = vi.fn<() => void>();
    const secondListener = vi.fn<() => void>();

    expect(
      cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher, firstListener),
    ).toBeNull();
    expect(
      cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher, secondListener),
    ).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);

    loaded.resolve("node");
    await loaded.promise;
    await Promise.resolve();

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it("evicts the oldest entry when maxEntries is exceeded", async () => {
    const cache = new AsyncCache(2);
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(async (cwd) => cwd);

    cache.get(CACHE_NAMESPACES.runtime, "one", 100, "one", fetcher);
    cache.get(CACHE_NAMESPACES.runtime, "two", 100, "two", fetcher);
    cache.get(CACHE_NAMESPACES.runtime, "three", 100, "three", fetcher);
    await Promise.resolve();

    expect(cache.get(CACHE_NAMESPACES.runtime, "two", 100, "two", fetcher)).toBe("two");
    expect(cache.get(CACHE_NAMESPACES.runtime, "three", 100, "three", fetcher)).toBe("three");
    expect(cache.get(CACHE_NAMESPACES.runtime, "one", 100, "one", fetcher)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("treats failed and null loads as cached misses", async () => {
    let now = 1_000;
    const cache = new AsyncCache(200, () => now);
    const failingFetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => {
      throw new Error("boom");
    });
    const nullFetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => null);
    const onRefresh = vi.fn<() => void>();

    expect(
      cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", failingFetcher, onRefresh),
    ).toBeNull();
    await Promise.resolve();

    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", nullFetcher)).toBeNull();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    now = 1_050;
    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", nullFetcher)).toBeNull();
    expect(nullFetcher).toHaveBeenCalledTimes(0);
  });

  it("clears every entry", async () => {
    const cache = new AsyncCache();
    const fetcher = vi.fn<(cwd: string) => Promise<string | null>>(async () => "node");

    cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher);
    await Promise.resolve();
    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBe("node");

    cache.clear();

    expect(cache.get(CACHE_NAMESPACES.runtime, "/repo", 100, "/repo", fetcher)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
