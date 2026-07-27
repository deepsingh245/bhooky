import { db } from "../firebaseAdmin.js";

export class SwiggySessionExpiredError extends Error {
  constructor(userId: string) {
    super(`Swiggy session for user ${userId} is missing or expired`);
    this.name = "SwiggySessionExpiredError";
  }
}

interface SwiggySessionDoc {
  token: string;
  expiresAt: FirebaseFirestore.Timestamp;
}

export interface SwiggySessionStatus {
  connected: boolean;
  expiresAt: number | null;
}

export async function getValidSwiggySession(userId: string): Promise<{ token: string }> {
  const snapshot = await db.collection("swiggy_sessions").doc(userId).get();
  if (!snapshot.exists) {
    throw new SwiggySessionExpiredError(userId);
  }

  const data = snapshot.data() as SwiggySessionDoc;
  if (!data.token || data.expiresAt.toMillis() <= Date.now()) {
    throw new SwiggySessionExpiredError(userId);
  }

  return { token: data.token };
}

// Any live MCP call that comes back 401 (real revocation before the 5-day
// expiry) should call this so the *next* getValidSwiggySession fails fast
// without hitting Swiggy again — see BHOOKY_BUILD_PLAN.md §7 step 6, "there is
// no silent refresh, treat any 401 as re-run authorization."
export async function invalidateSwiggySession(userId: string): Promise<void> {
  await db.collection("swiggy_sessions").doc(userId).delete();
}

// Placeholder heuristic: the MCP SDK doesn't expose a typed error code for a
// live 401, so this checks the message text. Reconcile against Swiggy's real
// error shape the first time SWIGGY_MCP_MODE=live is exercised against
// staging, same caveat as liveClient.ts's Raw* shapes.
export function isSwiggyUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && /\b401\b/.test(error.message);
}

export async function getSwiggySessionStatus(userId: string): Promise<SwiggySessionStatus> {
  try {
    const { token: _token } = await getValidSwiggySession(userId);
    const snapshot = await db.collection("swiggy_sessions").doc(userId).get();
    const data = snapshot.data() as SwiggySessionDoc;
    return { connected: true, expiresAt: data.expiresAt.toMillis() };
  } catch (error) {
    if (error instanceof SwiggySessionExpiredError) {
      return { connected: false, expiresAt: null };
    }
    throw error;
  }
}
