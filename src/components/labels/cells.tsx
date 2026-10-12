"use client";

import { useRef, type KeyboardEvent } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LabelType } from "@/lib/label-types";
import { UNITS } from "@/lib/products";
import { cn } from "@/lib/utils";

/*
 * Cells of the product list. In the spreadsheet (product-table) they carry data-row and data-col for
 * keyboard navigation; on phones (product-cards) the same cells render as regular form fields.
 */
export const LAST_COL = 3;
export const cell = "block h-10 w-full bg-transparent px-3 text-sm outline-hidden placeholder:text-muted-foreground/70 focus:relative focus:z-10 focus:bg-card focus:ring-2 focus:ring-inset focus:ring-primary";
export const trigger = "h-10 rounded-none border-0 bg-transparent shadow-none focus:relative focus:z-10 focus:bg-card focus:ring-2 focus:ring-inset focus:ring-primary focus:ring-offset-0";
/** On phones the same cells become regular form fields, 16 px so iOS does not zoom in. */
export const field = "h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-hidden placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring";
export const fieldTrigger = "h-11 text-base";

export type CellNav = { "data-row": number; "data-col": number; onKeyDown: (event: KeyboardEvent<HTMLElement>) => void };

function selectSoon(input: HTMLInputElement) {
  requestAnimationFrame(() => input.select());
}

export function NameCell({ value, onChange, label, placeholder, nav, strong, className = cell }: {
  value: string; onChange: (name: string) => void; label: string; placeholder?: string; nav?: CellNav; strong?: boolean; className?: string;
}) {
  const original = useRef(value);
  return (
    <input
      {...nav}
      aria-label={label}
      placeholder={placeholder}
      className={cn(className, strong && "font-semibold")}
      value={value}
      onFocus={e => { original.current = value; e.target.select(); }}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Escape") { onChange(original.current); selectSoon(e.currentTarget); return; }
        nav?.onKeyDown(e);
      }}
    />
  );
}

/** Title rows have no price or unit; the cell stays focusable so arrow keys pass through it. */
export function Blank({ nav, label }: { nav: CellNav; label: string }) {
  return <input {...nav} readOnly aria-label={label} value="—" className={cn(cell, "text-center text-muted-foreground")} />;
}

export function UnitCell({ value, onChange, nav, className = trigger }: { value: string; onChange: (unit: string) => void; nav?: CellNav; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger {...nav} aria-label="Unidade" className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        {(UNITS.includes(value) ? UNITS : [...UNITS, value]).map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function TypeCell({ value, types, onChange, nav, className = trigger }: {
  value: string; types: LabelType[]; onChange: (type: string) => void; nav?: CellNav; className?: string;
}) {
  return (
    <Select value={types.some(type => type.id === value) ? value : "default"} onValueChange={onChange}>
      <SelectTrigger {...nav} aria-label="Tipo de etiqueta" className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        {types.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-card px-1 font-sans text-[0.7rem] text-foreground">{children}</kbd>;
}

export const EMPTY_DRAFT = { name: "", priceText: "", unit: "100g", cellType: "default" };

export type Draft = typeof EMPTY_DRAFT;
