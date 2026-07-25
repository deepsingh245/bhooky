import type { ParsedIntent } from "@bhooky/shared";
import { useState } from "react";
import { FilterChips } from "../components/FilterChips.js";
import { ResultsGrid } from "../components/ResultsGrid.js";
import { SearchBar } from "../components/SearchBar.js";
import { SwiggyReconnectBanner } from "../components/SwiggyReconnectBanner.js";
import { useSearch } from "../hooks/useSearch.js";
import { useSwiggySession } from "../hooks/useSwiggySession.js";

export function SearchPage() {
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const session = useSwiggySession(sessionRefreshKey);
  const { status, results, intent, errorMessage, search } = useSearch();

  const showReconnectBanner = status === "reconnect_required" || (!session.loading && !session.connected);

  async function handleSearch(query: string) {
    await search(query);
    setSessionRefreshKey((key) => key + 1);
  }

  function handleFilterChange(nextIntent: ParsedIntent) {
    void handleSearch(intentToQueryString(nextIntent));
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Bhooky</h1>
        <p className="text-sm text-gray-500">Tell us what you&apos;re craving.</p>
      </header>

      {showReconnectBanner && <SwiggyReconnectBanner />}

      <SearchBar onSearch={handleSearch} disabled={status === "loading"} />

      {intent && <FilterChips intent={intent} onChange={handleFilterChange} />}

      {status === "error" && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <ResultsGrid status={status} results={results} />
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
