import type { ParsedIntent } from "@bhooky/shared";
import { motion } from "motion/react";
import { SparkleIcon } from "@/components/ui/animated-icons";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  intent: ParsedIntent;
  onChange: (nextIntent: ParsedIntent) => void;
}

const FOOD_TYPE_CYCLE: ParsedIntent["food_type"][] = ["any", "veg", "non_veg"];
const TIME_CYCLE: ParsedIntent["time"][] = ["any", "lunch", "dinner", "late_night"];

// Editing a chip re-triggers a search built from the edited intent (see
// SearchPage.tsx's intentToQueryString) rather than mutating state in place —
// Gemini re-parses every query, so the edited intent is a hint, not a guarantee.
export function FilterChips({ intent, onChange }: FilterChipsProps) {
  function cycleFoodType() {
    const next = FOOD_TYPE_CYCLE[(FOOD_TYPE_CYCLE.indexOf(intent.food_type) + 1) % FOOD_TYPE_CYCLE.length];
    if (next) onChange({ ...intent, food_type: next });
  }

  function cycleTime() {
    const next = TIME_CYCLE[(TIME_CYCLE.indexOf(intent.time) + 1) % TIME_CYCLE.length];
    if (next) onChange({ ...intent, time: next });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
        <SparkleIcon size={13} />
        Understood as
      </span>
      <Chip label={formatFoodType(intent.food_type)} active={intent.food_type !== "any"} onClick={cycleFoodType} />
      <Chip label={formatTime(intent.time)} active={intent.time !== "any"} onClick={cycleTime} />
      {intent.taste && <Chip label={`“${intent.taste}”`} active readOnly />}
      {intent.budget !== null && <Chip label={`under ₹${intent.budget}`} active readOnly />}
    </motion.div>
  );
}

function Chip({
  label,
  active,
  onClick,
  readOnly,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      disabled={readOnly}
      whileTap={readOnly ? undefined : { scale: 0.94 }}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        readOnly && "cursor-default",
      )}
    >
      {label}
    </motion.button>
  );
}

function formatFoodType(foodType: ParsedIntent["food_type"]): string {
  if (foodType === "veg") return "Veg";
  if (foodType === "non_veg") return "Non-veg";
  return "Any food type";
}

function formatTime(time: ParsedIntent["time"]): string {
  if (time === "any") return "Any time";
  return time.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
