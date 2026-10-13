"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/price-input";
import { Input, inputClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchPhoto, photos } from "@/lib/brand";
import { useCopy } from "@/lib/clipboard";
import { downloadBlob } from "@/lib/download";
import { fraunces, poppins } from "@/lib/fonts";
import { OccasionPicker } from "@/components/occasion-picker";
import { FORMATS, caption, drawOffer, inAWeek, isoDate, offerLogo, validityText, type Offer, type OfferAssets, type OfferFormat } from "@/lib/offer";
import { LOGOS, PADRAO, occasion, offerUntil, unmarked } from "@/lib/occasions";
import { UNITS, currency } from "@/lib/products";
import { cn, slug } from "@/lib/utils";
import { PhotoPicker } from "./photo-picker";

const DRAFT_KEY = "offer-draft";
const example = (): Offer => ({
  name: "Nozes chilenas quebradas", price: 4.79, oldPrice: 5, unit: "100g",
  headline: PADRAO.headlines[0], until: inAWeek(), background: "white", theme: PADRAO.id, palette: 0,
  logo: "auto", priceColour: "date",
});

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    img.src = src;
  });
}

async function loadFonts() {
  await Promise.all([
    ...[500, 700, 800].map(w => document.fonts.load(`${w} 40px ${poppins.style.fontFamily}`, "R$ 0,00 Áá")),
    document.fonts.load(`900 40px ${fraunces.style.fontFamily}`, "Oferta"),
  ]);
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A small labelled group of buttons, one of them chosen. */
function Choice({ label, options }: { label: string; options: { label: string; active: boolean; pick: () => void }[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-none">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 rounded-lg border bg-card p-1">
        {options.map(option => (
          <button key={option.label} type="button" role="radio" aria-checked={option.active} onClick={option.pick}
            className={cn("min-h-8 rounded-md px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              option.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The saved draft; an end date already past moves to a week from today, so an old draft never posts an expired offer. */
function loadDraft(): Offer {
  const initial = example();
  try {
    const offer: Offer & { validity?: string } = { ...initial, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") };
    delete offer.validity; // free text, before `until`
    if (offer.until !== null && !(offer.until >= isoDate(new Date()))) offer.until = initial.until;
    return offer;
  } catch {
    return initial; // a broken draft just falls back to the example
  }
}


/** ?formato=story opens straight in that format. */
function requestedFormat(): OfferFormat {
  const requested = new URLSearchParams(window.location.search).get("formato");
  return requested && requested in FORMATS ? (requested as OfferFormat) : "square";
}

export function OfferTool() {
  return <ClientOnly><OfferEditor /></ClientOnly>;
}

function OfferEditor() {
  const [offer, setOffer] = useState<Offer>(loadDraft);
  const [format, setFormat] = useState<OfferFormat>(requestedFormat);
  const [photoSrc, setPhotoSrc] = useState(() => (matchPhoto(offer.name) ?? photos[0]).src);
  const [assets, setAssets] = useState<OfferAssets | null>(null);
  const [busy, setBusy] = useState(false);
  const { copied, copy } = useCopy("Não foi possível copiar a legenda.");
  const canvas = useRef<HTMLCanvasElement>(null);
  const set = (changes: Partial<Offer>) => setOffer(o => ({ ...o, ...changes }));

  useEffect(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(offer)), [offer]);

  // Reloads fonts, the theme's logo and lights, and the photo; uploaded photos are object URLs that live only in memory.
  const logo = LOGOS[offerLogo(offer)], lights = occasion(offer.theme).lights;
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFonts(), loadImage(logo), lights ? loadImage(lights) : null, loadImage(photoSrc).catch(() => null)])
      .then(([, logo, lights, photo]) => {
        if (!cancelled) setAssets({ logo, lights, photo, sans: poppins.style.fontFamily, display: fraunces.style.fontFamily });
      })
      .catch(() => toast.error("Não foi possível carregar a logo. Recarregue a página."));
    return () => { cancelled = true; };
  }, [photoSrc, logo, lights]);

  /**
   * A headline still at one of the old theme's suggestions takes the new theme's first; an end date runs
   * to the new date (the eve of a holiday), and back to a week from today from a date's own end.
   */
  const pickTheme = (id: string) => {
    const old = occasion(offer.theme), next = occasion(id);
    const until = offer.until === null ? null
      : id === PADRAO.id ? (offer.until === offerUntil(old) ? inAWeek() : offer.until)
      : offerUntil(next) ?? offer.until;
    set({ theme: id, palette: 0, logo: "auto", until, headline: old.headlines.includes(offer.headline) ? next.headlines[0] : offer.headline });
  };

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx && assets) drawOffer(ctx, offer, format, assets);
  }, [offer, format, assets]);

  const render = (target: OfferFormat) => new Promise<Blob>((resolve, reject) => {
    const element = document.createElement("canvas");
    drawOffer(element.getContext("2d")!, offer, target, assets!);
    element.toBlob(blob => (blob ? resolve(blob) : reject(new Error("PNG vazio"))), "image/png");
  });
  const download = async (targets: OfferFormat[]) => {
    setBusy(true);
    try {
      for (const target of targets) {
        downloadBlob(await render(target), `oferta-${slug(offer.name) || "paiol"}-${FORMATS[target].ratio.replace(":", "x")}.png`);
        await new Promise(r => setTimeout(r, 300));
      }
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const layout = FORMATS[format].layout;
  const oldPriceProblem = offer.oldPrice > 0 && offer.oldPrice <= offer.price;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-6" onSubmit={e => e.preventDefault()}>
        <div className="space-y-3">
          <OccasionPicker theme={offer.theme} palette={offer.palette} onTheme={pickTheme} onPalette={index => set({ palette: index, logo: "auto" })} />
          {offer.theme !== PADRAO.id && (
            <div className="grid grid-cols-2 gap-3">
              <Choice label="Logo" options={(["color", "white"] as const).map(logo => ({
                label: logo === "color" ? "Colorida" : "Branca", active: offerLogo(offer) === logo, pick: () => set({ logo }) }))} />
              <Choice label="Cor do preço" options={(["date", "vinho"] as const).map(priceColour => ({
                label: priceColour === "date" ? "Da data" : "Vinho", active: offer.priceColour === priceColour, pick: () => set({ priceColour }) }))} />
            </div>
          )}
        </div>

        <fieldset className="space-y-4">
          <legend className="pb-2 font-semibold">Produto</legend>
          <Field id="name" label="Nome" hint="Use | para escolher onde a linha quebra.">
            <Input id="name" value={offer.name} onChange={e => set({ name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-[1fr_1fr_6rem] gap-3">
            <Field id="price" label="Preço">
              <PriceInput id="price" className={inputClassName} value={offer.price} onCommit={price => set({ price })} />
            </Field>
            <Field id="old-price" label="Preço anterior">
              <PriceInput id="old-price" className={inputClassName} placeholder="Opcional" blankWhenZero aria-invalid={oldPriceProblem}
                value={offer.oldPrice} onCommit={oldPrice => set({ oldPrice })} />
            </Field>
            <Field id="unit" label="Unidade">
              <Select value={offer.unit} onValueChange={unit => set({ unit })}>
                <SelectTrigger id="unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(UNITS.includes(offer.unit) ? UNITS : [...UNITS, offer.unit]).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {oldPriceProblem && (
            <p role="status" className="text-sm text-destructive">O preço anterior só aparece quando for maior que o da oferta.</p>
          )}
        </fieldset>

        <PhotoPicker productName={offer.name} value={photoSrc} onChange={setPhotoSrc} />

        <fieldset className="space-y-4">
          <legend className="pb-2 font-semibold">Faixa</legend>
          <Field id="headline" label="Chamada" hint="Curta. | quebra a linha; *palavra* entre asteriscos fica em destaque.">
            <Input id="headline" maxLength={40} value={offer.headline} onChange={e => set({ headline: e.target.value })} />
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Chamadas sugeridas">
              {occasion(offer.theme).headlines.map(headline => (
                <button key={headline} type="button" onClick={() => set({ headline })}
                  className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent", offer.headline === headline && "border-primary bg-primary/10 text-primary")}>
                  {unmarked(headline).replace(/\s*\|\s*/g, " ")}
                </button>
              ))}
            </div>
          </Field>
          <Field id="validity" label="Validade" hint={`No post: “${validityText(offer)}”`}>
            <div role="radiogroup" aria-label="Validade" className="grid grid-cols-2 rounded-lg border bg-card p-1">
              {[
                { label: "Até uma data", active: offer.until !== null, until: offer.until ?? inAWeek() },
                { label: "Enquanto durarem os estoques", active: offer.until === null, until: null },
              ].map(option => (
                <button key={option.label} type="button" role="radio" aria-checked={option.active} onClick={() => set({ until: option.until })}
                  className={cn("min-h-9 rounded-md px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    option.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {option.label}
                </button>
              ))}
            </div>
            {offer.until !== null && (
              <Input id="validity" type="date" aria-label="Último dia da oferta" min={isoDate(new Date())} value={offer.until}
                onChange={e => set({ until: e.target.value || inAWeek() })} />
            )}
          </Field>
          <Field id="background" label="Fundo">
            <Select value={offer.background} onValueChange={(background: Offer["background"]) => set({ background })}>
              <SelectTrigger id="background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="white">Branco</SelectItem>
                <SelectItem value="palha">Palha</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </fieldset>
      </form>

      {/* On phones the preview comes first, so the post is visible while the form is filled in below it. */}
      <section aria-labelledby="offer-preview" className="order-first min-w-0 space-y-4 lg:sticky lg:top-8 lg:order-none lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="offer-preview" className="font-semibold">Prévia</h2>
          <div role="radiogroup" aria-label="Formato" className="grid w-full grid-cols-3 rounded-lg border bg-card p-1 sm:inline-flex sm:w-auto">
            {(Object.keys(FORMATS) as OfferFormat[]).map(key => (
              <button key={key} type="button" role="radio" aria-checked={format === key} onClick={() => setFormat(key)}
                className={cn("h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  format === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {FORMATS[key].label} <span className="opacity-70">{FORMATS[key].ratio}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center rounded-lg border bg-muted p-3 sm:p-4">
          <canvas ref={canvas} width={layout.width} height={layout.height} role="img"
            aria-label={`Post de oferta: ${offer.name}, ${currency(offer.price)}`}
            className="h-auto max-h-[55vh] w-auto max-w-full rounded-sm shadow-xs lg:max-h-[70vh]"
            style={{ aspectRatio: `${layout.width} / ${layout.height}` }} />
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button className="h-11 sm:h-10" disabled={!assets || busy} onClick={() => download([format])}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />} Baixar {FORMATS[format].label.toLowerCase()}
            <span className="hidden sm:inline">({layout.width} × {layout.height})</span>
          </Button>
          <Button variant="outline" className="h-11 sm:h-10" disabled={!assets || busy} onClick={() => download(Object.keys(FORMATS) as OfferFormat[])}>
            Baixar os três formatos
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Legenda sugerida</h3>
            <Button variant="ghost" size="sm" onClick={() => copy(caption(offer))}>{copied ? <Check /> : <Copy />} {copied ? "Copiada" : "Copiar"}</Button>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{caption(offer)}</p>
        </div>
      </section>
    </div>
  );
}
