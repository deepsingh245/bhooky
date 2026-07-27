import { MAX_ORDER_TOTAL_RUPEES } from "@bhooky/shared";
import { useState } from "react";
import { AddressPicker } from "../components/AddressPicker.js";
import { CouponInput } from "../components/CouponInput.js";
import { OrderStatusTracker } from "../components/OrderStatusTracker.js";
import { useAddresses } from "../hooks/useAddresses.js";
import { useCart } from "../hooks/useCart.js";
import { useCoupons } from "../hooks/useCoupons.js";
import { useOrder } from "../hooks/useOrder.js";

export function CartPage() {
  const [refreshKey] = useState(0);
  const { addresses, selectedAddressId, selectAddress } = useAddresses(refreshKey);
  const { cart, loading, addItem, refresh: refreshCart } = useCart(selectedAddressId);
  const { coupons, applyCoupon } = useCoupons(cart?.restaurantId ?? null, selectedAddressId);
  const { order, placeOrder, trackingStatus } = useOrder();
  const [applyError, setApplyError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  async function changeQuantity(menuItemId: string, name: string, price: number, nextQuantity: number) {
    if (!cart?.restaurantId) return;
    await addItem(cart.restaurantId, menuItemId, name, price, nextQuantity);
  }

  async function handleApplyCoupon(code: string) {
    setApplyError(null);
    try {
      await applyCoupon(code);
      await refreshCart();
    } catch {
      setApplyError("Couldn't apply that coupon. Please try again.");
    }
  }

  async function handleCheckout() {
    if (!cart?.restaurantId || !selectedAddressId) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      await placeOrder(cart.restaurantId, selectedAddressId);
    } catch {
      setPlaceError("Couldn't place the order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (order) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Order placed</h1>
          <a href="/" className="text-sm text-gray-500">
            ← Back to search
          </a>
        </header>

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
          <p className="font-medium text-gray-900">Order #{order.id}</p>
          <p className="text-gray-500">₹{order.cartSnapshot.total} · Cash on Delivery</p>
        </div>

        {trackingStatus && <OrderStatusTracker tracking={trackingStatus} />}
      </main>
    );
  }

  const isOverCap = Boolean(cart && cart.total > MAX_ORDER_TOTAL_RUPEES);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your cart</h1>
          <a href="/" className="text-sm text-gray-500">
            ← Back to search
          </a>
        </div>
        <AddressPicker addresses={addresses} selectedAddressId={selectedAddressId} onSelect={selectAddress} />
      </header>

      {loading && <p className="text-sm text-gray-500">Loading cart…</p>}

      {!loading && (!cart || cart.items.length === 0) && (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Your cart is empty. Add something from a search result.
        </p>
      )}

      {!loading && cart && cart.items.length > 0 && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {cart.items.map((item) => (
              <li key={item.menuItemId} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.menuItemId, item.name, item.price, item.quantity - 1)}
                    className="h-7 w-7 rounded-full border border-gray-300 text-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.menuItemId, item.name, item.price, item.quantity + 1)}
                    className="h-7 w-7 rounded-full border border-gray-300 text-sm"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{cart.subtotal}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({cart.couponCode})</span>
                <span>−₹{cart.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery fee</span>
              <span>₹{cart.deliveryFee}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>
          </div>

          <CouponInput coupons={coupons} appliedCode={cart.couponCode} onApply={handleApplyCoupon} />
          {applyError && <p className="text-sm text-red-600">{applyError}</p>}

          <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Cash on Delivery only — online payment isn&apos;t available yet.
          </p>

          {isOverCap && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              Your order total (₹{cart.total}) is over the ₹{MAX_ORDER_TOTAL_RUPEES} limit for now. Remove an item to
              check out.
            </p>
          )}
          {placeError && <p className="text-sm text-red-600">{placeError}</p>}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isOverCap || placing}
            className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? "Placing order…" : "Place order (COD)"}
          </button>
        </div>
      )}
    </main>
  );
}
