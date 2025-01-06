"use client";

import { Button } from "@/components/ui/button";
import { FileUp, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import { Product } from "./product-table";

interface CSVActionsProps {
  products: Product[];
  onImport: (products: Product[]) => void;
}

export function CSVActions({ products, onImport }: CSVActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["name", "price", "unit"];
    const csvContent = [
      headers.join(","),
      ...products.map((product) =>
        [`"${product.name}"`, product.price, product.unit].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "produtos.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      const newProducts: Product[] = lines
        .slice(1) // Skip headers
        .filter((line) => line.trim()) // Skip empty lines
        .map((line, index) => {
          const values = line.split(",");
          return {
            id: index + 1,
            name: values[0].replace(/^"|"$/g, ""), // Remove quotes
            price: parseFloat(values[1]),
            unit: values[2]?.trim() || "100g",
          };
        });

      onImport(newProducts);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <Input
        type="file"
        accept=".csv"
        onChange={importFromCSV}
        className="hidden"
        ref={fileInputRef}
      />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <FileUp className="h-4 w-4 mr-2" />
        Importar CSV
      </Button>
      <Button
        onClick={exportToCSV}
        variant="outline"
        disabled={products.length === 0}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
    </div>
  );
}
