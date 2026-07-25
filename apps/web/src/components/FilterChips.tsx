import type { ParsedIntent } from "@bhooky/shared";

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
    <div className="flex flex-wrap gap-2">
      <Chip label={formatFoodType(intent.food_type)} onClick={cycleFoodType} />
      <Chip label={formatTime(intent.time)} onClick={cycleTime} />
      {intent.taste && <Chip label={`"${intent.taste}"`} />}
      {intent.budget !== null && <Chip label={`under ₹${intent.budget}`} />}
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:enabled:border-orange-400 disabled:cursor-default"
    >
      {label}
    </button>
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
