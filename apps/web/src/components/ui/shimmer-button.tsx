import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// A brand-gradient button with a sweeping shimmer highlight — used for primary
// CTAs (search, checkout, connect).
export function ShimmerButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all outline-none",
        "bg-[linear-gradient(100deg,var(--brand-1),var(--brand-2),var(--brand-3))] bg-[length:200%_auto]",
        "shadow-[0_6px_30px_-6px_oklch(0.68_0.2_40_/_0.5)] hover:shadow-[0_10px_40px_-6px_oklch(0.68_0.2_40_/_0.6)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {/* Sweeping light highlight */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
