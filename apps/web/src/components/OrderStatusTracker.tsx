import type { OrderStatus, TrackOrderResponse } from "@bhooky/shared";

const STEPS: OrderStatus[] = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

const STEP_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface OrderStatusTrackerProps {
  tracking: TrackOrderResponse;
}

// A simple status stepper, not a map/live-location view — beyond what
// track_food_order needs to provide for an MVP.
export function OrderStatusTracker({ tracking }: OrderStatusTrackerProps) {
  if (tracking.status === "cancelled") {
    return <p className="text-sm font-medium text-red-600">Order cancelled.</p>;
  }

  const currentIndex = STEPS.indexOf(tracking.status);

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <li key={step} className="flex flex-1 flex-col items-center gap-1">
            <span className={`h-2 w-full rounded-full ${index <= currentIndex ? "bg-orange-500" : "bg-gray-200"}`} />
            <span className={`text-center text-xs ${index <= currentIndex ? "text-gray-900" : "text-gray-400"}`}>
              {STEP_LABELS[step]}
            </span>
          </li>
        ))}
      </ol>
      {tracking.etaMinutes !== null && <p className="text-sm text-gray-500">ETA: {tracking.etaMinutes} min</p>}
    </div>
  );
}
