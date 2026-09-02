import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

// Must match apps/functions/src/index.ts's setGlobalOptions({ region }) — the
// client has to request the same region the functions are actually deployed
// (or emulated) under, or every call 404s (which the browser reports as a
// misleading CORS failure, since a 404 response carries no CORS headers).
const FUNCTIONS_REGION = "asia-south1";

// `||`, not `??` — a copied-but-blank .env (VITE_FIREBASE_PROJECT_ID=) is an
// empty string, not undefined/null, so nullish coalescing wouldn't fall back.
function envOrUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

// Falls back to the emulator-only demo-bhooky config when VITE_FIREBASE_* is
// unset (or blank), so local dev behavior is unchanged — set these only once
// deploying against a real Firebase project.
const app = initializeApp({
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-bhooky",
  apiKey: envOrUndefined(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: envOrUndefined(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
});

export const auth = getAuth(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFunctionsEmulator(functions, "127.0.0.1", 5501);
}

// Anonymous sign-in gives request.auth.uid inside Cloud Functions with zero real
// auth setup — Phase 1 has no account system, just a stable per-browser identity.
export const authReady: Promise<void> = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      if (import.meta.env.DEV) {
        console.info(`[bhooky dev] Firebase Auth UID: ${user.uid}`);
      }
      unsubscribe();
      resolve();
      return;
    }
    signInAnonymously(auth).catch((error: unknown) => {
      console.error("Anonymous sign-in failed", error);
    });
  });
});
