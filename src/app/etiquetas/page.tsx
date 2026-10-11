import type { Metadata } from "next";
import { LabelsTool } from "@/components/labels/labels-tool";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Etiquetas" };

export default function LabelsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <PageHeader title="Etiquetas">
        Monte a lista de produtos e baixe o PDF para imprimir. A lista fica salva neste navegador.
      </PageHeader>
      <LabelsTool />
    </div>
  );
}
