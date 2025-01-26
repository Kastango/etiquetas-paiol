import { PDFPreview } from "@/components/pdf-preview";
import { ProductTable } from "@/components/product-table";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col md:flex-row items-start p-8 gap-8">
      <div className="w-full md:w-3/5">
        <ProductTable />
      </div>
      <div className="w-full md:flex-1 md:sticky md:top-8">
        <PDFPreview />
      </div>
    </main>
  );
}
