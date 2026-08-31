import { Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { db } from "../firebaseAdmin.js";
import { buildAuthorizeUrl } from "../swiggy/oauth/authorizeUrl.js";
import { saveOauthState } from "../swiggy/oauth/oauthState.js";
import { generatePkcePair } from "../swiggy/oauth/pkce.js";
import { mockSwiggyToken } from "../swiggy/mockToken.js";
import { requireUid } from "./handlerUtils.js";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export const oauthStartHandler = onCall(async (request) => {
  const uid = requireUid(request);

  // In mock mode there's no real Swiggy account to authorize against, and
  // building a real authorize URL here would redirect the browser to the real
  // mcp.swiggy.com with no way to complete the flow. Short-circuit to an
  // instant local session write instead — same shape scripts/seedSwiggySession.ts
  // writes — so "Connect Swiggy" is a real, working one-click demo action.
  if ((process.env.SWIGGY_MCP_MODE ?? "mock") !== "live") {
    await db
      .collection("swiggy_sessions")
      .doc(uid)
      .set({ token: mockSwiggyToken(uid), expiresAt: Timestamp.fromMillis(Date.now() + FIVE_DAYS_MS) });

    return { authorizeUrl: null };
  }

  const { verifier, challenge } = generatePkcePair();
  const state = await saveOauthState(verifier, uid);

  return { authorizeUrl: buildAuthorizeUrl({ challenge, state }) };
});
