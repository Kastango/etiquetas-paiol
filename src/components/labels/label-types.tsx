"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUILT_IN_TYPES, LIMITS, PRICE_LAYOUTS, SHEET, checkType, perRow, type LabelType } from "@/lib/label-types";
import { cn } from "@/lib/utils";

type Fields = Omit<LabelType, "id">;
const BLANK: Fields = { name: "", width: 65, height: 30, price: "below" };
const row = "grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_11rem_5.5rem_2.25rem]";
const wide = "col-span-2 sm:col-span-1";
const priceLabel = (price: LabelType["price"]) => PRICE_LAYOUTS.find(layout => layout.value === price)!.label;
const fits = (type: Fields) => `${perRow({ ...type, id: "" })} por linha`;

/** Name, size and price position of a type; `commit` runs when a field is left or the price changes. */
function TypeFields({ value, onChange, commit, label }: { value: Fields; onChange: (value: Fields) => void; commit?: (value: Fields) => void; label: string }) {
  const number = (key: "width" | "height", name: string) => (
    <label className="relative">
      <span className="sr-only">{name} de {label}, em mm</span>
      <input type="number" inputMode="decimal" step={0.5} min={LIMITS[key].min} max={LIMITS[key].max} className={cn(inputClassName, "pr-9 tabular-nums")}
        value={Number.isNaN(value[key]) ? "" : value[key]} onChange={e => onChange({ ...value, [key]: e.target.valueAsNumber })}
        onBlur={() => commit?.(value)} />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
    </label>
  );
  return (
    <>
      <input aria-label={`Nome de ${label}`} placeholder="Nome, como Gôndola" className={cn(inputClassName, wide)} value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })} onBlur={() => commit?.(value)} />
      {number("width", "Largura")}
      {number("height", "Altura")}
      <Select value={value.price} onValueChange={(price: Fields["price"]) => { onChange({ ...value, price }); commit?.({ ...value, price }); }}>
        <SelectTrigger aria-label={`Preço de ${label}`} className={wide}><SelectValue /></SelectTrigger>
        <SelectContent>{PRICE_LAYOUTS.map(layout => <SelectItem key={layout.value} value={layout.value}>{layout.label}</SelectItem>)}</SelectContent>
      </Select>
    </>
  );
}

function CustomType({ type, others, onUpdate, onDelete }: { type: LabelType; others: LabelType[]; onUpdate: (type: LabelType) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState<Fields>(type);
  const commit = (value: Fields) => {
    const problem = checkType(value, others);
    if (problem) { toast.error(problem); setDraft(type); return; }
    onUpdate({ ...value, id: type.id, name: value.name.trim() });
  };
  return (
    <li className={row}>
      <TypeFields value={draft} onChange={setDraft} commit={commit} label={type.name} />
      <span className="text-xs text-muted-foreground">{checkType(draft, others) ? "" : fits(draft)}</span>
      <button type="button" aria-label={`Apagar o tipo ${type.name}`} onClick={onDelete}
        className="inline-flex size-9 items-center justify-center justify-self-end rounded-md text-muted-foreground hover:bg-accent hover:text-destructive">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

/** The label types: the three of the original sheet, fixed, and the ones created here, editable. */
export function LabelTypes({ types, onAdd, onUpdate, onDelete }: {
  types: LabelType[]; onAdd: (fields: Fields) => void; onUpdate: (type: LabelType) => void; onDelete: (type: LabelType) => void;
}) {
  const [draft, setDraft] = useState(BLANK);
  const custom = types.slice(BUILT_IN_TYPES.length);
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = checkType(draft, types);
    if (problem) return toast.error(problem);
    onAdd({ ...draft, name: draft.name.trim() });
    setDraft(BLANK);
  };

  return (
    <details className="rounded-lg border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
        Tipos de etiqueta <span className="font-normal text-muted-foreground">· {types.length}</span>
      </summary>
      <div className="space-y-3 border-t p-4">
        <p className="text-sm text-muted-foreground">
          Crie tipos com outros tamanhos. Cada linha da folha leva um só tamanho, para cortar reto: os maiores vêm primeiro e
          cada tamanho segue a ordem da lista. Área útil da folha A4: {SHEET.width} × {SHEET.height} mm.
        </p>
        <div className={cn(row, "hidden text-xs font-medium text-muted-foreground sm:grid")} aria-hidden>
          <span>Nome</span><span>Largura</span><span>Altura</span><span>Preço</span><span>Na folha</span><span />
        </div>
        <ul className="space-y-3 sm:space-y-2">
          {BUILT_IN_TYPES.map(type => (
            <li key={type.id} className={cn(row, "text-sm")}>
              <span className={cn(wide, "font-medium")}>{type.name}</span>
              <span className="tabular-nums">{type.width} mm</span>
              <span className="tabular-nums">{type.height} mm</span>
              <span className={wide}>{priceLabel(type.price)}</span>
              <span className="text-xs text-muted-foreground">{fits(type)}</span>
              <span />
            </li>
          ))}
          {custom.map(type => (
            <CustomType key={type.id} type={type} others={types.filter(other => other.id !== type.id)} onUpdate={onUpdate} onDelete={() => onDelete(type)} />
          ))}
        </ul>
        <form onSubmit={add} noValidate className={cn(row, "-mx-2 rounded-md border border-dashed border-primary/40 bg-muted/40 p-2")}>
          <TypeFields value={draft} onChange={setDraft} label="novo tipo" />
          <span className="text-xs text-muted-foreground">{checkType(draft, types) ? "" : fits(draft)}</span>
          <Button type="submit" size="icon" aria-label="Criar tipo" className="justify-self-end"><Plus /></Button>
        </form>
      </div>
    </details>
  );
}
