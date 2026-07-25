import { LiveSwiggyMcpClient } from "./liveClient.js";
import { MockSwiggyMcpClient } from "./mockClient.js";
import type { SwiggyMcpPort } from "./types.js";

// SWIGGY_MCP_MODE defaults to "mock" so a fresh clone works with zero Swiggy
// credentials. Flipping to "live" plus supplying a real staging bearer token is
// the only change needed — nothing else in searchFood.ts, searchHandler.ts, or
// the frontend ever branches on mock-vs-live.
export function getSwiggyMcpClient(bearerToken: string): SwiggyMcpPort {
  const mode = process.env.SWIGGY_MCP_MODE ?? "mock";
  return mode === "live" ? new LiveSwiggyMcpClient(bearerToken) : new MockSwiggyMcpClient();
}
