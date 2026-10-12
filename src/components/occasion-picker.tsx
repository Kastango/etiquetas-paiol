"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PADRAO, nextDate, occasion, shortDate, upcoming } from "@/lib/occasions";
import { cn } from "@/lib/utils";

const segment = "min-h-9 rounded-md px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

/** Padrão or a date of the year, nearest first, then one of its suggested palettes. */
export function OccasionPicker({ theme, palette, onTheme, onPalette }: {
  theme: string; palette: number; onTheme: (id: string) => void; onPalette: (index: number) => void;
}) {
  const dated = theme !== PADRAO.id;
  const current = occasion(theme);
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p id="theme-label" className="text-sm font-medium leading-none">Tema</p>
        <div role="radiogroup" aria-labelledby="theme-label" className="grid grid-cols-2 rounded-lg border bg-card p-1">
          {[{ label: "Padrão", active: !dated, id: PADRAO.id }, { label: "Data comemorativa", active: dated, id: dated ? theme : upcoming()[0].id }].map(option => (
            <button key={option.label} type="button" role="radio" aria-checked={option.active} onClick={() => !option.active && onTheme(option.id)}
              className={cn(segment, option.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {dated && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="space-y-1.5">
            <label htmlFor="occasion" className="text-sm font-medium leading-none">Data</label>
            <Select value={theme} onValueChange={onTheme}>
              <SelectTrigger id="occasion"><SelectValue /></SelectTrigger>
              <SelectContent>
                {upcoming().map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name} <span className="text-muted-foreground">· {shortDate(nextDate(o)!)}{o.holiday ? " · feriado" : ""}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p id="palette-label" className="text-sm font-medium leading-none">Cores</p>
            <div role="radiogroup" aria-labelledby="palette-label" className="flex gap-1.5">
              {current.palettes.map((p, index) => (
                <button key={p.band} type="button" role="radio" aria-checked={palette === index} onClick={() => onPalette(index)}
                  aria-label={index === 0 ? "Paleta sugerida" : "Paleta alternativa"} title={index === 0 ? "Sugerida" : "Alternativa"}
                  className={cn("flex h-10 w-12 items-end justify-end rounded-md border-2 p-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    palette === index ? "border-foreground" : "border-transparent")}
                  style={{ backgroundColor: p.band }}>
                  <span className="size-3.5 rounded-full" style={{ backgroundColor: p.highlight }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
