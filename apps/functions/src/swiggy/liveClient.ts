import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type {
  GetMenuArgs,
  RawSwiggyMenuResponse,
  RawSwiggySearchResponse,
  SearchRestaurantsArgs,
  SwiggyMcpPort,
} from "./types.js";

/**
 * Real Swiggy Food MCP staging client. Unexercised until real Builders Club
 * staging credentials exist (SWIGGY_MCP_MODE=live) — before trusting this in a
 * demo, run a one-off smoke test confirming the Authorization header actually
 * reaches Swiggy's server (there are known version-dependent quirks with custom
 * headers on StreamableHTTPClientTransport) and that the `structuredContent`
 * assumption below matches Swiggy's real tool-result shape.
 */
export class LiveSwiggyMcpClient implements SwiggyMcpPort {
  private clientPromise: Promise<Client> | null = null;

  constructor(private readonly bearerToken: string) {}

  async searchRestaurants(args: SearchRestaurantsArgs): Promise<RawSwiggySearchResponse> {
    return this.callTool<RawSwiggySearchResponse>("search_restaurants", args);
  }

  async getRestaurantMenu(args: GetMenuArgs): Promise<RawSwiggyMenuResponse> {
    return this.callTool<RawSwiggyMenuResponse>("get_restaurant_menu", args);
  }

  private async callTool<T>(name: string, args: object): Promise<T> {
    const client = await this.getClient();
    const result = await client.callTool({ name, arguments: args as Record<string, unknown> });
    return extractToolJson<T>(result);
  }

  private getClient(): Promise<Client> {
    this.clientPromise ??= this.connect();
    return this.clientPromise;
  }

  private async connect(): Promise<Client> {
    const baseUrl = process.env.SWIGGY_MCP_BASE_URL ?? "https://mcp.swiggy.com";
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
      requestInit: { headers: { Authorization: `Bearer ${this.bearerToken}` } },
    });
    const client = new Client({ name: "bhooky", version: "0.1.0" });
    await client.connect(transport);
    return client;
  }
}

function extractToolJson<T>(result: unknown): T {
  const record = result as Record<string, unknown>;

  if (record["structuredContent"] !== undefined) {
    return record["structuredContent"] as T;
  }

  const content = record["content"];
  const textBlock = Array.isArray(content)
    ? content.find(
        (block): block is { type: "text"; text: string } =>
          typeof block === "object" && block !== null && block.type === "text" && typeof block.text === "string",
      )
    : undefined;

  if (!textBlock) {
    throw new Error("Swiggy MCP tool result had neither structuredContent nor a text block to parse");
  }

  return JSON.parse(textBlock.text) as T;
}
