import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Rotating hero taglines with a typewriter effect on the highlighted keyword.
const PHRASES: { before: string; keyword: string; after: string }[] = [
  { before: "From ", keyword: "craving", after: " to cart, in seconds." },
  { before: "From ", keyword: "hungry", after: " to happy, in minutes." },
  { before: "From ", keyword: "idea", after: " to order, instantly." },
  { before: "From ", keyword: "“spicy & cheap”", after: " to dinner, sorted." },
];

const TYPE_MS = 85;
const DELETE_MS = 40;
const HOLD_MS = 1900;

export function RotatingHeadline({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const phrase = PHRASES[phraseIndex]!;

  useEffect(() => {
    if (reduceMotion) return; // Show full first phrase, no typing.
    const full = phrase.keyword;
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charCount < full.length) {
      timeout = setTimeout(() => setCharCount((c) => c + 1), TYPE_MS);
    } else if (!deleting && charCount === full.length) {
      timeout = setTimeout(() => setDeleting(true), HOLD_MS);
    } else if (deleting && charCount > 0) {
      timeout = setTimeout(() => setCharCount((c) => c - 1), DELETE_MS);
    } else {
      // Fully deleted — advance to the next phrase (before/after swap here).
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }

    return () => clearTimeout(timeout);
  }, [charCount, deleting, phrase.keyword, reduceMotion]);

  const typed = reduceMotion ? phrase.keyword : phrase.keyword.slice(0, charCount);

  return (
    <h1 className={className} aria-label={`${phrase.before}${phrase.keyword}${phrase.after}`}>
      {phrase.before}
      <span className="text-gradient-brand">{typed}</span>
      {!reduceMotion && (
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="ml-0.5 inline-block w-[3px] translate-y-[2px] self-center bg-primary"
          style={{ height: "0.9em" }}
        />
      )}
      {phrase.after}
    </h1>
  );
}
