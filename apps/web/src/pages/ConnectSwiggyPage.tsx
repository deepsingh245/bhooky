import { useState } from "react";
import { callOauthStart } from "../lib/apiClient.js";

// Real implementation of the Phase 1 placeholder route. A single button that
// does a full-page redirect (not a fetch/XHR) since a real (live-mode) connect
// has to leave the SPA entirely for Swiggy's own phone/OTP page. In mock mode,
// oauthStartHandler short-circuits to an instant session write and returns
// authorizeUrl: null — there's nothing to redirect to, so this shows a brief
// confirmation and returns to the app instead.
export function ConnectSwiggyPage() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const authorizeUrl = await callOauthStart();
      if (authorizeUrl) {
        window.location.href = authorizeUrl;
        return;
      }
      setConnected(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch {
      setError("Couldn't start the Swiggy connection. Please try again.");
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Connected!</h1>
        <p className="text-sm text-gray-500">Taking you back to Bhooky…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Connect your Swiggy account</h1>
      <p className="text-sm text-gray-500">
        Bhooky needs a live Swiggy connection to search restaurants and place orders on your behalf. You&apos;ll
        verify with your phone number and OTP on Swiggy&apos;s own page — Bhooky never sees your Swiggy credentials.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {loading ? "Connecting…" : "Connect Swiggy"}
      </button>
    </main>
  );
}
