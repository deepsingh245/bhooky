import { cn } from "@/lib/utils";

// Ambient animated brand-colored glow blobs behind page content. Purely
// decorative and non-interactive (pointer-events-none), fixed to the viewport.
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute -top-40 left-1/4 h-[45rem] w-[45rem] animate-aurora rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle at center, var(--brand-1), transparent 60%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[40rem] w-[40rem] animate-aurora rounded-full opacity-30 blur-[120px] [animation-delay:-4s]"
        style={{ background: "radial-gradient(circle at center, var(--brand-2), transparent 60%)" }}
      />
      <div
        className="absolute bottom-0 left-0 h-[35rem] w-[35rem] animate-aurora rounded-full opacity-25 blur-[120px] [animation-delay:-8s]"
        style={{ background: "radial-gradient(circle at center, var(--brand-3), transparent 60%)" }}
      />
      {/* Subtle grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
