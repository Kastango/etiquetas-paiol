"use client";

import { useEffect, useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { ExternalLink, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { PHONE, useMediaQuery } from "@/lib/media";
import { labelPages, type Product } from "@/lib/products";
import { LabelPDF } from "./label-pdf";

export default function LabelPreview({ products }: { products: Product[] }) {
  // Rebuilding the PDF on every keystroke makes typing lag; wait for a pause.
  const [shown, setShown] = useState(products);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(products), 600);
    return () => clearTimeout(timer);
  }, [products]);

  const phone = useMediaQuery(PHONE);
  const build = () => pdf(<LabelPDF products={products} />).toBlob();
  const download = async () => {
    setBusy(true);
    try {
      downloadBlob(await build(), "etiquetas-paiol.pdf");
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };
  /** Phones show PDFs in their own viewer. The tab opens right away, before the PDF exists, so it is not blocked as a pop-up. */
  const open = async () => {
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const url = URL.createObjectURL(await build());
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      toast.error("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const pages = labelPages(products).length;
  const sheets = pages ? `${pages} ${pages === 1 ? "folha" : "folhas"} A4, sem margem de ajuste` : "A4, sem margem de ajuste";
  if (phone) {
    return (
      <section aria-labelledby="preview-title" className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <h2 id="preview-title" className="font-semibold">PDF para impressão</h2>
          <p className="text-sm text-muted-foreground">{products.length ? `${products.length} etiquetas · ${sheets}` : "Adicione produtos para gerar o PDF."}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11" disabled={!products.length || busy} onClick={open}>
            {busy ? <Loader2 className="animate-spin" /> : <ExternalLink />} Abrir PDF
          </Button>
          <Button className="h-11" disabled={!products.length || busy} onClick={download}><FileDown /> Baixar PDF</Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="preview-title" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <h2 id="preview-title" className="font-semibold">Prévia para impressão</h2>
          <p className="text-sm text-muted-foreground">{sheets}</p>
        </div>
        <Button disabled={!products.length || busy} onClick={download}>
          {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
          Baixar PDF
        </Button>
      </div>
      <div className="min-h-[32rem] flex-1 overflow-hidden rounded-lg border bg-muted">
        {shown.length ? (
          <PDFViewer width="100%" height="100%" className="border-none" showToolbar={false}>
            <LabelPDF products={shown} />
          </PDFViewer>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            As etiquetas aparecem aqui quando houver produtos na lista.
          </div>
        )}
      </div>
    </section>
  );
}
