import { requireEnv } from "./authorizeUrl.js";

// Per BHOOKY_BUILD_PLAN.md §7 step 4 — 5-day bearer token, no refresh token.
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface ExchangeCodeArgs {
  code: string;
  verifier: string;
}

export interface ExchangedToken {
  token: string;
  expiresAt: number;
}

interface TokenResponseBody {
  access_token: string;
}

export async function exchangeCodeForToken({ code, verifier }: ExchangeCodeArgs): Promise<ExchangedToken> {
  const baseUrl = process.env.SWIGGY_MCP_BASE_URL ?? "https://mcp.swiggy.com";
  const clientId = requireEnv("SWIGGY_OAUTH_CLIENT_ID");
  const redirectUri = requireEnv("SWIGGY_OAUTH_REDIRECT_URI");

  const response = await fetch(new URL("/auth/token", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Swiggy token exchange failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as TokenResponseBody;
  return { token: body.access_token, expiresAt: Date.now() + FIVE_DAYS_MS };
}
