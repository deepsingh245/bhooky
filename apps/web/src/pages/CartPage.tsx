import { MAX_ORDER_TOTAL_RUPEES } from "@bhooky/shared";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AddressPicker } from "../components/AddressPicker.js";
import { AppShell } from "../components/AppShell.js";
import { CouponInput } from "../components/CouponInput.js";
import { OrderStatusTracker } from "../components/OrderStatusTracker.js";
import { useAddresses } from "../hooks/useAddresses.js";
import { useCart } from "../hooks/useCart.js";
import { useCoupons } from "../hooks/useCoupons.js";
import { useOrder } from "../hooks/useOrder.js";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShimmerButton } from "@/components/ui/shimmer-button";

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

  const backLink = (
    <a
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={15} /> Back to search
    </a>
  );

  if (order) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          {backLink}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"
            >
              <CheckCircle2 size={36} />
            </motion.span>
            <h1 className="font-display text-2xl font-bold">Order placed!</h1>
            <p className="text-sm text-muted-foreground">
              Order <span className="font-mono text-foreground">#{order.id}</span> · Cash on Delivery
            </p>
            <p className="font-display text-xl font-bold text-foreground">
              <NumberTicker value={order.cartSnapshot.total} prefix="₹" />
            </p>
          </motion.div>

          {trackingStatus && <OrderStatusTracker tracking={trackingStatus} />}
        </div>
      </AppShell>
    );
  }

  const isOverCap = Boolean(cart && cart.total > MAX_ORDER_TOTAL_RUPEES);
  const isEmpty = !loading && (!cart || cart.items.length === 0);

  return (
    <AppShell
      headerExtra={
        <AddressPicker addresses={addresses} selectedAddressId={selectedAddressId} onSelect={selectAddress} />
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div className="flex flex-col gap-1">
          {backLink}
          <h1 className="font-display text-2xl font-bold">Your cart</h1>
        </div>

        {loading && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading cart…</div>
        )}

        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBag size={26} />
            </span>
            <h3 className="font-display text-lg font-semibold">Your cart is empty</h3>
            <p className="max-w-sm text-sm text-muted-foreground">Add something from a search result to get started.</p>
            <a
              href="/"
              className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              Find food
            </a>
          </motion.div>
        )}

        {!loading && cart && cart.items.length > 0 && (
          <div className="flex flex-col gap-4">
            <Card className="glass divide-y divide-border/60 overflow-hidden border-0 p-0">
              {cart.items.map((item) => (
                <motion.div
                  key={item.menuItemId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
                    <QtyButton onClick={() => changeQuantity(item.menuItemId, item.name, item.price, item.quantity - 1)}>
                      <Minus size={14} />
                    </QtyButton>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <QtyButton onClick={() => changeQuantity(item.menuItemId, item.name, item.price, item.quantity + 1)}>
                      <Plus size={14} />
                    </QtyButton>
                  </div>
                </motion.div>
              ))}
            </Card>

            <Card className="glass flex flex-col gap-2 border-0 p-4 text-sm">
              <Row label="Subtotal" value={`₹${cart.subtotal}`} />
              {cart.discount > 0 && (
                <Row label={`Discount (${cart.couponCode})`} value={`−₹${cart.discount}`} accent="success" />
              )}
              <Row label="Delivery fee" value={`₹${cart.deliveryFee}`} />
              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-3 font-semibold">
                <span>Total</span>
                <span className="font-display text-lg">
                  <NumberTicker value={cart.total} prefix="₹" />
                </span>
              </div>
            </Card>

            <CouponInput coupons={coupons} appliedCode={cart.couponCode} onApply={handleApplyCoupon} />
            {applyError && <p className="text-sm text-destructive">{applyError}</p>}

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Cash on Delivery only — online payment isn&apos;t available yet.
            </p>

            {isOverCap && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Your order total (₹{cart.total}) is over the ₹{MAX_ORDER_TOTAL_RUPEES} limit for now. Remove an item to
                check out.
              </p>
            )}
            {placeError && <p className="text-sm text-destructive">{placeError}</p>}

            <ShimmerButton
              type="button"
              onClick={handleCheckout}
              disabled={isOverCap || placing}
              className="w-full py-3"
            >
              {placing ? "Placing order…" : "Place order · COD"}
            </ShimmerButton>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function QtyButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className="grid h-7 w-7 place-items-center rounded-full bg-background/70 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </motion.button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "success" }) {
  return (
    <div className={`flex justify-between ${accent === "success" ? "text-success" : ""}`}>
      <span className={accent ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
