import type { ParsedIntent } from "@bhooky/shared";
import { db } from "../firebaseAdmin.js";

// Fire-and-forget from searchFood.ts's perspective: a logging failure must never
// fail a search, so errors are swallowed (and reported) here rather than thrown.
export async function logQuery(
  userId: string,
  rawQuery: string,
  intent: ParsedIntent,
  topResultIds: string[],
): Promise<void> {
  try {
    await db.collection("queries").add({
      userId,
      rawQuery,
      intent,
      topResultIds,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("logQuery failed", error);
  }
}
