import type { Address } from "@bhooky/shared";
import type { RawSwiggyAddress } from "../swiggy/types.js";

export function normalizeAddress(raw: RawSwiggyAddress): Address {
  return {
    id: raw.id,
    label: raw.annotation,
    line1: raw.addressLine1,
    line2: raw.addressLine2,
    isDefault: raw.isDefault,
  };
}
