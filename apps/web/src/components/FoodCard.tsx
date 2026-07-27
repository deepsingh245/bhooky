import type { RankedCard } from "@bhooky/shared";

interface FoodCardProps {
  card: RankedCard;
  onAddToCart: () => void;
  adding: boolean;
}

export function FoodCard({ card, onAddToCart, adding }: FoodCardProps) {
  const { menuItem, restaurant } = card;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{menuItem.name}</h3>
          <p className="text-sm text-gray-500">{restaurant.name}</p>
        </div>
        <VegBadge veg={menuItem.veg} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded bg-gray-100 px-2 py-1">₹{menuItem.price}</span>
        <span className="rounded bg-gray-100 px-2 py-1">★ {restaurant.rating.toFixed(1)}</span>
        <span className="rounded bg-gray-100 px-2 py-1">{restaurant.distanceKm.toFixed(1)} km</span>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={adding}
        className="mt-1 rounded-lg bg-orange-500 px-3 py-2 text-center text-sm font-medium text-white disabled:opacity-50"
      >
        {adding ? "Adding…" : "Add to cart"}
      </button>

      {/* Plain deep link, no MCP call — a safety net alongside real in-app ordering. */}
      <a
        href={swiggyFallbackUrl(restaurant.name)}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
      >
        Order on Swiggy
      </a>
    </div>
  );
}

function VegBadge({ veg }: { veg: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border-2 ${veg ? "border-green-600" : "border-red-600"}`}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`block h-1.5 w-1.5 rounded-full ${veg ? "bg-green-600" : "bg-red-600"}`} />
    </span>
  );
}

function swiggyFallbackUrl(restaurantName: string): string {
  return `https://www.swiggy.com/search?query=${encodeURIComponent(restaurantName)}`;
}
