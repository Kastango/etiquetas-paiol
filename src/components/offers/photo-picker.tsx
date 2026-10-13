"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, ImagePlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { photos } from "@/lib/brand";
import { removeBackground, trim } from "@/lib/cutout";
import { stockSearches } from "@/lib/stock-search";
import { cn, plain } from "@/lib/utils";

/** null while idle; while cutting, the cutter's download progress (null once it is in the browser). */
type Cutting = { progress: number | null } | null;

/**
 * The library, searchable, and an upload. An uploaded photo always has its background cut, in the browser; if the
 * cut fails, the photo goes in whole, trimmed to its content.
 */
export function PhotoPicker({ productName, value, onChange }: { productName: string; value: string; onChange: (src: string) => void }) {
  const [query, setQuery] = useState("");
  const [cutting, setCutting] = useState<Cutting>(null);
  const upload = useRef<HTMLInputElement>(null);

  const words = plain(query).split(/\s+/).filter(Boolean);
  const found = photos.filter(photo => words.every(word => plain(photo.name).includes(word)));
  const stock = stockSearches((query || productName).replace(/\s*\|\s*/g, " "));

  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um arquivo de imagem (PNG, JPG ou WebP).");
    setCutting({ progress: null });
    try {
      const image = await removeBackground(file, progress => setCutting({ progress })).catch(() => {
        toast("Não deu para recortar o fundo; a foto entrou inteira.");
        return trim(file);
      });
      if (value.startsWith("blob:")) URL.revokeObjectURL(value);
      onChange(URL.createObjectURL(image));
    } catch {
      toast.error("Não foi possível abrir esta foto. Tente outra.");
    } finally {
      setCutting(null);
    }
  };

  const downloading = cutting?.progress != null && cutting.progress < 1;
  return (
    <fieldset className="space-y-3">
      <legend className="pb-2 font-semibold">Foto</legend>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar foto na biblioteca" placeholder={`Buscar entre ${photos.length} fotos`} className="pl-9"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="grid max-h-60 grid-cols-5 gap-2 overflow-y-auto p-0.5">
        <button type="button" onClick={() => upload.current?.click()} disabled={!!cutting}
          aria-pressed={value.startsWith("blob:")}
          className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait",
            value.startsWith("blob:") && "border-solid border-primary text-foreground")}>
          {cutting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          {cutting ? (downloading ? `${Math.round(cutting.progress! * 100)}%` : "Recortando") : "Enviar"}
        </button>
        {found.map(photo => (
          <button key={photo.src} type="button" onClick={() => onChange(photo.src)} aria-pressed={value === photo.src} title={photo.name}
            className={cn("relative aspect-square overflow-hidden rounded-md border-2 bg-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              value === photo.src ? "border-primary" : "border-transparent hover:border-border")}>
            <Image src={photo.src} alt={photo.name} fill sizes="5rem" className="object-contain p-1" />
          </button>
        ))}
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {found.length ? "Mais fotos:" : `Nenhuma foto com “${query}”. Busque em:`}
        {stock.sites.map(site => (
          <a key={site.label} href={site.href} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            {site.label} <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
          </a>
        ))}
      </p>
      <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choose} />
    </fieldset>
  );
}
