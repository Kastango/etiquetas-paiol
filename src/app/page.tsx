import { ProductTable } from "@/components/product-table";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-4xl">
        <ProductTable />
      </div>
    </main>
  );
}
