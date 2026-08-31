import type { RawSwiggyAddress } from "../swiggy/types.js";

export const MOCK_ADDRESSES: RawSwiggyAddress[] = [
  {
    id: "addr-home",
    annotation: "Home",
    addressLine1: "221B Baker Street",
    addressLine2: "Bandra West, Mumbai",
    isDefault: true,
  },
  {
    id: "addr-work",
    annotation: "Work",
    addressLine1: "42 Residency Road",
    addressLine2: "Lower Parel, Mumbai",
    isDefault: false,
  },
];
