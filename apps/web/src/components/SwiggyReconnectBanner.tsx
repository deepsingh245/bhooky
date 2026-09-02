import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";

export function SwiggyReconnectBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-start justify-between gap-3 rounded-2xl border-amber-500/40 p-4 text-sm sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-500">
          <AlertTriangle size={18} />
        </span>
        <span className="text-foreground/90">
          Your Swiggy connection needs reconnecting to search live restaurants.
        </span>
      </div>
      <a
        href="/connect-swiggy"
        className="whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2 font-medium text-amber-950 transition-transform hover:scale-[1.03] active:scale-95"
      >
        Reconnect Swiggy
      </a>
    </motion.div>
  );
}
