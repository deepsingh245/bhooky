import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BhookyMark } from "@/components/ui/animated-icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppShellProps {
  children: ReactNode;
  /** Page-specific controls rendered in the header, left of the theme toggle. */
  headerExtra?: ReactNode;
}

export function AppShell({ children, headerExtra }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <header className="sticky top-0 z-40 border-b border-border/60">
        <div className="glass">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
            <a href="/" className="group flex items-center gap-2.5">
              <BhookyMark size={30} />
              <span className="font-display text-xl font-bold tracking-tight text-gradient-brand">
                Bhooky
              </span>
            </a>

            <div className="flex items-center gap-2 sm:gap-3">
              {headerExtra}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
