import type { RankedCard } from "@bhooky/shared";
import type { SearchStatus } from "../hooks/useSearch.js";
import { FoodCard } from "./FoodCard.js";

interface ResultsGridProps {
  status: SearchStatus;
  results: RankedCard[];
  onAddToCart: (card: RankedCard, rank: number) => void;
  addingMenuItemId: string | null;
}

const SKELETON_COUNT = 6;

export function ResultsGrid({ status, results, onAddToCart, addingMenuItemId }: ResultsGridProps) {
  if (status === "idle") {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        Search for something to eat to see ranked results here.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (status === "success" && results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        No dishes matched that search. Try loosening your budget or taste filters.
      </div>
    );
  }

  if (status !== "success") return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((card, index) => (
        <FoodCard
          key={card.menuItem.id}
          card={card}
          onAddToCart={() => onAddToCart(card, index + 1)}
          adding={addingMenuItemId === card.menuItem.id}
        />
      ))}
    </div>
  );
}
