"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PriceInput } from "@/components/price-input";
import { typeOf, type LabelType } from "@/lib/label-types";
import { PHONE, useMediaQuery } from "@/lib/media";
import { decimal, pasteGrid, readPrice, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { Blank, EMPTY_DRAFT, Kbd, LAST_COL, NameCell, TypeCell, UnitCell, cell, type CellNav } from "./cells";
import { ProductCards } from "./product-cards";

/*
 * The product list as a spreadsheet: arrows, Enter and Tab move between cells, blocks paste from
 * Excel, and the last row (data-row = products.length) adds a product. Phones get ProductCards.
 */
export function ProductTable({ products, types, onChange }: { products: Product[]; types: LabelType[]; onChange: Dispatch<SetStateAction<Product[]>> }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const newRow = products.length;
  /** Title types have no price or unit. */
  const priced = (item: { cellType: string }) => typeOf(item, types).price !== "none";

  /** Cells are found through the DOM from the element that received the event. */
  const focusCell = (from: Element, row: number, col: number) => {
    const target = from.closest("[data-grid]")?.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${Math.max(0, Math.min(LAST_COL, col))}"]`);
    if (!target) return;
    target.focus();
    target.scrollIntoView({ block: "nearest" });
    if (target instanceof HTMLInputElement) target.select();
  };
  const update = (id: number, changes: Partial<Product>) => onChange(list => list.map(p => (p.id === id ? { ...p, ...changes } : p)));

  const remove = (index: number) => {
    const removed = products[index];
    onChange(list => list.filter(p => p.id !== removed.id));
    toast(`“${removed.name || "Produto"}” removido.`, {
      action: { label: "Desfazer", onClick: () => onChange(list => [...list.slice(0, index), removed, ...list.slice(index)]) },
    });
  };

  /** Swaps a row with its neighbour and renders at once, so focus can follow it. */
  const swap = (row: number, delta: number) => {
    const target = row + delta;
    if (target < 0 || target >= products.length) return false;
    flushSync(() => onChange(list => {
      const next = [...list];
      [next[row], next[target]] = [next[target], next[row]];
      return next;
    }));
    return true;
  };
  const move = (from: Element, row: number, delta: number, col: number) => {
    if (swap(row, delta)) focusCell(from, row + delta, col);
  };

  /** Adds the new-product row; returns the field to fix when it cannot. */
  const addDraft = (): "name" | "price" | null => {
    const price = priced(draft) ? readPrice(draft.priceText) : 0;
    if (!draft.name.trim()) return "name";
    if (price === null || (!price && priced(draft))) {
      toast.error(price === null ? "Não entendi o preço. Use, por exemplo, 4,79." : "Preencha o preço do produto.");
      return "price";
    }
    const id = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    flushSync(() => {
      onChange(list => [...list, { id, name: draft.name.trim(), price, unit: draft.unit, cellType: draft.cellType }]);
      setDraft(d => ({ ...d, name: "", priceText: "" }));
    });
    return null;
  };
  const add = (from: Element) => {
    const problem = addDraft();
    // On success the new-product row has moved one row down; keep typing there.
    focusCell(from, problem ? newRow : newRow + 1, problem === "price" ? 1 : 0);
  };

  const phone = useMediaQuery(PHONE);
  if (phone) {
    return <ProductCards {...{ products, types, priced, draft, setDraft, update, remove, swap, addDraft }} />;
  }

  const navFor = (row: number, col: number): CellNav => ({
    "data-row": row,
    "data-col": col,
    onKeyDown: event => {
      const from = event.currentTarget;
      const input = event.currentTarget instanceof HTMLInputElement ? event.currentTarget : null;
      const whole = !input || (input.selectionStart === 0 && input.selectionEnd === input.value.length);
      const isNew = row === newRow;
      if ((event.ctrlKey || event.metaKey) && event.key === "-" && !isNew) {
        event.preventDefault();
        remove(row);
        const grid = from.closest("[data-grid]");
        requestAnimationFrame(() => grid && focusCell(grid, row, col));
        return;
      }
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown": {
          event.preventDefault();
          const delta = event.key === "ArrowUp" ? -1 : 1;
          if (event.altKey) { if (!isNew) move(from, row, delta, col); return; }
          focusCell(from, row + delta, col);
          return;
        }
        case "ArrowLeft":
          if (!whole && (input!.selectionStart !== 0 || input!.selectionEnd !== 0)) return;
          event.preventDefault();
          focusCell(from, row, col - 1);
          return;
        case "ArrowRight":
          if (!whole && input!.selectionStart !== input!.value.length) return;
          event.preventDefault();
          focusCell(from, row, col + 1);
          return;
        case "Enter":
          if (event.nativeEvent.isComposing) return;
          event.preventDefault();
          if (isNew) add(from);
          else focusCell(from, row + (event.shiftKey ? -1 : 1), col);
          return;
      }
    },
  });

  const paste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const text = event.clipboardData.getData("text/plain").replace(/\r?\n$/, "");
    if (target.dataset.row === undefined || !/[\t\n]/.test(text)) return;
    event.preventDefault();
    const row = Number(target.dataset.row);
    onChange(pasteGrid(products, row, Number(target.dataset.col), text, types));
    if (row === newRow) setDraft(EMPTY_DRAFT);
    const lines = text.split(/\r?\n/).length;
    toast.success(lines === 1 ? "1 linha colada." : `${lines} linhas coladas.`);
  };

  const title = !priced(draft);
  return (
    <div>
      <div data-grid onPaste={paste} className="max-h-[min(70vh,48rem)] overflow-auto rounded-lg border bg-card">
        <table className="w-full min-w-[36rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-9" />
            <col />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-11" />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-muted text-left text-xs font-medium text-muted-foreground">
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-r [&>th]:px-3 [&>th:last-child]:border-r-0">
              <th scope="col" className="text-center">#</th>
              <th scope="col">Produto</th>
              <th scope="col" className="text-right">Preço</th>
              <th scope="col">Unidade</th>
              <th scope="col">Etiqueta</th>
              <th scope="col"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-b [&_td]:border-r [&_td]:p-0 [&_td:last-child]:border-r-0 [&_tr:last-child_td]:border-b-0">
            {products.map((product, row) => {
              const isTitle = !priced(product);
              return (
                <tr key={product.id} className="group focus-within:bg-accent/50">
                  <td className="text-center text-xs tabular-nums text-muted-foreground">{row + 1}</td>
                  <td><NameCell value={product.name} label="Nome do produto" strong={isTitle} onChange={name => update(product.id, { name })} nav={navFor(row, 0)} /></td>
                  <td>{isTitle ? <Blank nav={navFor(row, 1)} label="Preço (título não tem preço)" />
                    : <PriceInput {...navFor(row, 1)} aria-label="Preço" className={cell} value={product.price} onCommit={price => update(product.id, { price })} />}</td>
                  <td>{isTitle ? <Blank nav={navFor(row, 2)} label="Unidade (título não tem unidade)" />
                    : <UnitCell value={product.unit} onChange={unit => update(product.id, { unit })} nav={navFor(row, 2)} />}</td>
                  <td><TypeCell value={product.cellType} types={types} onChange={cellType => update(product.id, { cellType })} nav={navFor(row, 3)} /></td>
                  <td className="text-center">
                    <button type="button" tabIndex={-1} aria-label={`Remover ${product.name}`} onClick={() => remove(row)}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-muted/40 focus-within:bg-accent/50">
              <td className="text-center text-muted-foreground"><Plus className="mx-auto size-3.5" aria-hidden /></td>
              <td>
                <NameCell value={draft.name} label="Nome do novo produto" nav={navFor(newRow, 0)}
                  placeholder={products.length ? "Novo produto" : "Digite o primeiro produto ou cole do Excel"}
                  onChange={name => setDraft(d => ({ ...d, name }))} />
              </td>
              <td>
                {title ? <Blank nav={navFor(newRow, 1)} label="Preço (título não tem preço)" /> : (
                  <input {...navFor(newRow, 1)} aria-label="Preço do novo produto" inputMode="decimal" placeholder="0,00"
                    className={cn(cell, "text-right tabular-nums")} value={draft.priceText}
                    onFocus={e => e.target.select()}
                    onChange={e => setDraft(d => ({ ...d, priceText: e.target.value }))}
                    onBlur={() => { const price = readPrice(draft.priceText); if (price) setDraft(d => ({ ...d, priceText: decimal(price) })); }} />
                )}
              </td>
              <td>
                {title ? <Blank nav={navFor(newRow, 2)} label="Unidade (título não tem unidade)" />
                  : <UnitCell value={draft.unit} onChange={unit => setDraft(d => ({ ...d, unit }))} nav={navFor(newRow, 2)} />}
              </td>
              <td><TypeCell value={draft.cellType} types={types} onChange={cellType => setDraft(d => ({ ...d, cellType }))} nav={navFor(newRow, 3)} /></td>
              <td className="text-center">
                <button type="button" aria-label="Adicionar produto" onClick={e => add(e.currentTarget)}
                  className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                  <Plus className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 hidden flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:flex">
        <span><Kbd>↑↓←→</Kbd> navegar</span>
        <span><Kbd>Enter</Kbd> descer; na última linha, adicionar</span>
        <span><Kbd>Esc</Kbd> desfazer a célula</span>
        <span><Kbd>Espaço</Kbd> abrir a lista</span>
        <span><Kbd>Alt</Kbd> + <Kbd>↑↓</Kbd> mover a linha</span>
        <span><Kbd>Ctrl</Kbd> + <Kbd>−</Kbd> apagar a linha</span>
        <span>Cole várias linhas do Excel ou do Planilhas Google</span>
      </p>
    </div>
  );
}
