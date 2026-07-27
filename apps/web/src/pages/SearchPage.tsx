import type { ParsedIntent, RankedCard } from "@bhooky/shared";
import { useState } from "react";
import { AddressPicker } from "../components/AddressPicker.js";
import { FilterChips } from "../components/FilterChips.js";
import { ResultsGrid } from "../components/ResultsGrid.js";
import { SearchBar } from "../components/SearchBar.js";
import { SwiggyReconnectBanner } from "../components/SwiggyReconnectBanner.js";
import { useAddresses } from "../hooks/useAddresses.js";
import { useCart } from "../hooks/useCart.js";
import { useSearch } from "../hooks/useSearch.js";
import { useSwiggySession } from "../hooks/useSwiggySession.js";

export function SearchPage() {
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [addingMenuItemId, setAddingMenuItemId] = useState<string | null>(null);
  const session = useSwiggySession(sessionRefreshKey);
  const { addresses, selectedAddressId, selectAddress } = useAddresses(sessionRefreshKey);
  const { status, results, intent, errorMessage, search } = useSearch();
  const { cart, addItem } = useCart(selectedAddressId);

  const showReconnectBanner = status === "reconnect_required" || (!session.loading && !session.connected);
  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  async function handleSearch(query: string) {
    if (!selectedAddressId) return;
    await search(query, selectedAddressId);
    setSessionRefreshKey((key) => key + 1);
  }

  function handleFilterChange(nextIntent: ParsedIntent) {
    void handleSearch(intentToQueryString(nextIntent));
  }

  async function handleAddToCart(card: RankedCard) {
    setAddingMenuItemId(card.menuItem.id);
    try {
      await addItem(card.restaurant.id, card.menuItem.id, card.menuItem.name, card.menuItem.price, 1);
    } finally {
      setAddingMenuItemId(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bhooky</h1>
          <p className="text-sm text-gray-500">Tell us what you&apos;re craving.</p>
        </div>
        <div className="flex items-center gap-4">
          <AddressPicker addresses={addresses} selectedAddressId={selectedAddressId} onSelect={selectAddress} />
          <a href="/cart" className="text-sm font-medium text-orange-600">
            Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ""}
          </a>
        </div>
      </header>

      {showReconnectBanner && <SwiggyReconnectBanner />}

      <SearchBar onSearch={handleSearch} disabled={status === "loading" || !selectedAddressId} />

      {intent && <FilterChips intent={intent} onChange={handleFilterChange} />}

      {status === "error" && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <ResultsGrid
        status={status}
        results={results}
        onAddToCart={handleAddToCart}
        addingMenuItemId={addingMenuItemId}
      />
    </main>
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
