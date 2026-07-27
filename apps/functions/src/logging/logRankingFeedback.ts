import { db } from "../firebaseAdmin.js";

export type RankingFeedbackAction = "added_to_cart" | "ordered";

// Fire-and-forget, same never-throw pattern as logQuery.ts. Phase 2 only
// produces this data; Phase 3's weight-tuning job is what consumes it.
export async function logRankingFeedback(
  userId: string,
  menuItemId: string,
  action: RankingFeedbackAction,
): Promise<void> {
  try {
    await db.collection("ranking_feedback").add({ userId, menuItemId, action, createdAt: new Date() });
  } catch (error) {
    console.error("logRankingFeedback failed", error);
  }
}
