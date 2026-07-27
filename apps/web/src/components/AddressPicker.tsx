import type { Address } from "@bhooky/shared";

interface AddressPickerProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
}

export function AddressPicker({ addresses, selectedAddressId, onSelect }: AddressPickerProps) {
  if (addresses.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <span className="font-medium">Deliver to</span>
      <select
        value={selectedAddressId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
      >
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.label} — {address.line1}
          </option>
        ))}
      </select>
    </label>
  );
}
