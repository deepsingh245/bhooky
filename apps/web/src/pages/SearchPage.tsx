import type { ParsedIntent, RankedCard } from "@bhooky/shared";
import { motion } from "motion/react";
import { useState } from "react";
import { AddressPicker } from "../components/AddressPicker.js";
import { AppShell } from "../components/AppShell.js";
import { CartButton } from "../components/CartButton.js";
import { FilterChips } from "../components/FilterChips.js";
import { ResultsGrid } from "../components/ResultsGrid.js";
import { RotatingHeadline } from "../components/RotatingHeadline.js";
import { SearchBar } from "../components/SearchBar.js";
import { SwiggyReconnectBanner } from "../components/SwiggyReconnectBanner.js";
import { useAddresses } from "../hooks/useAddresses.js";
import { useCart } from "../hooks/useCart.js";
import { useSearch } from "../hooks/useSearch.js";
import { useSwiggySession } from "../hooks/useSwiggySession.js";
import { SparkleIcon } from "@/components/ui/animated-icons";

export function SearchPage() {
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [addingMenuItemId, setAddingMenuItemId] = useState<string | null>(null);
  const session = useSwiggySession(sessionRefreshKey);
  const { addresses, selectedAddressId, selectAddress } = useAddresses(sessionRefreshKey);
  const { status, results, intent, errorMessage, search } = useSearch();
  const { cart, addItem } = useCart(selectedAddressId);

  const showReconnectBanner = status === "reconnect_required" || (!session.loading && !session.connected);
  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const hasSearched = status !== "idle";

  async function handleSearch(query: string) {
    if (!selectedAddressId) return;
    await search(query, selectedAddressId);
    setSessionRefreshKey((key) => key + 1);
  }

  function handleFilterChange(nextIntent: ParsedIntent) {
    void handleSearch(intentToQueryString(nextIntent));
  }

  async function handleAddToCart(card: RankedCard, rank: number) {
    setAddingMenuItemId(card.menuItem.id);
    try {
      await addItem(card.restaurant.id, card.menuItem.id, card.menuItem.name, card.menuItem.price, 1, {
        rank,
        score: card.score,
        scoreBreakdown: card.scoreBreakdown,
      });
    } finally {
      setAddingMenuItemId(null);
    }
  }

  return (
    <AppShell
      headerExtra={
        <>
          <AddressPicker addresses={addresses} selectedAddressId={selectedAddressId} onSelect={selectAddress} />
          <CartButton count={cartItemCount} />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Hero — collapses after the first search to keep results front and centre. */}
        <motion.section
          layout
          className={hasSearched ? "text-left" : "py-8 text-center sm:py-14"}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <SparkleIcon size={13} />
            AI-powered food discovery
          </motion.div>
          {hasSearched ? (
            <h1 className="mt-3 font-display text-2xl font-bold">What you&apos;re craving</h1>
          ) : (
            <RotatingHeadline className="mx-auto mt-4 min-h-[2.4em] max-w-2xl text-center font-display text-4xl font-bold leading-[1.15] sm:text-5xl" />
          )}
          {!hasSearched && (
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
              Tell Bhooky what you feel like in plain words. It understands your intent and ranks the
              best dishes near you.
            </p>
          )}
        </motion.section>

        {showReconnectBanner && <SwiggyReconnectBanner />}

        <SearchBar
          onSearch={handleSearch}
          disabled={status === "loading" || !selectedAddressId}
          loading={status === "loading"}
        />

        {intent && <FilterChips intent={intent} onChange={handleFilterChange} />}

        {status === "error" && errorMessage && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <ResultsGrid
          status={status}
          results={results}
          onAddToCart={handleAddToCart}
          addingMenuItemId={addingMenuItemId}
        />
      </div>
    </AppShell>
  );
}

function intentToQueryString(intent: ParsedIntent): string {
  const parts = [
    intent.taste,
    intent.food_type !== "any" ? intent.food_type.replace("_", " ") : null,
    intent.time !== "any" ? intent.time.replace("_", " ") : null,
    intent.budget !== null ? `under ${intent.budget}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" ") : intent.raw_query;
}
