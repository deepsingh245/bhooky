import { onRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebaseAdmin.js";
import { exchangeCodeForToken } from "../swiggy/oauth/exchangeToken.js";
import { consumeOauthState } from "../swiggy/oauth/oauthState.js";

// Plain HTTPS endpoint, not a callable — Swiggy's redirect lands the user's
// browser here directly with ?code=&state=, so there's no Firebase Auth
// context to check yet (see BHOOKY_BUILD_PLAN.md §7 step 4).
export const oauthCallbackHandler = onRequest(async (req, res) => {
  const frontendUrl = process.env.BHOOKY_WEB_URL ?? "http://localhost:5173";
  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  const state = typeof req.query["state"] === "string" ? req.query["state"] : null;

  if (!code || !state) {
    res.redirect(302, `${frontendUrl}/connect-swiggy?error=missing_code_or_state`);
    return;
  }

  try {
    const { verifier, userId } = await consumeOauthState(state);
    const { token, expiresAt } = await exchangeCodeForToken({ code, verifier });

    await db
      .collection("swiggy_sessions")
      .doc(userId)
      .set({ token, expiresAt: Timestamp.fromMillis(expiresAt) });

    res.redirect(302, `${frontendUrl}/?swiggy_connected=1`);
  } catch (error) {
    console.error("oauthCallbackHandler failed", error);
    res.redirect(302, `${frontendUrl}/connect-swiggy?error=oauth_failed`);
  }
});
