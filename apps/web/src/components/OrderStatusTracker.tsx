import type { OrderStatus, TrackOrderResponse } from "@bhooky/shared";
import { motion } from "motion/react";
import { Check, ChefHat, CircleCheck, Clock, PackageCheck, Bike, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

const STEPS: OrderStatus[] = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

const STEP_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STEP_ICONS: Record<OrderStatus, ComponentType<{ size?: number }>> = {
  placed: CircleCheck,
  confirmed: Check,
  preparing: ChefHat,
  out_for_delivery: Bike,
  delivered: PackageCheck,
  cancelled: XCircle,
};

interface OrderStatusTrackerProps {
  tracking: TrackOrderResponse;
}

// An animated status stepper, not a map/live-location view — beyond what
// track_food_order needs to provide for an MVP.
export function OrderStatusTracker({ tracking }: OrderStatusTrackerProps) {
  if (tracking.status === "cancelled") {
    return (
      <div className="glass flex items-center gap-3 rounded-2xl border-destructive/40 p-4 text-sm font-medium text-destructive">
        <XCircle size={18} />
        Order cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(tracking.status);
  const progress = currentIndex / (STEPS.length - 1);

  return (
    <div className="glass flex flex-col gap-5 rounded-2xl p-5">
      <div className="relative">
        {/* Track */}
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-border" />
        {/* Animated fill */}
        <motion.div
          className="absolute left-0 top-4 h-1 rounded-full bg-[linear-gradient(90deg,var(--brand-1),var(--brand-3))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <ol className="relative flex items-start justify-between">
          {STEPS.map((step, index) => {
            const done = index <= currentIndex;
            const active = index === currentIndex;
            const Icon = STEP_ICONS[step];
            return (
              <li key={step} className="flex flex-1 flex-col items-center gap-2">
                <motion.span
                  initial={false}
                  animate={{
                    scale: active ? [1, 1.15, 1] : 1,
                    backgroundColor: done ? "var(--primary)" : "var(--muted)",
                    color: done ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                  transition={{ duration: active ? 0.6 : 0.3, repeat: active ? Infinity : 0, repeatDelay: 1.2 }}
                  className="z-10 grid h-8 w-8 place-items-center rounded-full ring-4 ring-[var(--card)]"
                >
                  <Icon size={15} />
                </motion.span>
                <span
                  className={cn(
                    "text-center text-[11px] font-medium",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {tracking.etaMinutes !== null && (
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={14} />
          Arriving in about <span className="font-semibold text-foreground">{tracking.etaMinutes} min</span>
        </div>
      )}
    </div>
  );
}
