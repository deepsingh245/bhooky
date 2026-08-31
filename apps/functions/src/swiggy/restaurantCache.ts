import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebaseAdmin.js";

// A few minutes is enough to absorb repeat searches/filter-chip clicks within
// one browsing session without ever risking stale restaurant data.
const RESTAURANT_CACHE_TTL_MS = 3 * 60 * 1000;

interface CacheDoc<T> {
  payload: T;
  expiresAt: FirebaseFirestore.Timestamp;
}

// Sits above SwiggyMcpPort (searchRestaurants.ts/getMenu.ts/getCoupons.ts), never
// inside mockClient.ts/liveClient.ts, so mock and live data never share a cache
// namespace. Manual expiresAt check, same idiom as session.ts's
// getValidSwiggySession — Firestore's native TTL policy (GCP console/gcloud
// config, not repo code) only handles eventual deletion, not synchronous
// freshness, so an app-level check is still required either way.
export async function getOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
  const ref = db.collection("restaurant_cache").doc(hashCacheKey(cacheKey));

  const snapshot = await ref.get();
  if (snapshot.exists) {
    const data = snapshot.data() as CacheDoc<T>;
    if (data.expiresAt.toMillis() > Date.now()) {
      return data.payload;
    }
  }

  const payload = await fetchFn();

  // Awaited (not truly fire-and-forget) so a cache hit on the very next call
  // can't race the write that produced it — a failed write still can't break
  // the caller, since the fetched payload is returned regardless.
  try {
    await ref.set({ payload, expiresAt: Timestamp.fromMillis(Date.now() + RESTAURANT_CACHE_TTL_MS) });
  } catch (error) {
    console.error("restaurantCache write failed", error);
  }

  return payload;
}

// Firestore doc IDs disallow "/" and a few edge cases (bare "." / "..") — a
// hash sidesteps all of that regardless of what characters addressId/query
// text ever contain.
function hashCacheKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
