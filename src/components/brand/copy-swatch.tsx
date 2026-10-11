"use client";

import { Check, Copy } from "lucide-react";
import { rgb, type Swatch } from "@/lib/brand";
import { useCopy } from "@/lib/clipboard";

export function CopySwatch({ swatch }: { swatch: Swatch }) {
  const { copied, copy } = useCopy();
  return (
    <li className="overflow-hidden rounded-lg border bg-card">
      <div className="h-24 border-b" style={{ background: swatch.hex }} />
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{swatch.name}</h3>
          <button
            type="button"
            onClick={() => copy(swatch.hex)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {swatch.hex}
            {copied ? <Check className="size-3.5 text-primary" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            <span className="sr-only" aria-live="polite">{copied ? "Copiado" : "Copiar código"}</span>
          </button>
        </div>
        <p className="font-mono text-xs text-muted-foreground">RGB {rgb(swatch.hex).join(" ")}</p>
        <p className="pt-1 text-sm text-muted-foreground">{swatch.role}</p>
      </div>
    </li>
  );
}
