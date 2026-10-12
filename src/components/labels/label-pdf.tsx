import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LINE_HEIGHT, PRICE, layoutName, showsPrice } from "@/lib/label-layout";
import { CELL_WIDTH, decimal, labelPages, type Product } from "@/lib/products";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-500.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-700.ttf", fontWeight: 700 },
    { src: "/fonts/Poppins-800.ttf", fontWeight: 800 },
  ],
});
// layoutName breaks the lines; react-pdf must not break them again.
Font.registerHyphenationCallback(word => [word]);

const GREEN = "#347265";
const styles = StyleSheet.create({
  page: { padding: "5mm", gap: "0.2mm", backgroundColor: "#ffffff", fontFamily: "Poppins" },
  row: { flexDirection: "row", gap: "0.2mm" },
  cell: { height: "30mm", padding: "4mm", backgroundColor: GREEN, color: "#ffffff", justifyContent: "center", alignItems: "center" },
  larger: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontWeight: 700, lineHeight: LINE_HEIGHT },
  // react-pdf has no baseline alignment: bottom-align boxes of line height 1 instead.
  price: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginTop: `${PRICE.gapAbove}mm` },
  priceBeside: { marginTop: 0, marginLeft: `${PRICE.gapBeside}mm`, flexShrink: 0 },
  small: { fontSize: PRICE.small, fontWeight: 500, lineHeight: 1 },
  value: { fontSize: PRICE.value, fontWeight: 800, lineHeight: 1, marginHorizontal: PRICE.valueMargin },
});

function Name({ product }: { product: Product }) {
  const { size, lines, beside } = layoutName(product);
  return (
    <View style={beside ? { flex: 1, alignItems: "flex-start" } : { alignItems: "center" }}>
      {lines.map((line, index) => (
        <Text key={index} style={[styles.name, { fontSize: size, textAlign: beside ? "left" : "center" }]}>{line}</Text>
      ))}
    </View>
  );
}

function Label({ product }: { product: Product }) {
  const showPrice = showsPrice(product);
  return (
    <View style={[styles.cell, { width: `${CELL_WIDTH[product.cellType]}mm` }, product.cellType === "larger" && showPrice ? styles.larger : {}]}>
      <Name product={product} />
      {showPrice && (
        <View style={product.cellType === "larger" ? [styles.price, styles.priceBeside] : styles.price}>
          <Text style={styles.small}>R$</Text>
          <Text style={styles.value}>{decimal(product.price)}</Text>
          <Text style={styles.small}>{product.unit}</Text>
        </View>
      )}
    </View>
  );
}

export function LabelPDF({ products }: { products: Product[] }) {
  return (
    <Document title="Etiquetas Paiol" author="Paiol Produtos Naturais">
      {labelPages(products).map((rows, page) => (
        <Page key={page} size="A4" style={styles.page}>
          {rows.map((row, index) => (
            <View key={index} style={styles.row}>
              {row.map(product => <Label key={product.id} product={product} />)}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
