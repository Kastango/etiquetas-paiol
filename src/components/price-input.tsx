"use client";

import { useRef, useState, type ComponentProps } from "react";
import { currency, decimal, readPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"input">, "value" | "onChange" | "onFocus" | "onBlur"> & {
  value: number;
  onCommit: (price: number) => void;
  /** Show an empty field for zero, for optional prices. */
  blankWhenZero?: boolean;
};

/**
 * Shows R$ 4,79. While focused it edits "4,79", read as in a spreadsheet ("5" is R$ 5,00), and
 * saves when it loses focus; Esc puts back the value it had.
 */
export function PriceInput({ value, onCommit, blankWhenZero, className, onKeyDown, ...props }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const editing = () => (value ? decimal(value) : "");
  const selectAll = () => requestAnimationFrame(() => input.current?.select());
  return (
    <input
      inputMode="decimal"
      {...props}
      ref={input}
      className={cn(className, "text-right tabular-nums")}
      value={draft ?? (value || !blankWhenZero ? currency(value) : "")}
      onFocus={() => { setDraft(editing()); selectAll(); }}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => {
        const price = draft === null ? null : readPrice(draft);
        if (price !== null && price !== value) onCommit(price);
        setDraft(null);
      }}
      onKeyDown={e => {
        if (e.key === "Escape") { setDraft(editing()); selectAll(); return; }
        onKeyDown?.(e);
      }}
    />
  );
}
