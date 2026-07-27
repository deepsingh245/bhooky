// Per BHOOKY_BUILD_PLAN.md §7 step 2.
const SWIGGY_OAUTH_SCOPE = "mcp:tools mcp:resources mcp:prompts";

export interface BuildAuthorizeUrlArgs {
  challenge: string;
  state: string;
}

export function buildAuthorizeUrl({ challenge, state }: BuildAuthorizeUrlArgs): string {
  const baseUrl = process.env.SWIGGY_MCP_BASE_URL ?? "https://mcp.swiggy.com";
  const clientId = requireEnv("SWIGGY_OAUTH_CLIENT_ID");
  const redirectUri = requireEnv("SWIGGY_OAUTH_REDIRECT_URI");

  const url = new URL("/auth/authorize", baseUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", SWIGGY_OAUTH_SCOPE);
  return url.toString();
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}
