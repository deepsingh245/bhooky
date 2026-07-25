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
