import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { AnimatedSearchIcon } from "@/components/ui/animated-icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
  loading?: boolean;
}

const SUGGESTIONS = [
  "spicy veg dinner under 300",
  "something light and healthy",
  "late night cheesy comfort food",
  "budget biryani under 250",
];

export function SearchBar({ onSearch, disabled, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.form
        onSubmit={handleSubmit}
        initial="rest"
        whileHover="hover"
        animate={focused ? "hover" : "rest"}
        className="glass flex items-center gap-2 rounded-2xl p-2 shadow-lg transition-shadow"
        style={{ boxShadow: focused ? "0 8px 40px -8px oklch(0.68 0.2 40 / 0.4)" : undefined }}
      >
        <span className="pl-2 text-muted-foreground">
          <AnimatedSearchIcon size={20} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder="What are you craving?"
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:text-base"
        />
        <ShimmerButton type="submit" disabled={disabled || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </ShimmerButton>
      </motion.form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
