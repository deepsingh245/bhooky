import type { ParsedIntent, RankedCard } from "@bhooky/shared";
import { useCallback, useState } from "react";
import { callSearchFood, SwiggyReconnectRequiredError } from "../lib/apiClient.js";

export type SearchStatus = "idle" | "loading" | "success" | "error" | "reconnect_required";

interface SearchState {
  status: SearchStatus;
  results: RankedCard[];
  intent: ParsedIntent | null;
  errorMessage: string | null;
}

// Phase 1 has no address-selection UI (out of scope per plans/phase-1-plan.md);
// the mock Swiggy client ignores addressId entirely.
const DEV_ADDRESS_ID = "dev-address";

const INITIAL_STATE: SearchState = { status: "idle", results: [], intent: null, errorMessage: null };

export function useSearch() {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);

  const search = useCallback(async (rawQuery: string) => {
    setState({ status: "loading", results: [], intent: null, errorMessage: null });
    try {
      const response = await callSearchFood(rawQuery, DEV_ADDRESS_ID);
      setState({ status: "success", results: response.results, intent: response.intent, errorMessage: null });
    } catch (error) {
      if (error instanceof SwiggyReconnectRequiredError) {
        setState({ status: "reconnect_required", results: [], intent: null, errorMessage: null });
        return;
      }
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setState({ status: "error", results: [], intent: null, errorMessage: message });
    }
  }, []);

  return { ...state, search };
}
