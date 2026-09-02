import type { Coupon } from "@bhooky/shared";
import { motion } from "motion/react";
import { BadgePercent, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  coupons: Coupon[];
  appliedCode: string | null;
  onApply: (code: string) => Promise<void>;
}

// Lists fetched coupons with isApplicable styling rather than letting the user
// attempt an apply call that's guaranteed to fail server-side.
export function CouponInput({ coupons, appliedCode, onApply }: CouponInputProps) {
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  async function handleApply(code: string) {
    setApplyingCode(code);
    try {
      await onApply(code);
    } finally {
      setApplyingCode(null);
    }
  }

  if (coupons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <BadgePercent size={15} className="text-primary" />
        Offers for you
      </p>
      <ul className="flex flex-col gap-2">
        {coupons.map((coupon) => {
          const applied = appliedCode === coupon.code;
          return (
            <motion.li
              key={coupon.code}
              layout
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border p-3 text-sm transition-colors",
                applied
                  ? "border-success/40 bg-success/10"
                  : coupon.isApplicable
                    ? "glass border-dashed border-primary/30"
                    : "border-border/50 bg-muted/40 text-muted-foreground",
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary">
                    {coupon.code}
                  </span>
                </p>
                <p className={cn("mt-1 truncate text-xs", !coupon.isApplicable && "text-muted-foreground")}>
                  {coupon.description}
                </p>
              </div>
              {applied ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-success"
                >
                  <Check size={15} /> Applied
                </motion.span>
              ) : (
                <button
                  type="button"
                  disabled={!coupon.isApplicable || applyingCode === coupon.code}
                  onClick={() => handleApply(coupon.code)}
                  className="whitespace-nowrap rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                >
                  {applyingCode === coupon.code ? "Applying…" : "Apply"}
                </button>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
