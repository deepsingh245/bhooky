import type { Address } from "@bhooky/shared";
import { useEffect, useState } from "react";
import { callGetAddresses } from "../lib/apiClient.js";

interface AddressesState {
  addresses: Address[];
  selectedAddressId: string | null;
  loading: boolean;
}

export function useAddresses(refreshKey: number) {
  const [state, setState] = useState<AddressesState>({ addresses: [], selectedAddressId: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    callGetAddresses()
      .then((addresses) => {
        if (cancelled) return;
        const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
        setState({ addresses, selectedAddressId: defaultAddress?.id ?? null, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ addresses: [], selectedAddressId: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function selectAddress(addressId: string) {
    setState((prev) => ({ ...prev, selectedAddressId: addressId }));
  }

  return { ...state, selectAddress };
}
