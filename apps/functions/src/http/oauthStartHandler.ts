import { onCall } from "firebase-functions/v2/https";
import { buildAuthorizeUrl } from "../swiggy/oauth/authorizeUrl.js";
import { saveOauthState } from "../swiggy/oauth/oauthState.js";
import { generatePkcePair } from "../swiggy/oauth/pkce.js";
import { requireUid } from "./handlerUtils.js";

export const oauthStartHandler = onCall(async (request) => {
  const uid = requireUid(request);

  const { verifier, challenge } = generatePkcePair();
  const state = await saveOauthState(verifier, uid);

  return { authorizeUrl: buildAuthorizeUrl({ challenge, state }) };
});
