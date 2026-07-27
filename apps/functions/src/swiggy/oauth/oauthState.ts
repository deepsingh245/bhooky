import { randomUUID } from "node:crypto";
import { db } from "../../firebaseAdmin.js";

// Long enough to cover Swiggy's own phone/OTP verification page, short enough
// to keep the window a CSRF-relevant secret stays alive small.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

interface OauthStateDoc {
  verifier: string;
  userId: string;
  createdAt: number;
}

// The uid is embedded here (not just the verifier) so oauthCallbackHandler.ts
// — which runs with no Firebase Auth context, since Swiggy redirects the raw
// browser there — can recover which user this callback belongs to.
export async function saveOauthState(verifier: string, userId: string): Promise<string> {
  const state = randomUUID();
  const doc: OauthStateDoc = { verifier, userId, createdAt: Date.now() };
  await db.collection("oauth_states").doc(state).set(doc);
  return state;
}

// Single-use: deletes the doc after reading it, and throws on unknown/expired
// state so a replayed or forged state can never be consumed twice.
export async function consumeOauthState(state: string): Promise<{ verifier: string; userId: string }> {
  const ref = db.collection("oauth_states").doc(state);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error(`Unknown or already-consumed oauth state: ${state}`);
  }

  const data = snapshot.data() as OauthStateDoc;
  await ref.delete();

  if (Date.now() - data.createdAt > OAUTH_STATE_TTL_MS) {
    throw new Error(`Expired oauth state: ${state}`);
  }

  return { verifier: data.verifier, userId: data.userId };
}
