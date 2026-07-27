import { createHash, randomBytes } from "node:crypto";

export interface PkcePair {
  verifier: string;
  challenge: string;
}

// 32 random bytes verifier + its SHA-256 challenge, both base64url — per
// BHOOKY_BUILD_PLAN.md §7 step 1. Pure and deterministic given a fixed input,
// so no network/emulator access is needed to unit test this.
export function generatePkcePair(): PkcePair {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
