"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { PriceInput } from "@/components/price-input";
import { Button } from "@/components/ui/button";
import type { LabelType } from "@/lib/label-types";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { NameCell, TypeCell, UnitCell, field, fieldTrigger, type Draft } from "./cells";

/** The list on phones: one card per product, large fields and buttons instead of keyboard shortcuts. */
export function ProductCards({ products, types, priced, draft, setDraft, update, remove, swap, addDraft }: {
  products: Product[];
  types: LabelType[];
  priced: (item: { cellType: string }) => boolean;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  update: (id: number, changes: Partial<Product>) => void;
  remove: (index: number) => void;
  swap: (row: number, delta: number) => boolean;
  addDraft: () => "name" | "price" | null;
}) {
  const form = useRef<HTMLFormElement>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = addDraft();
    form.current?.querySelector<HTMLInputElement>(problem === "price" ? "[inputmode=decimal]" : "input")?.focus();
  };
  const title = !priced(draft);
  const icon = "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-30";
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {products.map((product, row) => {
          const isTitle = !priced(product);
          return (
            <li key={product.id} className="space-y-2 rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1">
                <span className="mr-auto text-xs font-medium tabular-nums text-muted-foreground">#{row + 1}</span>
                <button type="button" className={icon} aria-label="Subir" disabled={row === 0} onClick={() => swap(row, -1)}><ChevronUp className="size-4" /></button>
                <button type="button" className={icon} aria-label="Descer" disabled={row === products.length - 1} onClick={() => swap(row, 1)}><ChevronDown className="size-4" /></button>
                <button type="button" className={cn(icon, "hover:text-destructive")} aria-label={`Remover ${product.name}`} onClick={() => remove(row)}><Trash2 className="size-4" /></button>
              </div>
              <NameCell value={product.name} label="Nome do produto" strong={isTitle} className={field} onChange={name => update(product.id, { name })} />
              <div className={cn("grid gap-2", isTitle ? "grid-cols-1" : "grid-cols-[1fr_5.5rem_7rem]")}>
                {!isTitle && <PriceInput value={product.price} aria-label="Preço" className={field} onCommit={price => update(product.id, { price })} />}
                {!isTitle && <UnitCell value={product.unit} className={fieldTrigger} onChange={unit => update(product.id, { unit })} />}
                <TypeCell value={product.cellType} types={types} className={fieldTrigger} onChange={cellType => update(product.id, { cellType })} />
              </div>
            </li>
          );
        })}
      </ol>
      <form ref={form} onSubmit={submit} className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-muted/40 p-3">
        <p className="text-sm font-semibold">Novo produto</p>
        <NameCell value={draft.name} label="Nome do novo produto" placeholder="Nome do produto" className={field}
          onChange={name => setDraft(d => ({ ...d, name }))} />
        <div className={cn("grid gap-2", title ? "grid-cols-1" : "grid-cols-[1fr_5.5rem_7rem]")}>
          {!title && (
            <input aria-label="Preço do novo produto" inputMode="decimal" placeholder="Preço" className={cn(field, "text-right tabular-nums")}
              value={draft.priceText} onChange={e => setDraft(d => ({ ...d, priceText: e.target.value }))} />
          )}
          {!title && <UnitCell value={draft.unit} className={fieldTrigger} onChange={unit => setDraft(d => ({ ...d, unit }))} />}
          <TypeCell value={draft.cellType} types={types} className={fieldTrigger} onChange={cellType => setDraft(d => ({ ...d, cellType }))} />
        </div>
        <Button type="submit" className="h-11 w-full"><Plus /> Adicionar produto</Button>
      </form>
    </div>
  );
}
