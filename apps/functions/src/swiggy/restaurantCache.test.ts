import { afterEach, describe, expect, it, vi } from "vitest";

interface FakeDoc {
  payload: unknown;
  expiresAt: { toMillis: () => number };
}

const store = new Map<string, FakeDoc>();

vi.mock("../firebaseAdmin.js", () => ({
  db: {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({ exists: store.has(id), data: () => store.get(id) }),
        set: async (value: FakeDoc) => {
          store.set(id, value);
        },
      }),
    }),
  },
}));

import { getOrFetch } from "./restaurantCache.js";

afterEach(() => {
  store.clear();
  vi.useRealTimers();
});

describe("getOrFetch", () => {
  it("calls fetchFn on a cache miss and writes the result", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ value: 1 });

    const result = await getOrFetch("key-1", fetchFn);

    expect(result).toEqual({ value: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("returns the cached value without calling fetchFn again while fresh", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ value: 2 });

    await getOrFetch("key-2", fetchFn);
    const result = await getOrFetch("key-2", fetchFn);

    expect(result).toEqual({ value: 2 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("calls fetchFn again once the cache entry has expired", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValueOnce({ value: 3 }).mockResolvedValueOnce({ value: 4 });

    await getOrFetch("key-3", fetchFn);
    vi.advanceTimersByTime(4 * 60 * 1000); // past the 3-minute TTL
    const result = await getOrFetch("key-3", fetchFn);

    expect(result).toEqual({ value: 4 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
