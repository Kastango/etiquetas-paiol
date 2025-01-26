"use client";

import { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import { ProductPDF } from "./product-pdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function PDFPreview() {
  const [products, setProducts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0); // Add a key to force remount

  useEffect(() => {
    // Load products from localStorage
    const saved = localStorage.getItem("products");
    if (saved) {
      try {
        const parsedProducts = JSON.parse(saved);
        setProducts(parsedProducts);
        setKey((prev) => prev + 1); // Force remount when products change
      } catch (e) {
        console.error("Failed to parse products from localStorage:", e);
      }
    }
    setMounted(true);
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("products");
      if (saved) {
        try {
          const parsedProducts = JSON.parse(saved);
          setProducts(parsedProducts);
          setKey((prev) => prev + 1); // Force remount when products change
        } catch (e) {
          console.error("Failed to parse products from localStorage:", e);
        }
      } else {
        setProducts([]); // Handle case when products are deleted
        setKey((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleDownload = async () => {
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<ProductPDF products={products} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "produtos.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-bold pb-6 pt-2">Prévia do PDF</h2>
        <Button disabled={products.length === 0} onClick={handleDownload}>
          <FileDown className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>
      <div className="h-[calc(100vh-8em)]">
        {products.length > 0 ? (
          <PDFViewer
            key={key}
            width="100%"
            height="100%"
            className="border-none"
            showToolbar={false}
          >
            <ProductPDF products={products} />
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum produto adicionado
          </div>
        )}
      </div>
    </div>
  );
}
