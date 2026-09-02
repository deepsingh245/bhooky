import { motion } from "motion/react";

// Small set of motion-driven icons. Each animates on hover of its nearest
// `group` ancestor (add `className="group"` to the wrapper), matching the
// interaction style of animateicons.in.

export function AnimatedSearchIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.circle
        cx="11"
        cy="11"
        r="7"
        variants={{ rest: { scale: 1 }, hover: { scale: 0.9 } }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />
      <motion.line
        x1="16.5"
        y1="16.5"
        x2="21"
        y2="21"
        variants={{ rest: { x: 0, y: 0 }, hover: { x: 1.5, y: 1.5 } }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />
    </svg>
  );
}

export function AnimatedCartIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <motion.circle
        cx="9"
        cy="20"
        r="1.6"
        fill="currentColor"
        stroke="none"
        variants={{ rest: { y: 0 }, hover: { y: [0, -2, 0] } }}
        transition={{ duration: 0.4 }}
      />
      <motion.circle
        cx="17"
        cy="20"
        r="1.6"
        fill="currentColor"
        stroke="none"
        variants={{ rest: { y: 0 }, hover: { y: [0, -2, 0] } }}
        transition={{ duration: 0.4, delay: 0.06 }}
      />
    </svg>
  );
}

export function AnimatedPinIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.g
        variants={{ rest: { y: 0 }, hover: { y: [-1, -3, -1] } }}
        transition={{ duration: 0.5 }}
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="2.6" fill="currentColor" stroke="none" />
      </motion.g>
    </svg>
  );
}

// A small AI "spark" used to mark Gemini-parsed intent.
export function SparkleIcon({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <motion.path
        d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"
        animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

// Bhooky wordmark glyph — a stylized bowl with steam.
export function BhookyMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="bhooky-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-1)" />
          <stop offset="55%" stopColor="var(--brand-2)" />
          <stop offset="100%" stopColor="var(--brand-3)" />
        </linearGradient>
      </defs>
      <path
        d="M4 16h24a12 12 0 0 1-24 0z"
        fill="url(#bhooky-mark)"
      />
      <path d="M4 16h24" stroke="url(#bhooky-mark)" strokeWidth="2.4" strokeLinecap="round" />
      {[11, 16, 21].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x} 10c-1.2-1.4 1.2-2.6 0-4`}
          stroke="var(--brand-1)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          animate={{ y: [0, -2, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}
    </svg>
  );
}
