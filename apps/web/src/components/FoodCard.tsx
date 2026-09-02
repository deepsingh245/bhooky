import type { RankedCard } from "@bhooky/shared";
import { motion } from "motion/react";
import { Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";

interface FoodCardProps {
  card: RankedCard;
  onAddToCart: () => void;
  adding: boolean;
  rank?: number;
}

export function FoodCard({ card, onAddToCart, adding, rank }: FoodCardProps) {
  const { menuItem, restaurant, bestOffer, score } = card;
  const isTopPick = rank === 1;
  const matchPercent = Math.round(Math.min(1, Math.max(0, score)) * 100);
  const emoji = foodEmoji(menuItem.name, menuItem.tags);

  const inner = (
    <SpotlightCard className="glass flex h-full flex-col transition-shadow duration-300 hover:shadow-[0_16px_50px_-12px_oklch(0.68_0.2_40_/_0.4)]">
      {/* Image banner — soft, mostly-neutral surface + food glyph until real photos exist. */}
      <div className="relative h-24 overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,var(--brand-1),transparent_60%)] opacity-[0.14]" />
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 grid place-items-center text-4xl opacity-90"
        >
          {emoji}
        </motion.span>
        <span className="absolute left-3 top-3">
          <VegBadge veg={menuItem.veg} />
        </span>
        {isTopPick && (
          <Badge variant="default" className="absolute right-3 top-3 bg-background/70 backdrop-blur">
            ⭐ Top pick
          </Badge>
        )}
        {bestOffer && (
          <span className="absolute bottom-2 left-3 rounded-md bg-success/90 px-2 py-0.5 text-[11px] font-semibold text-success-foreground">
            ₹{bestOffer.discountAmount} OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display font-semibold leading-tight text-foreground">{menuItem.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{restaurant.name}</p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end">
            <span className="font-display text-lg font-bold text-foreground">
              <NumberTicker value={menuItem.price} prefix="₹" />
            </span>
            <span className="text-[11px] font-medium text-primary">{matchPercent}% match</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="muted">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {restaurant.rating.toFixed(1)}
          </Badge>
          <Badge variant="muted">
            <MapPin size={12} />
            {restaurant.distanceKm.toFixed(1)} km
          </Badge>
          <Badge variant="muted">
            <Clock size={12} />
            {restaurant.deliveryTimeMinutes} min
          </Badge>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={adding}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105 active:scale-[0.97] disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add to cart"}
          </button>
          {/* Plain deep link, no MCP call — a safety net alongside real in-app ordering. */}
          <a
            href={swiggyFallbackUrl(restaurant.name)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border/60 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            Order on Swiggy
          </a>
        </div>
      </div>
    </SpotlightCard>
  );

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      {isTopPick ? (
        // Reliable animated gradient border (background-position shift) — replaces
        // the offset-path border-beam, which overflowed in some browsers.
        <div className="h-full animate-shimmer rounded-2xl bg-[linear-gradient(110deg,var(--brand-1),var(--brand-3),var(--brand-2))] bg-[length:200%_auto] p-[1.6px] shadow-[0_10px_40px_-12px_oklch(0.68_0.2_40_/_0.5)]">
          {inner}
        </div>
      ) : (
        inner
      )}
    </motion.div>
  );
}

function VegBadge({ veg }: { veg: boolean }) {
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn(
        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border-2 bg-white/90",
        veg ? "border-green-600" : "border-red-600",
      )}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={cn("block h-2 w-2 rounded-full", veg ? "bg-green-600" : "bg-red-600")} />
    </motion.span>
  );
}

// Deterministic food glyph from the dish name / tags, until real images exist.
function foodEmoji(name: string, tags: string[]): string {
  const haystack = `${name} ${tags.join(" ")}`.toLowerCase();
  const map: [string, string][] = [
    ["biryani", "🍛"],
    ["pizza", "🍕"],
    ["burger", "🍔"],
    ["fries", "🍟"],
    ["cheese", "🧀"],
    ["noodle", "🍜"],
    ["chow", "🍜"],
    ["ramen", "🍜"],
    ["roll", "🌯"],
    ["wrap", "🌯"],
    ["dosa", "🥞"],
    ["idli", "🍚"],
    ["paneer", "🧆"],
    ["curry", "🍛"],
    ["rice", "🍚"],
    ["cake", "🍰"],
    ["dessert", "🍰"],
    ["ice", "🍨"],
    ["coffee", "☕"],
    ["tea", "🍵"],
    ["chicken", "🍗"],
    ["kebab", "🍢"],
    ["salad", "🥗"],
    ["sandwich", "🥪"],
    ["momo", "🥟"],
    ["taco", "🌮"],
    ["soup", "🍲"],
  ];
  for (const [key, glyph] of map) {
    if (haystack.includes(key)) return glyph;
  }
  return "🍽️";
}

function swiggyFallbackUrl(restaurantName: string): string {
  return `https://www.swiggy.com/search?query=${encodeURIComponent(restaurantName)}`;
}
