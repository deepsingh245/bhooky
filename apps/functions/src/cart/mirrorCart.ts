import type { Cart } from "@bhooky/shared";
import { db } from "../firebaseAdmin.js";

// Optimistic local mirror only — getCartHandler always calls port.getFoodCart as
// source of truth. This exists purely to prime instant UI state on next load.
// Fire-and-forget, same never-throw pattern as logQuery.ts.
export async function mirrorCart(userId: string, cart: Cart): Promise<void> {
  try {
    await db
      .collection("carts")
      .doc(userId)
      .set({ ...cart, updatedAt: new Date() });
  } catch (error) {
    console.error("mirrorCart failed", error);
  }
}
