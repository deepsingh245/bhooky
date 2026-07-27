import type { Coupon } from "@bhooky/shared";
import { useState } from "react";

interface CouponInputProps {
  coupons: Coupon[];
  appliedCode: string | null;
  onApply: (code: string) => Promise<void>;
}

// Lists fetched coupons with isApplicable styling rather than letting the user
// attempt an apply call that's guaranteed to fail server-side.
export function CouponInput({ coupons, appliedCode, onApply }: CouponInputProps) {
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  async function handleApply(code: string) {
    setApplyingCode(code);
    try {
      await onApply(code);
    } finally {
      setApplyingCode(null);
    }
  }

  if (coupons.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {coupons.map((coupon) => (
        <li
          key={coupon.code}
          className={`flex items-center justify-between gap-4 rounded-lg border p-3 text-sm ${
            coupon.isApplicable ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 text-gray-400"
          }`}
        >
          <div>
            <p className="font-medium">{coupon.code}</p>
            <p className={coupon.isApplicable ? "text-gray-500" : "text-gray-400"}>{coupon.description}</p>
          </div>
          {appliedCode === coupon.code ? (
            <span className="whitespace-nowrap text-sm font-medium text-green-700">Applied</span>
          ) : (
            <button
              type="button"
              disabled={!coupon.isApplicable || applyingCode === coupon.code}
              onClick={() => handleApply(coupon.code)}
              className="whitespace-nowrap rounded-lg border border-orange-300 px-3 py-1 text-sm font-medium text-orange-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
            >
              {applyingCode === coupon.code ? "Applying…" : "Apply"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
