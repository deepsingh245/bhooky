import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

// Falls back to the emulator-only demo-bhooky config when VITE_FIREBASE_* is
// unset, so local dev behavior is unchanged — set these only once deploying
// against a real Firebase project.
const app = initializeApp({
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "demo-bhooky",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
});

export const auth = getAuth(app);
export const functions = getFunctions(app);

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
