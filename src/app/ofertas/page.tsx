import type { Metadata } from "next";
import { OfferTool } from "@/components/offers/offer-tool";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Ofertas" };

export default function OffersPage() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <PageHeader title="Ofertas">
        Preencha o produto, escolha a foto e baixe o post em PNG. Revise preço, unidade e validade antes de publicar.
      </PageHeader>
      <OfferTool />
    </div>
  );
}
