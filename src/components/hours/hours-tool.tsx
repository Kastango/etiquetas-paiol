"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Download, FileText, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import { Button } from "@/components/ui/button";
import { Input, inputClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCopy } from "@/lib/clipboard";
import { downloadBlob } from "@/lib/download";
import { poppins } from "@/lib/fonts";
import { HOURS_FORMATS, defaultHours, drawHours, hoursText, type Hours, type HoursAssets, type HoursFormat, type HoursRow } from "@/lib/hours";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "hours-draft";

function loadDraft(): Hours {
  try {
    return { ...defaultHours(), ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") };
  } catch {
    return defaultHours(); // a broken draft just falls back to the store's hours
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    img.src = src;
  });
}

const iconButton = "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function HoursTool() {
  return <ClientOnly><HoursEditor /></ClientOnly>;
}

function HoursEditor() {
  const [hours, setHours] = useState<Hours>(loadDraft);
  const [format, setFormat] = useState<HoursFormat>("a4");
  const [assets, setAssets] = useState<HoursAssets | null>(null);
  const [busy, setBusy] = useState(false);
  const { copied, copy } = useCopy("Não foi possível copiar o texto.");
  const canvas = useRef<HTMLCanvasElement>(null);
  const set = (changes: Partial<Hours>) => setHours(h => ({ ...h, ...changes }));
  const setRow = (index: number, changes: Partial<HoursRow>) =>
    setHours(h => ({ ...h, rows: h.rows.map((row, i) => (i === index ? { ...row, ...changes } : row)) }));
  const move = (index: number, to: number) => setHours(h => {
    const rows = [...h.rows];
    [rows[index], rows[to]] = [rows[to], rows[index]];
    return { ...h, rows };
  });

  useEffect(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(hours)), [hours]);

  useEffect(() => {
    Promise.all([
      ...[400, 500, 600].map(w => document.fonts.load(`${w} 40px ${poppins.style.fontFamily}`, "Horário Sábado 8h30 Áá")),
      loadImage("/brand/paiol-horizontal-reversed.png"),
    ])
      .then(loaded => setAssets({ logo: loaded.at(-1) as HTMLImageElement, sans: poppins.style.fontFamily }))
      .catch(() => toast.error("Não foi possível carregar a logo. Recarregue a página."));
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx && assets) drawHours(ctx, hours, format, assets);
  }, [hours, format, assets]);

  const render = () => {
    const element = document.createElement("canvas");
    drawHours(element.getContext("2d")!, hours, format, assets!);
    return element;
  };
  const name = `horario-paiol-${format === "a4" ? "a4" : HOURS_FORMATS[format].detail.replace(":", "x")}`;
  const downloadPng = () => render().toBlob(blob => (blob ? downloadBlob(blob, `${name}.png`) : toast.error("Não foi possível gerar a imagem.")), "image/png");
  // A4 sheet with the image edge to edge, for printing at the right size.
  const downloadPdf = async () => {
    setBusy(true);
    try {
      const { Document, Image: Picture, Page, pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <Document title="Horário de funcionamento · Paiol">
          <Page size="A4"><Picture src={render().toDataURL("image/png")} style={{ width: "100%", height: "100%" }} /></Page>
        </Document>,
      ).toBlob();
      downloadBlob(blob, `${name}.pdf`);
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const F = HOURS_FORMATS[format];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-6" onSubmit={e => e.preventDefault()}>
        <div className="space-y-1.5">
          <Label htmlFor="hours-title">Título</Label>
          <Input id="hours-title" maxLength={40} value={hours.title} onChange={e => set({ title: e.target.value })} />
        </div>

        <fieldset className="space-y-3">
          <legend className="pb-2 font-semibold">Dias e horários</legend>
          <ol className="space-y-3">
            {hours.rows.map((row, index) => (
              <li key={index} className="space-y-2 rounded-lg border bg-card p-3">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`days-${index}`} className="sr-only">Dias, linha {index + 1}</Label>
                  <Input id={`days-${index}`} placeholder="Segunda a sexta" value={row.days} onChange={e => setRow(index, { days: e.target.value })} />
                  <button type="button" className={iconButton} aria-label={`Subir ${row.days || "a linha"}`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" className={iconButton} aria-label={`Descer ${row.days || "a linha"}`} disabled={index === hours.rows.length - 1} onClick={() => move(index, index + 1)}>
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" className={cn(iconButton, "hover:text-destructive")} aria-label={`Apagar ${row.days || "a linha"}`}
                    onClick={() => set({ rows: hours.rows.filter((_, i) => i !== index) })}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <Label htmlFor={`hours-${index}`} className="sr-only">Horário, linha {index + 1}</Label>
                <textarea id={`hours-${index}`} rows={Math.max(1, row.hours.split("\n").length)} placeholder="Das 8h30 às 12h00"
                  className={cn(inputClassName, "h-auto resize-none font-semibold")} value={row.hours} onChange={e => setRow(index, { hours: e.target.value })} />
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Enter no horário quebra a linha no cartaz.</p>
          <Button type="button" variant="outline" onClick={() => set({ rows: [...hours.rows, { days: "", hours: "" }] })}>
            <Plus /> Adicionar dia
          </Button>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="hours-note">Aviso</Label>
          <textarea id="hours-note" rows={2} placeholder="Feriado de 2 de novembro: fechado" className={cn(inputClassName, "h-auto resize-none")}
            value={hours.note} onChange={e => set({ note: e.target.value })} />
          <p className="text-xs text-muted-foreground">Opcional. Aparece em vinho, abaixo dos horários.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hours-whatsapp">WhatsApp</Label>
          <Input id="hours-whatsapp" inputMode="tel" placeholder="Deixe vazio para não mostrar" value={hours.whatsapp} onChange={e => set({ whatsapp: e.target.value })} />
        </div>

        <Button type="button" variant="ghost" className="text-muted-foreground"
          onClick={() => window.confirm("Voltar ao horário de sempre da loja? As mudanças daqui se perdem.") && setHours(defaultHours())}>
          <RotateCcw /> Voltar ao horário da loja
        </Button>
      </form>

      {/* On phones the preview comes first, so the sign is visible while the form is filled in below it. */}
      <section aria-labelledby="hours-preview" className="order-first min-w-0 space-y-4 lg:sticky lg:top-8 lg:order-none lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hours-preview" className="font-semibold">Prévia</h2>
          <div role="radiogroup" aria-label="Formato" className="grid w-full grid-cols-3 rounded-lg border bg-card p-1 sm:inline-flex sm:w-auto">
            {(Object.keys(HOURS_FORMATS) as HoursFormat[]).map(key => (
              <button key={key} type="button" role="radio" aria-checked={format === key} onClick={() => setFormat(key)}
                className={cn("h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  format === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {HOURS_FORMATS[key].label} <span className="opacity-70">{HOURS_FORMATS[key].detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center rounded-lg border bg-muted p-3 sm:p-4">
          <canvas ref={canvas} width={F.width} height={F.height} role="img" aria-label={`Cartaz: ${hoursText(hours)}`}
            className="h-auto max-h-[55vh] w-auto max-w-full rounded-sm shadow-xs lg:max-h-[70vh]"
            style={{ aspectRatio: `${F.width} / ${F.height}` }} />
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {format === "a4" && (
            <Button className="h-11 sm:h-10" disabled={!assets || busy} onClick={downloadPdf}>
              {busy ? <Loader2 className="animate-spin" /> : <FileText />} Baixar PDF para imprimir
            </Button>
          )}
          <Button variant={format === "a4" ? "outline" : "default"} className="h-11 sm:h-10" disabled={!assets} onClick={downloadPng}>
            <Download /> Baixar PNG <span className="hidden sm:inline">({F.width} × {F.height})</span>
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Texto para WhatsApp e Instagram</h3>
            <Button variant="ghost" size="sm" onClick={() => copy(hoursText(hours))}>{copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}</Button>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{hoursText(hours)}</p>
        </div>
      </section>
    </div>
  );
}
