"use client";

import { useRef } from "react";
import { FileDown, FileSpreadsheet, FileUp, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import type { LabelType } from "@/lib/label-types";
import { CSV_TEMPLATE, exportProducts, importProducts, type Product } from "@/lib/products";

const csv = (text: string) => new Blob([text], { type: "text/csv;charset=utf-8" });

/** The list's file actions; on phones a 2 × 2 grid of buttons. */
export function CSVActions({ products, types, onImport, onClear }: {
  products: Product[]; types: LabelType[]; onImport: (products: Product[]) => void; onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const read = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = importProducts(await file.text(), types);
      if (!imported.length) throw new Error("O arquivo não tem produtos.");
      if (products.length && !window.confirm(`Substituir os ${products.length} produtos da lista pelos ${imported.length} do arquivo?`)) return;
      onImport(imported);
      toast.success(`${imported.length} produtos importados.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <input ref={input} type="file" accept=".csv,text/csv" onChange={read} className="hidden" />
      <Button variant="outline" onClick={() => input.current?.click()}>
        <FileUp /> Importar CSV
      </Button>
      <Button variant="outline" disabled={!products.length} onClick={() => downloadBlob(csv(exportProducts(products)), "produtos.csv")}>
        <FileDown /> Exportar CSV
      </Button>
      <Button variant="ghost" onClick={() => downloadBlob(csv(CSV_TEMPLATE), "modelo-produtos.csv")}>
        <FileSpreadsheet /> Baixar modelo
      </Button>
      {products.length > 0 && (
        <Button variant="ghost" className="text-muted-foreground sm:ml-auto"
          onClick={() => window.confirm("Apagar todos os produtos da lista?") && onClear()}>
          <Trash /> Limpar lista
        </Button>
      )}
    </div>
  );
}
