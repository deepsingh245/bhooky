import { AnimatePresence, motion } from "motion/react";
import { AnimatedCartIcon } from "@/components/ui/animated-icons";

export function CartButton({ count }: { count: number }) {
  return (
    <motion.a
      href="/cart"
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="relative grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-secondary/40 text-foreground transition-colors hover:bg-secondary"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
    >
      <AnimatedCartIcon size={20} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0, y: -4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-md"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
