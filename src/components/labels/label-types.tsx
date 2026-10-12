"use client";

import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { inputClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { layoutLabel } from "@/lib/label-layout";
import { BUILT_IN_TYPES, LIMITS, PRICE_LAYOUTS, SHEET, checkType, perRow, type LabelType } from "@/lib/label-types";
import { decimal, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

type Fields = Omit<LabelType, "id">;
const BLANK: Fields = { name: "", width: 65, height: 30, price: "below" };
const SAMPLE: Product = { id: 0, name: "Castanha-do-pará", price: 89.9, unit: "kg", cellType: "" };
const SAMPLE_TITLE: Product = { ...SAMPLE, name: "Castanhas", price: 0 };
const priceLabel = (price: LabelType["price"]) => PRICE_LAYOUTS.find(layout => layout.value === price)!.label;
const fits = (type: Fields) => `${perRow({ ...type, id: "" })} por linha`;
const sizeOk = (type: Fields) => checkType({ ...type, name: "-" }, []) === null;

/** The label at scale, laid out as in the PDF (label-pdf), with a sample product. Sizes in cqw of the wrapper, which is the label's width. */
function Preview({ type }: { type: Fields }) {
  if (!sizeOk(type)) {
    return <div className="flex h-28 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">Informe largura e altura</div>;
  }
  const sample = type.price === "none" ? SAMPLE_TITLE : SAMPLE;
  const { padding, name, price, beside } = layoutLabel(sample, { ...type, id: "" });
  const mm = (value: number) => `${(value / type.width) * 100}cqw`;
  const pt = (value: number) => mm((value * 25.4) / 72);
  return (
    // At most 11rem tall: tall labels shrink instead of filling the dialog.
    <div className="mx-auto @container" style={{ width: `min(100%, ${(11 * type.width) / type.height}rem)` }} aria-hidden>
      <div className={cn("flex items-center bg-primary font-sans text-white", beside ? "justify-between" : "flex-col justify-center")}
        style={{ aspectRatio: `${type.width} / ${type.height}`, padding: mm(padding) }}>
        <div className={beside ? "min-w-0 flex-1 text-left" : "text-center"}>
          {name.lines.map((line, index) => (
            <div key={index} className="whitespace-nowrap font-bold" style={{ fontSize: pt(name.size), lineHeight: 1.11 }}>{line}</div>
          ))}
        </div>
        {price && (
          <div className="flex shrink-0 items-end leading-none" style={beside ? { marginLeft: mm(price.gapBeside) } : { marginTop: mm(price.gapAbove) }}>
            <span className="font-medium" style={{ fontSize: pt(price.small) }}>R$</span>
            <span className="font-extrabold" style={{ fontSize: pt(price.value), margin: `0 ${pt(price.valueMargin)}` }}>{decimal(sample.price)}</span>
            <span className="font-medium" style={{ fontSize: pt(price.small) }}>{sample.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Creates a type, or edits one when `type` is given. */
function TypeForm({ type, others, onCancel, onSave }: {
  type: LabelType | null; others: LabelType[]; onCancel: () => void; onSave: (fields: Fields) => void;
}) {
  const [draft, setDraft] = useState<Fields>(type ?? BLANK);
  const [problem, setProblem] = useState<string | null>(null);
  const change = (fields: Partial<Fields>) => { setDraft(d => ({ ...d, ...fields })); setProblem(null); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = checkType(draft, others);
    if (found) return setProblem(found);
    onSave({ ...draft, name: draft.name.trim() });
  };
  const number = (key: "width" | "height", label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`type-${key}`}>{label}</Label>
      <div className="relative">
        <input id={`type-${key}`} type="number" inputMode="decimal" step={0.5} min={LIMITS[key].min} max={LIMITS[key].max}
          className={cn(inputClassName, "pr-10 tabular-nums")} value={Number.isNaN(draft[key]) ? "" : draft[key]}
          onChange={e => change({ [key]: e.target.valueAsNumber })} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
      </div>
      <p className="text-xs text-muted-foreground">De {LIMITS[key].min} a {LIMITS[key].max} mm</p>
    </div>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{type ? `Editar “${type.name}”` : "Novo tipo de etiqueta"}</DialogTitle>
        <DialogDescription>Depois, escolha o tipo de cada produto na coluna Etiqueta da lista.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="type-name">Nome</Label>
          <input id="type-name" placeholder="Gôndola, Vitrine, Mini…" className={inputClassName} value={draft.name}
            onChange={e => change({ name: e.target.value })} autoFocus={!type} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {number("width", "Largura")}
          {number("height", "Altura")}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">Preço</legend>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {PRICE_LAYOUTS.map(layout => (
              <label key={layout.value} className={cn("flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                draft.price === layout.value ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-accent")}>
                <input type="radio" name="type-price" value={layout.value} checked={draft.price === layout.value}
                  onChange={() => change({ price: layout.value })} className="sr-only" />
                {layout.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <Preview type={draft} />
          <p className="text-center text-xs text-muted-foreground">
            {sizeOk(draft) ? `${draft.width} × ${draft.height} mm · cabem ${fits(draft)} na folha A4` : `Área útil da folha A4: ${SHEET.width} × ${SHEET.height} mm`}
          </p>
        </div>
        {problem && <p role="alert" className="text-sm font-medium text-destructive">{problem}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Voltar</Button>
          <Button type="submit">{type ? "Salvar" : "Criar tipo"}</Button>
        </DialogFooter>
      </form>
    </>
  );
}

/** The label types, behind a button: the three of the original sheet, fixed, and the ones created here.
 * The dialog shows the list, or the form for one type. */
export function LabelTypes({ types, onAdd, onUpdate, onDelete }: {
  types: LabelType[]; onAdd: (fields: Fields) => void; onUpdate: (type: LabelType) => void; onDelete: (type: LabelType) => void;
}) {
  const [open, setOpen] = useState(false);
  // The form mounts afresh from the list each time, so its fields start over.
  const [editing, setEditing] = useState<{ type: LabelType | null } | null>(null);
  const edit = (type: LabelType | null) => setEditing({ type });
  const custom = types.slice(BUILT_IN_TYPES.length);

  return (
    <Dialog open={open} onOpenChange={value => { setOpen(value); setEditing(null); }}>
      <DialogTrigger asChild>
        <Button variant="ghost"><Tags /> Tipos de etiqueta</Button>
      </DialogTrigger>
      <DialogContent>
        {editing ? (
          <TypeForm type={editing.type} others={types.filter(other => other.id !== editing.type?.id)}
            onCancel={() => setEditing(null)}
            onSave={fields => { if (editing.type) onUpdate({ ...fields, id: editing.type.id }); else onAdd(fields); setEditing(null); }} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Tipos de etiqueta</DialogTitle>
              <DialogDescription>
                Cada produto usa um tipo, escolhido na coluna Etiqueta. Na folha, cada linha leva um só tamanho, para cortar reto: os maiores vêm primeiro.
              </DialogDescription>
            </DialogHeader>
            <ul className="divide-y border-y">
              {types.map(type => (
                <li key={type.id} className="flex min-h-14 items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{type.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="tabular-nums">{type.width} × {type.height} mm</span> · {priceLabel(type.price).toLowerCase()} · {fits(type)}
                    </p>
                  </div>
                  {custom.includes(type) ? (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" aria-label={`Editar o tipo ${type.name}`} onClick={() => edit(type)}
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" aria-label={`Apagar o tipo ${type.name}`} onClick={() => onDelete(type)}
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : <span className="shrink-0 text-xs text-muted-foreground">Original</span>}
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button type="button" onClick={() => edit(null)}><Plus /> Novo tipo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
