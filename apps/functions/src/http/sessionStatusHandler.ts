import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getSwiggySessionStatus } from "../swiggy/session.js";

// Returns only {connected, expiresAt} — never the raw bearer token. Firestore
// rules also deny direct client reads of swiggy_sessions, so this callable is
// the only path the frontend has to check connection status.
export const sessionStatusHandler = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign-in is required.");
  }

  return getSwiggySessionStatus(request.auth.uid);
});
