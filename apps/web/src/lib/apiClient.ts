import type { SearchResponse } from "@bhooky/shared";
import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { authReady, functions } from "./firebase.js";

const SWIGGY_RECONNECT_REASON = "SWIGGY_RECONNECT_REQUIRED";

export class SwiggyReconnectRequiredError extends Error {
  constructor() {
    super("Swiggy session is missing or expired.");
    this.name = "SwiggyReconnectRequiredError";
  }
}

interface SearchRequest {
  rawQuery: string;
  addressId: string;
}

interface SessionStatusResponse {
  connected: boolean;
  expiresAt: number | null;
}

const searchFoodCallable = httpsCallable<SearchRequest, SearchResponse>(functions, "searchHandler");
const sessionStatusCallable = httpsCallable<Record<string, never>, SessionStatusResponse>(
  functions,
  "sessionStatusHandler",
);

export async function callSearchFood(rawQuery: string, addressId: string): Promise<SearchResponse> {
  await authReady;
  try {
    const result: HttpsCallableResult<SearchResponse> = await searchFoodCallable({ rawQuery, addressId });
    return result.data;
  } catch (error) {
    if (isReconnectRequiredError(error)) {
      throw new SwiggyReconnectRequiredError();
    }
    throw error;
  }
}

export async function callSessionStatus(): Promise<SessionStatusResponse> {
  await authReady;
  const result = await sessionStatusCallable({});
  return result.data;
}

function isReconnectRequiredError(error: unknown): boolean {
  const details = (error as { details?: { reason?: unknown } }).details;
  return details?.reason === SWIGGY_RECONNECT_REASON;
}
