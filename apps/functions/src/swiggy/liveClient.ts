import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { logger } from "firebase-functions";
import { instrumentMcpCall } from "../observability/mcpInstrumentation.js";
import type {
  ApplyCouponArgs,
  FetchCouponsArgs,
  GetCartArgs,
  GetFoodOrdersArgs,
  GetMenuArgs,
  PlaceOrderArgs,
  RawSwiggyAddressesResponse,
  RawSwiggyCart,
  RawSwiggyCouponsResponse,
  RawSwiggyMenuResponse,
  RawSwiggyOrder,
  RawSwiggyOrdersResponse,
  RawSwiggySearchResponse,
  RawSwiggyTrackOrderResponse,
  SearchRestaurantsArgs,
  SwiggyMcpPort,
  TrackOrderArgs,
  UpdateCartArgs,
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

  async getAddresses(): Promise<RawSwiggyAddressesResponse> {
    return this.callTool<RawSwiggyAddressesResponse>("get_addresses", {});
  }

  async getFoodCart(args: GetCartArgs): Promise<RawSwiggyCart> {
    return this.callTool<RawSwiggyCart>("get_food_cart", args);
  }

  async updateFoodCart(args: UpdateCartArgs): Promise<RawSwiggyCart> {
    return this.callTool<RawSwiggyCart>("update_food_cart", args);
  }

  async fetchFoodCoupons(args: FetchCouponsArgs): Promise<RawSwiggyCouponsResponse> {
    return this.callTool<RawSwiggyCouponsResponse>("fetch_food_coupons", args);
  }

  async applyFoodCoupon(args: ApplyCouponArgs): Promise<RawSwiggyCart> {
    return this.callTool<RawSwiggyCart>("apply_food_coupon", args);
  }

  async placeFoodOrder(args: PlaceOrderArgs): Promise<RawSwiggyOrder> {
    return this.callTool<RawSwiggyOrder>("place_food_order", args);
  }

  async trackFoodOrder(args: TrackOrderArgs): Promise<RawSwiggyTrackOrderResponse> {
    return this.callTool<RawSwiggyTrackOrderResponse>("track_food_order", args);
  }

  async getFoodOrders(args: GetFoodOrdersArgs): Promise<RawSwiggyOrdersResponse> {
    return this.callTool<RawSwiggyOrdersResponse>("get_food_orders", args);
  }

  private async callTool<T>(name: string, args: object): Promise<T> {
    return instrumentMcpCall(name, async () => {
      const client = await this.getClient();
      const result = await client.callTool({ name, arguments: args as Record<string, unknown> });
      logRawResultShape(name, result);
      return extractToolJson<T>(result);
    });
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

// Every Raw* type in types.ts is an unverified guess until real Swiggy
// responses are seen (see this file's header comment) — this turns "guess
// what Swiggy's real field names are" into "read them off the emulator log"
// for the first live call to each tool. Cheap and harmless to leave in
// permanently; useful again any time a tool's response shape changes.
function logRawResultShape(toolName: string, result: unknown): void {
  const record = result as Record<string, unknown>;
  const structuredContent = record["structuredContent"];
  const content = record["content"];

  logger.info("mcp_raw_shape", {
    tool: toolName,
    hasStructuredContent: structuredContent !== undefined,
    structuredContentKeys:
      structuredContent && typeof structuredContent === "object" ? Object.keys(structuredContent) : null,
    contentBlockTypes: Array.isArray(content)
      ? content.map((block) =>
          typeof block === "object" && block !== null ? ((block as { type?: unknown }).type ?? "unknown") : typeof block,
        )
      : null,
  });
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
