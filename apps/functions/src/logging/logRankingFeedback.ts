import type { ScoreBreakdown } from "@bhooky/shared";
import { db } from "../firebaseAdmin.js";

export type RankingFeedbackAction = "added_to_cart" | "ordered";

export interface RankingFeedbackImpression {
  rank: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

// Fire-and-forget, same never-throw pattern as logQuery.ts. impression is only
// ever available for "added_to_cart" (the frontend has the RankedCard it just
// rendered at that moment) — "ordered" happens well after the original ranked
// view, so it's logged with impression: null; analyzeRankingFeedback.ts only
// draws signal from events that do carry one.
export async function logRankingFeedback(
  userId: string,
  menuItemId: string,
  restaurantId: string,
  action: RankingFeedbackAction,
  impression: RankingFeedbackImpression | null = null,
): Promise<void> {
  try {
    await db.collection("ranking_feedback").add({
      userId,
      menuItemId,
      restaurantId,
      action,
      impression,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("logRankingFeedback failed", error);
  }
}
