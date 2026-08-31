import type { Cart, ScoreBreakdown } from "@bhooky/shared";
import { useCallback, useEffect, useState } from "react";
import { callGetCart, callUpdateCart } from "../lib/apiClient.js";

interface CartState {
  cart: Cart | null;
  loading: boolean;
}

interface AddItemImpression {
  rank: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export function useCart(addressId: string | null) {
  const [state, setState] = useState<CartState>({ cart: null, loading: true });

  const refresh = useCallback(async () => {
    if (!addressId) {
      setState({ cart: null, loading: false });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const cart = await callGetCart(addressId);
      setState({ cart, loading: false });
    } catch {
      setState({ cart: null, loading: false });
    }
  }, [addressId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (
      restaurantId: string,
      menuItemId: string,
      name: string,
      price: number,
      quantity: number,
      impression?: AddItemImpression,
    ) => {
      if (!addressId) return;
      const cart = await callUpdateCart({ restaurantId, menuItemId, name, price, quantity, addressId, ...impression });
      setState({ cart, loading: false });
    },
    [addressId],
  );

  return { ...state, addItem, refresh };
}
