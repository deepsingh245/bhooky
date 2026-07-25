export function SwiggyReconnectBanner() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <span>Your Swiggy connection has expired. Reconnect to keep searching live restaurants.</span>
      {/* Phase 1 has no real Swiggy OAuth entry point wired into the frontend yet
          (that's the Phase 0 PKCE flow) — this is a placeholder target. */}
      <a
        href="/connect-swiggy"
        className="whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white"
      >
        Reconnect Swiggy
      </a>
    </div>
  );
}
