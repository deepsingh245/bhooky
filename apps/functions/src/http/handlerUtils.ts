import { logger } from "firebase-functions";
import type { CallableRequest } from "firebase-functions/v2/https";
import { HttpsError } from "firebase-functions/v2/https";
import type { ZodType } from "zod";
import { SwiggySessionExpiredError } from "../swiggy/session.js";

export function requireUid(request: CallableRequest): string {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign-in is required.");
  }
  return request.auth.uid;
}

export function parseRequest<T>(schema: ZodType<T>, data: unknown, message: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", message);
  }
  return parsed.data;
}

// Every handler that talks to Swiggy needs this exact translation so the
// existing SwiggyReconnectBanner.tsx / apiClient.ts's isReconnectRequiredError
// keep working unchanged.
export async function withSwiggyReconnect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof SwiggySessionExpiredError) {
      throw new HttpsError("failed-precondition", "Swiggy session is missing or expired.", {
        reason: "SWIGGY_RECONNECT_REQUIRED",
      });
    }
    // Every onCall handler funnels through this one function, so this is the
    // single choke point for blanket error visibility — see
    // observability/mcpInstrumentation.ts for the equivalent on MCP calls.
    logger.error("handler_error", { message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
