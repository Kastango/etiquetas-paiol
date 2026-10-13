"use client";

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PADRAO, nextDate, occasion, upcoming } from "@/lib/occasions";
import { cn } from "@/lib/utils";

const day = (date: Date) => date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** Padrão, or a date of the year, nearest first, with one of its suggested palettes. */
export function OccasionPicker({ theme, palette, onTheme, onPalette }: {
  theme: string; palette: number; onTheme: (id: string) => void; onPalette: (index: number) => void;
}) {
  const { palettes } = occasion(theme);
  return (
    <div className="space-y-1.5">
      <label htmlFor="occasion" className="text-sm font-medium leading-none">Tema</label>
      {/* One row, centred: Radix adds a hidden native select after the trigger, which would push a bottom-aligned neighbour down. */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Select value={theme} onValueChange={onTheme}>
            <SelectTrigger id="occasion"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={PADRAO.id}>{PADRAO.name}</SelectItem>
              <SelectSeparator />
              {upcoming().map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name} <span className="text-muted-foreground">· {day(nextDate(o)!)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {palettes.length > 1 && (
          <div role="radiogroup" aria-label="Cores" className="flex gap-1.5">
            {palettes.map((p, index) => (
              <button key={p.band} type="button" role="radio" aria-checked={palette === index} onClick={() => onPalette(index)}
                aria-label={index === 0 ? "Cores da data" : "Cores alternativas"}
                className={cn("flex size-10 items-end justify-end rounded-md border-2 p-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  palette === index ? "border-foreground" : "border-transparent")}
                style={{ backgroundColor: p.band }}>
                <span className="size-3 rounded-full" style={{ backgroundColor: p.highlight }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
