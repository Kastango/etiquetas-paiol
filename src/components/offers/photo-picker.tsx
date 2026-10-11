"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, ImagePlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { photos } from "@/lib/brand";
import { removeBackground, trim } from "@/lib/cutout";
import { downloadBlob } from "@/lib/download";
import { cn, plain, slug } from "@/lib/utils";

/**
 * Stock sites with photos like the library's: one bowl, seen from above, on a plain background.
 * Stock photos are tagged in English, so every search carries "top view".
 */
function searches(term: string) {
  const q = (suffix: string) => encodeURIComponent(`${term} ${suffix}`.trim());
  return [
    { label: "Pexels", href: `https://www.pexels.com/pt-br/procurar/${q("tigela top view")}/` },
    { label: "Unsplash", href: `https://unsplash.com/pt-br/s/fotografias/${q("tigela top view")}` },
    { label: "Freepik", href: `https://br.freepik.com/search?format=search&query=${q("tigela top view")}` },
    { label: "Google Imagens", href: `https://www.google.com/search?tbm=isch&q=${q("tigela top view fundo branco")}` },
  ];
}

type Cutout = { status: "idle" } | { status: "working"; progress: number | null };

export function PhotoPicker({ productName, value, onChange }: { productName: string; value: string; onChange: (src: string) => void }) {
  const [query, setQuery] = useState("");
  const [cutout, setCutout] = useState<Cutout>({ status: "idle" });
  const [removeBg, setRemoveBg] = useState(true);
  const [uploaded, setUploaded] = useState<Blob | null>(null);
  const upload = useRef<HTMLInputElement>(null);

  const words = plain(query).split(/\s+/).filter(Boolean);
  const found = photos.filter(photo => words.every(word => plain(photo.name).includes(word)));
  const term = (query || productName).replace(/\s*\|\s*/g, " ").trim();

  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um arquivo de imagem (PNG, JPG ou WebP).");
    setCutout({ status: "working", progress: null });
    try {
      const image = removeBg ? await removeBackground(file, progress => setCutout({ status: "working", progress })) : await trim(file);
      if (value.startsWith("blob:")) URL.revokeObjectURL(value);
      setUploaded(image);
      onChange(URL.createObjectURL(image));
    } catch {
      toast.error("Não foi possível recortar esta foto. Tente outra, ou envie sem recortar o fundo.");
    } finally {
      setCutout({ status: "idle" });
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="pb-2 font-semibold">Foto</legend>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar foto na biblioteca" placeholder={`Buscar entre ${photos.length} fotos`} className="pl-9"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="grid max-h-60 grid-cols-5 gap-2 overflow-y-auto p-0.5">
        <button type="button" onClick={() => upload.current?.click()} disabled={cutout.status === "working"}
          aria-pressed={value.startsWith("blob:")}
          className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait",
            value.startsWith("blob:") && "border-solid border-primary text-foreground")}>
          {cutout.status === "working" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          {cutout.status === "working" ? "Recortando" : "Enviar"}
        </button>
        {found.map(photo => (
          <button key={photo.src} type="button" onClick={() => onChange(photo.src)} aria-pressed={value === photo.src} title={photo.name}
            className={cn("relative aspect-square overflow-hidden rounded-md border-2 bg-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              value === photo.src ? "border-primary" : "border-transparent hover:border-border")}>
            <Image src={photo.src} alt={photo.name} fill sizes="5rem" className="object-contain p-1" />
          </button>
        ))}
      </div>
      {!found.length && <p className="text-sm text-muted-foreground">Nenhuma foto com “{query}” na biblioteca. Busque abaixo ou envie uma foto.</p>}

      <div className="space-y-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} />
          Recortar o fundo da foto enviada
        </label>
        <p>
          O recorte é feito neste computador; a foto não sai do navegador.
          {cutout.status === "working" && cutout.progress !== null && cutout.progress < 1
            ? ` Baixando o recortador: ${Math.round(cutout.progress * 100)}% (só na primeira vez, cerca de 45 a 90 MB).`
            : " Na primeira vez, o recortador é baixado (cerca de 45 a 90 MB) e fica guardado."}
        </p>
        {uploaded && value.startsWith("blob:") && (
          <Button type="button" variant="outline" size="sm" onClick={() => downloadBlob(uploaded, `${slug(productName) || "foto"}-recorte.png`)}>
            <Download /> Baixar recorte em PNG
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Buscar fotos parecidas{term ? ` com “${term}”` : ""}</p>
        <ul className="flex flex-wrap gap-2">
          {searches(term).map(site => (
            <li key={site.label}>
              <a href={site.href} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border bg-card px-2.5 py-1 text-sm hover:border-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                {site.label} <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Procure a tigela inteira, vista de cima, com fundo liso e pelo menos 1000 px. Pexels e Unsplash podem ser usadas em
          posts da loja; no Freepik e no Google, confira a licença de cada foto.
        </p>
      </div>
      <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choose} />
    </fieldset>
  );
}
