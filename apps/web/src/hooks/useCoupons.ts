import type { Cart, Coupon } from "@bhooky/shared";
import { useCallback, useEffect, useState } from "react";
import { callApplyCoupon, callFetchCoupons } from "../lib/apiClient.js";

interface CouponsState {
  coupons: Coupon[];
  loading: boolean;
}

export function useCoupons(restaurantId: string | null, addressId: string | null) {
  const [state, setState] = useState<CouponsState>({ coupons: [], loading: true });

  const refresh = useCallback(async () => {
    if (!restaurantId || !addressId) {
      setState({ coupons: [], loading: false });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const coupons = await callFetchCoupons(restaurantId, addressId);
      setState({ coupons, loading: false });
    } catch {
      setState({ coupons: [], loading: false });
    }
  }, [restaurantId, addressId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyCoupon = useCallback(
    async (code: string): Promise<Cart | null> => {
      if (!restaurantId || !addressId) return null;
      return callApplyCoupon({ restaurantId, addressId, code });
    },
    [restaurantId, addressId],
  );

  return { ...state, applyCoupon, refresh };
}
