import type { ScoreBreakdown } from "@bhooky/shared";
import { RANKING_WEIGHTS } from "@bhooky/shared";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8081";

if (getApps().length === 0) {
  initializeApp({ projectId: "demo-bhooky" });
}

const db = getFirestore();

interface RankingFeedbackDoc {
  action: "added_to_cart" | "ordered";
  impression: { rank: number; score: number; scoreBreakdown: ScoreBreakdown } | null;
}

interface RankingFeedbackDocWithImpression extends RankingFeedbackDoc {
  impression: { rank: number; score: number; scoreBreakdown: ScoreBreakdown };
}

const SCORE_FACTORS = ["budgetMatch", "distance", "rating", "offer", "intentMatch"] as const;

// Deliberately modest — this is a human-reviewed signal, never auto-applied
// to RANKING_WEIGHTS. See plans/... Phase 3: no scheduled/auto-tuning job
// exists in this repo on purpose, given zero real production traffic so far.
const HIGH_SIGNAL_THRESHOLD = 0.7;
const LOW_SIGNAL_THRESHOLD = 0.3;
const SUGGESTED_NUDGE = 0.05;

async function main(): Promise<void> {
  const snapshot = await db.collection("ranking_feedback").get();
  const events = snapshot.docs
    .map((doc) => doc.data() as RankingFeedbackDoc)
    .filter((event): event is RankingFeedbackDocWithImpression => event.impression !== null);

  if (events.length === 0) {
    console.log(
      "No ranking_feedback events with impression data yet — add a few items to cart from search results, then re-run.",
    );
    return;
  }

  const averageRank = average(events.map((event) => event.impression.rank));
  console.log(
    `Analyzed ${events.length} feedback event(s) with impression data. Average rank at time of action: ${averageRank.toFixed(2)}`,
  );
  console.log("");
  console.log("Average scoreBreakdown factor value among converted items (0-1 scale):");

  for (const factor of SCORE_FACTORS) {
    const avg = average(events.map((event) => event.impression.scoreBreakdown[factor]));
    const currentWeight = RANKING_WEIGHTS[factor];
    console.log(`  ${factor}: ${avg.toFixed(2)} (current weight: ${currentWeight})`);

    if (avg >= HIGH_SIGNAL_THRESHOLD) {
      const suggested = (currentWeight + SUGGESTED_NUDGE).toFixed(2);
      console.log(`    -> consistently high among converted items — consider ${factor}: ${currentWeight} -> ${suggested}`);
    } else if (avg <= LOW_SIGNAL_THRESHOLD) {
      const suggested = Math.max(0, currentWeight - SUGGESTED_NUDGE).toFixed(2);
      console.log(`    -> consistently low among converted items — consider ${factor}: ${currentWeight} -> ${suggested}`);
    }
  }

  console.log("");
  console.log(
    "These are suggestions only, based on a small/biased sample (only add-to-cart events carry impression data).",
  );
  console.log("Review and manually edit packages/shared/src/constants/rankingWeights.ts if you agree.");
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

main().catch((error: unknown) => {
  console.error("Failed to analyze ranking feedback", error);
  process.exit(1);
});
