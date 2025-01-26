"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";

// Register Poppins for react-pdf
Font.register({
  family: "Poppins",
  fonts: [
    {
      src: "fonts/Poppins-400.ttf",
    },
    {
      src: "fonts/Poppins-250.ttf",
      fontWeight: 250,
    },
    {
      src: "fonts/Poppins-275.ttf",
      fontWeight: 275,
    },
    {
      src: "fonts/Poppins-300.ttf",
      fontWeight: 300,
    },
    {
      src: "fonts/Poppins-400.ttf",
      fontWeight: 400,
    },
    {
      src: "fonts/Poppins-500.ttf",
      fontWeight: 500,
    },
    {
      src: "fonts/Poppins-600.ttf",
      fontWeight: 600,
    },
    {
      src: "fonts/Poppins-700.ttf",
      fontWeight: 700,
    },
    {
      src: "fonts/Poppins-800.ttf",
      fontWeight: 800,
    },
    {
      src: "fonts/Poppins-900.ttf",
      fontWeight: 900,
    },
  ],
});

const tw = createTw({
  theme: {
    fontFamily: {
      poppins: ["Poppins"],
    },
    extend: {
      colors: {
        primary: "#357267",
      },
    },
  },
});

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  cellType: "title" | "default" | "larger";
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: "5mm",
    gap: "0.2mm",
  },
  row: {
    flexDirection: "row",
    gap: "0.2mm",
    justifyContent: "flex-start",
  },
  normalRow: {
    flexDirection: "row",
    gap: "0.2mm",
    justifyContent: "flex-start",
  },
  column: {
    width: "65mm",
    gap: "0.2mm",
  },
  largerColumn: {
    width: "90mm",
    gap: "0.2mm",
  },
  cell: {
    width: "65mm",
    height: "30mm",
    padding: "2mm",
    paddingBottom: "4mm",
    backgroundColor: "#357267",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins",
  },
  largerCell: {
    width: "95mm",
    height: "30mm",
    padding: "2mm",
    paddingBottom: "4mm",
    backgroundColor: "#357267",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Poppins",
  },
  titleCell: {
    width: "65mm",
    height: "30mm",
    padding: "2mm",
    paddingBottom: "4mm",
    backgroundColor: "#357267",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins",
  },
  productNameMedium: {
    ...tw("text-white text-lg font-bold text-center leading-5"),
  },
  productNameSmall: {
    ...tw("text-white text-base font-bold text-center leading-5"),
  },
  productNameLarge: {
    ...tw("text-white text-xl font-bold text-center leading-5"),
  },
  productNameLargerLeft: {
    ...tw("text-white text-lg font-bold leading-5"),
    maxWidth: "60%",
  },
  priceContainer: {
    ...tw(
      "flex flex-row items-baseline leading-none content-center justify-center"
    ),
  },
  currency: {
    ...tw("text-white text-base mr-1 font-medium leading-none"),
  },
  price: {
    ...tw("text-white text-2xl font-extrabold leading-none"),
  },
  unit: {
    ...tw("text-white text-base ml-1 font-medium leading-none"),
  },
});

interface ProductPDFProps {
  products: Product[];
}

export function ProductPDF({ products }: ProductPDFProps) {
  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProductNameStyle = (name: string, cellType: Product["cellType"]) => {
    if (cellType === "title") return styles.productNameLarge;
    if (cellType === "larger") return styles.productNameLargerLeft;
    if (name.length < 24) return styles.productNameMedium;
    return styles.productNameSmall;
  };

  const formatProductName = (name: string, cellType: Product["cellType"]) => {
    // Split by pipe and remove any whitespace before and after the pipe
    const parts = name.split(/\s*\|\s*/);
    return parts.map((part, index) => (
      <Text key={index} style={getProductNameStyle(part, cellType)}>
        {part}
      </Text>
    ));
  };

  const renderDefaultCell = (product: Product) => (
    <View key={product.id} style={styles.cell}>
      {formatProductName(product.name, product.cellType)}
      <View style={styles.priceContainer}>
        <Text style={styles.currency}>R$</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
      </View>
    </View>
  );

  const renderTitleCell = (product: Product) => (
    <View key={product.id} style={styles.titleCell}>
      {formatProductName(product.name, product.cellType)}
    </View>
  );

  const renderLargerCell = (product: Product) => (
    <View key={product.id} style={styles.largerCell}>
      <View style={{ flexDirection: "column" }}>
        {formatProductName(product.name, product.cellType)}
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.currency}>R$</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
      </View>
    </View>
  );

  const renderCell = (product: Product) => {
    switch (product.cellType) {
      case "title":
        return renderTitleCell(product);
      case "larger":
        return renderLargerCell(product);
      default:
        return renderDefaultCell(product);
    }
  };

  // Separate larger cells and normal cells
  const largerCells = products.filter((p) => p.cellType === "larger");
  const normalCells = products.filter((p) => p.cellType !== "larger");

  // Group larger cells into pairs
  const largerRows = [];
  for (let i = 0; i < largerCells.length; i += 2) {
    largerRows.push(largerCells.slice(i, i + 2));
  }

  // Distribute normal cells into three columns
  const normalColumns: Product[][] = [[], [], []];
  normalCells.forEach((product, index) => {
    normalColumns[index % 3].push(product);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Render larger cells two per row */}
        {largerRows.map((row, rowIndex) => (
          <View key={`larger-${rowIndex}`} style={styles.row}>
            {row.map((product) => renderCell(product))}
          </View>
        ))}

        {/* Render normal cells in three columns */}
        <View style={styles.normalRow}>
          {normalColumns.map((column, columnIndex) => (
            <View key={`normal-${columnIndex}`} style={styles.column}>
              {column.map((product) => renderCell(product))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
