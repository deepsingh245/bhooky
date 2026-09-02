import type { Address } from "@bhooky/shared";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedPinIcon } from "@/components/ui/animated-icons";
import { cn } from "@/lib/utils";

interface AddressPickerProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
}

// Custom themed dropdown — a native <select>'s option list can't be styled to
// match the dark/glass theme, so this is a self-contained popover.
export function AddressPicker({ addresses, selectedAddressId, onSelect }: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (addresses.length === 0) return null;

  const selected = addresses.find((address) => address.id === selectedAddressId) ?? addresses[0]!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 pl-3 pr-2 text-sm transition-colors hover:bg-secondary"
      >
        <span className="text-primary">
          <AnimatedPinIcon size={15} />
        </span>
        <span className="max-w-[7rem] truncate text-xs font-medium sm:max-w-[11rem] sm:text-sm">
          {selected.label}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-muted-foreground">
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="glass absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl p-1 shadow-xl"
          >
            {addresses.map((address) => {
              const active = address.id === selected.id;
              return (
                <li key={address.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(address.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/15 text-foreground" : "text-foreground/90 hover:bg-secondary/70",
                    )}
                  >
                    <span className="mt-0.5 flex-shrink-0 text-primary">
                      {active ? <Check size={14} /> : <span className="block h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{address.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{address.line1}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
