import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { mockSwiggyToken } from "../src/swiggy/mockToken.js";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8081";

if (getApps().length === 0) {
  initializeApp({ projectId: "demo-bhooky" });
}

const db = getFirestore();

const uid = process.argv[2];
if (!uid) {
  console.error(
    "Usage: npm run seed -w apps/functions -- <uid>\n\n" +
      "Open the web app once (npm run dev -w apps/web), copy the UID logged to the\n" +
      'browser console as "[bhooky dev] Firebase Auth UID: ...", then run this again\n' +
      "with that UID so search has a session to find.",
  );
  process.exit(1);
}

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  await db
    .collection("swiggy_sessions")
    .doc(uid)
    .set({
      token: mockSwiggyToken(uid),
      expiresAt: Timestamp.fromMillis(Date.now() + FIVE_DAYS_MS),
    });

  console.log(`Seeded a fake Swiggy session for uid "${uid}" (expires in 5 days).`);
}

main().catch((error: unknown) => {
  console.error("Failed to seed Swiggy session", error);
  process.exit(1);
});
