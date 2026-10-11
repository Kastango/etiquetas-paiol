"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ClientOnly } from "@/components/client-only";
import { STORAGE_KEY, loadProducts, type Product } from "@/lib/products";
import { CSVActions } from "./csv-actions";
import { ProductTable } from "./product-table";

const LabelPreview = dynamic(() => import("./label-preview"), { ssr: false });

export function LabelsTool() {
  return <ClientOnly><Labels /></ClientOnly>;
}

function Labels() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(products)), [products]);

  return (
    <div className="grid gap-6 md:gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
      <section aria-label="Lista de produtos" className="min-w-0 space-y-4">
        <CSVActions products={products} onImport={setProducts} onClear={() => setProducts([])} />
        <ProductTable products={products} onChange={setProducts} />
        <p className="hidden text-sm text-muted-foreground md:block">
          Padrão e Título medem 65 × 30 mm; Largo mede 95 × 30 mm. As largas ficam no topo da folha, duas por linha; as outras seguem a ordem da lista, três por linha. Use | no nome para escolher onde a linha quebra.
        </p>
      </section>
      <div className="min-w-0 xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)]">
        <LabelPreview products={products} />
      </div>
    </div>
  );
}
