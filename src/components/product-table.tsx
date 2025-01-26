"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { CSVActions } from "./csv-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debounce } from "lodash";
export type CellType = "title" | "default" | "larger";

export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  cellType: CellType;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseCurrency = (value: string): number => {
  return Number(value.replace(/[^0-9-]/g, "")) / 100;
};

const formatInputCurrency = (value: string): string => {
  const numbers = value.replace(/[^0-9]/g, "");
  const amount = Number(numbers) / 100;
  return formatCurrency(amount);
};

export function ProductTable() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [newProduct, setNewProduct] = React.useState<{
    name: string;
    price: string;
    unit: string;
    cellType: CellType;
  }>({
    name: "",
    price: "0,00",
    unit: "100g",
    cellType: "title",
  });

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Add debounced function for storage updates
  const debouncedStorageUpdate = React.useCallback(
    debounce((products: Product[]) => {
      try {
        localStorage.setItem("products", JSON.stringify(products));
        // Dispatch storage event for the preview component
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Failed to save products to localStorage:", e);
      }
    }, 1000),
    []
  );

  // Load products from localStorage only once on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("products");
    if (saved) {
      try {
        const parsedProducts = JSON.parse(saved);
        // Ensure all products have a cellType
        const productsWithCellType: Product[] = parsedProducts.map(
          (p: {
            id: number;
            name: string;
            price: number;
            unit: string;
            cellType?: CellType;
          }) => ({
            ...p,
            cellType: p.cellType || "default",
          })
        );
        setProducts(productsWithCellType);
      } catch (e) {
        console.error("Failed to parse products from localStorage:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever products change
  React.useEffect(() => {
    if (isLoaded) {
      debouncedStorageUpdate(products);
    }
  }, [products, isLoaded, debouncedStorageUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const price = parseCurrency(newProduct.price);
    if (isNaN(price)) return;

    setProducts((prev) => [
      ...prev,
      {
        id: (prev.length > 0 ? Math.max(...prev.map((p) => p.id)) : 0) + 1,
        name: newProduct.name,
        price,
        unit: newProduct.unit,
        cellType: newProduct.cellType,
      },
    ]);

    setNewProduct({
      name: "",
      price: "",
      unit: "100g",
      cellType: "default",
    });
    nameInputRef.current?.focus();
  };

  const updateProduct = (id: number, updates: Partial<Product>) => {
    setProducts(
      (prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)) as Product[]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;
      const index = Array.prototype.indexOf.call(form, e.currentTarget);
      const next = form?.elements[index + 1] as HTMLElement;
      if (next) {
        next.focus();
      } else {
        form?.requestSubmit();
      }
    }
  };

  const removeProduct = (id: number) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <CSVActions
          products={products}
          onImport={(newProducts) => setProducts(newProducts)}
        />
      </div>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Preço</TableHead>
              <TableHead className="w-24">Unidade</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono p-2">{product.id}</TableCell>
                <TableCell className="p-1">
                  <Input
                    value={product.name}
                    onChange={(e) =>
                      updateProduct(product.id, { name: e.target.value })
                    }
                    className="w-full"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    value={formatCurrency(product.price)}
                    onChange={(e) => {
                      const price = parseCurrency(e.target.value);
                      if (!isNaN(price)) {
                        updateProduct(product.id, { price });
                      }
                    }}
                    className="w-full text-right"
                    disabled={product.cellType === "title"}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Select
                    value={product.unit}
                    onValueChange={(value) =>
                      updateProduct(product.id, { unit: value })
                    }
                    disabled={product.cellType === "title"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100g">100g</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                  <Select
                    value={product.cellType}
                    onValueChange={(value: "title" | "default" | "larger") =>
                      updateProduct(product.id, { cellType: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Título</SelectItem>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="larger">Largo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <form onSubmit={handleSubmit} className="flex gap-3 p-2">
                  <Input
                    ref={nameInputRef}
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Nome do produto"
                    className="w-full"
                  />
                  <Input
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        price: formatInputCurrency(e.target.value),
                      }))
                    }
                    disabled={newProduct.cellType === "title"}
                    onKeyDown={handleKeyDown}
                    placeholder="R$ 0,00"
                    className="w-72 text-right"
                  />
                  <Select
                    value={newProduct.cellType}
                    onValueChange={(value: "title" | "default" | "larger") =>
                      setNewProduct((prev) => ({ ...prev, cellType: value }))
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Título</SelectItem>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="larger">Largo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSubmit}
                    type="submit"
                    size="icon"
                    className="h-10 w-12"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
