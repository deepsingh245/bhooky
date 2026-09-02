import { motion } from "motion/react";
import { CheckCircle2, Link2, Lock, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell.js";
import { callOauthStart } from "../lib/apiClient.js";
import { ShimmerButton } from "@/components/ui/shimmer-button";

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
      }, 1200);
    } catch {
      setError("Couldn't start the Swiggy connection. Please try again.");
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success"
          >
            <CheckCircle2 size={44} />
          </motion.span>
          <h1 className="font-display text-2xl font-bold">Connected!</h1>
          <p className="text-sm text-muted-foreground">Taking you back to Bhooky…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full rounded-3xl p-8 text-center"
        >
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary glow-brand"
          >
            <Link2 size={30} />
          </motion.span>

          <h1 className="mt-5 font-display text-2xl font-bold">Connect your Swiggy account</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Bhooky needs a live Swiggy connection to search restaurants and place orders on your behalf.
          </p>

          <div className="mt-6 flex flex-col gap-3 text-left">
            <Assurance icon={<Lock size={16} />} text="You verify with phone + OTP on Swiggy's own page." />
            <Assurance icon={<ShieldCheck size={16} />} text="Bhooky never sees your Swiggy credentials." />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <ShimmerButton
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="mt-6 w-full py-3"
          >
            {loading ? "Connecting…" : "Connect Swiggy"}
          </ShimmerButton>
        </motion.div>
      </div>
    </AppShell>
  );
}

function Assurance({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 text-sm">
      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-foreground/90">{text}</span>
    </div>
  );
}
