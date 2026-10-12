"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import { loadLabelTypes, newTypeId, saveLabelTypes, type LabelType } from "@/lib/label-types";
import { STORAGE_KEY, loadProducts, type Product } from "@/lib/products";
import { CSVActions } from "./csv-actions";
import { LabelTypes } from "./label-types";
import { ProductTable } from "./product-table";

const LabelPreview = dynamic(() => import("./label-preview"), { ssr: false });

export function LabelsTool() {
  return <ClientOnly><Labels /></ClientOnly>;
}

function Labels() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [types, setTypes] = useState<LabelType[]>(loadLabelTypes);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(products)), [products]);
  useEffect(() => saveLabelTypes(types), [types]);

  const addType = (fields: Omit<LabelType, "id">) => {
    setTypes(list => [...list, { ...fields, id: newTypeId(fields.name, list) }]);
    toast.success(`Tipo “${fields.name}” criado. Escolha-o na coluna Etiqueta.`);
  };
  const updateType = (type: LabelType) => setTypes(list => list.map(t => (t.id === type.id ? type : t)));
  /** Products of a deleted type go back to Padrão. */
  const deleteType = (type: LabelType) => {
    const used = products.filter(p => p.cellType === type.id).length;
    const question = used === 1 ? `1 produto usa “${type.name}” e volta para Padrão.` : `${used} produtos usam “${type.name}” e voltam para Padrão.`;
    if (used && !window.confirm(`${question} Apagar o tipo?`)) return;
    setTypes(list => list.filter(t => t.id !== type.id));
    setProducts(list => list.map(p => (p.cellType === type.id ? { ...p, cellType: "default" } : p)));
  };

  return (
    <div className="grid gap-6 md:gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
      <section aria-label="Lista de produtos" className="min-w-0 space-y-4">
        <CSVActions products={products} types={types} onImport={setProducts} onClear={() => setProducts([])}>
          <LabelTypes types={types} onAdd={addType} onUpdate={updateType} onDelete={deleteType} />
        </CSVActions>
        <ProductTable products={products} types={types} onChange={setProducts} />
        <p className="hidden text-sm text-muted-foreground md:block">Use | no nome do produto para escolher onde a linha quebra.</p>
      </section>
      <div className="min-w-0 xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)]">
        <LabelPreview products={products} types={types} />
      </div>
    </div>
  );
}
