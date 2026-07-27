import { TRACK_ORDER_MIN_POLL_INTERVAL_MS, type Order, type TrackOrderResponse } from "@bhooky/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { callPlaceOrder, callTrackOrder } from "../lib/apiClient.js";

const TERMINAL_STATUSES = new Set<TrackOrderResponse["status"]>(["delivered", "cancelled"]);

export function useOrder() {
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackOrderResponse | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const placeOrder = useCallback(async (restaurantId: string, addressId: string): Promise<Order> => {
    const placed = await callPlaceOrder({ restaurantId, addressId });
    setOrder(placed);
    setTrackingStatus(null);
    return placed;
  }, []);

  useEffect(() => {
    if (!order) return undefined;
    let cancelled = false;

    async function poll(): Promise<void> {
      const status = await callTrackOrder(order!.id);
      if (cancelled) return;
      setTrackingStatus(status);
      if (TERMINAL_STATUSES.has(status.status) && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    }

    void poll();
    pollTimerRef.current = setInterval(() => void poll(), TRACK_ORDER_MIN_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [order]);

  return { order, placeOrder, trackingStatus };
}
