import type { RankedCard } from "@bhooky/shared";
import { motion } from "motion/react";
import { UtensilsCrossed } from "lucide-react";
import type { SearchStatus } from "../hooks/useSearch.js";
import { FoodCard } from "./FoodCard.js";
import { Skeleton } from "@/components/ui/skeleton";

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
      <EmptyState
        title="What are you in the mood for?"
        subtitle="Describe a craving in plain words — Bhooky's AI parses it and ranks live dishes for you."
      />
    );
  }

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <FoodCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (status === "success" && results.length === 0) {
    return (
      <EmptyState
        title="No dishes matched that search"
        subtitle="Try loosening your budget or taste filters, or search for something else."
      />
    );
  }

  if (status !== "success") return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((card, index) => (
        <motion.div
          key={card.menuItem.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
        >
          <FoodCard
            card={card}
            rank={index + 1}
            onAddToCart={() => onAddToCart(card, index + 1)}
            adding={addingMenuItemId === card.menuItem.id}
          />
        </motion.div>
      ))}
    </div>
  );
}

function FoodCardSkeleton() {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-1 h-10 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center"
    >
      <motion.span
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"
      >
        <UtensilsCrossed size={26} />
      </motion.span>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
