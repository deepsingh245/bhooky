import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

// A light "beam" that travels around the parent's rounded border. Place inside a
// `relative overflow-hidden rounded-*` container.
export function BorderBeam({ size = 200, duration = 6, delay = 0, className }: BorderBeamProps) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] [mask:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] [mask-composite:intersect] [mask-clip:padding-box,border-box]">
      <motion.div
        className={cn(
          "absolute aspect-square bg-gradient-to-l from-brand-1 via-brand-3 to-transparent",
          className,
        )}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)` }}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay }}
      />
    </div>
  );
}
