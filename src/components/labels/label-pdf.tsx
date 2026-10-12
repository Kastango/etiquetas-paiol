import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LINE_HEIGHT, layoutLabel } from "@/lib/label-layout";
import { SHEET, typeOf, type LabelType } from "@/lib/label-types";
import { decimal, labelPages, type Product } from "@/lib/products";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-500.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-700.ttf", fontWeight: 700 },
    { src: "/fonts/Poppins-800.ttf", fontWeight: 800 },
  ],
});
// layoutLabel breaks the lines; react-pdf must not break them again.
Font.registerHyphenationCallback(word => [word]);

const GREEN = "#347265";
const styles = StyleSheet.create({
  page: { padding: "5mm", gap: `${SHEET.gap}mm`, backgroundColor: "#ffffff", fontFamily: "Poppins" },
  row: { flexDirection: "row", gap: `${SHEET.gap}mm` },
  cell: { backgroundColor: GREEN, color: "#ffffff", justifyContent: "center", alignItems: "center" },
  beside: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontWeight: 700, lineHeight: LINE_HEIGHT },
  // react-pdf has no baseline alignment: bottom-align boxes of line height 1 instead.
  price: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
});

function Label({ product, type }: { product: Product; type: LabelType }) {
  const { width, height, padding, name, price, beside } = layoutLabel(product, type);
  return (
    <View style={[styles.cell, { width: `${width}mm`, height: `${height}mm`, padding: `${padding}mm` }, beside ? styles.beside : {}]}>
      <View style={beside ? { flex: 1, alignItems: "flex-start" } : { alignItems: "center" }}>
        {name.lines.map((line, index) => (
          <Text key={index} style={[styles.name, { fontSize: name.size, textAlign: beside ? "left" : "center" }]}>{line}</Text>
        ))}
      </View>
      {price && (
        <View style={[styles.price, beside ? { marginLeft: `${price.gapBeside}mm`, flexShrink: 0 } : { marginTop: `${price.gapAbove}mm` }]}>
          <Text style={{ fontSize: price.small, fontWeight: 500, lineHeight: 1 }}>R$</Text>
          <Text style={{ fontSize: price.value, fontWeight: 800, lineHeight: 1, marginHorizontal: price.valueMargin }}>{decimal(product.price)}</Text>
          <Text style={{ fontSize: price.small, fontWeight: 500, lineHeight: 1 }}>{product.unit}</Text>
        </View>
      )}
    </View>
  );
}

export function LabelPDF({ products, types }: { products: Product[]; types: LabelType[] }) {
  return (
    <Document title="Etiquetas Paiol" author="Paiol Produtos Naturais">
      {labelPages(products, types).map((rows, page) => (
        <Page key={page} size="A4" style={styles.page}>
          {rows.map((row, index) => (
            <View key={index} style={styles.row}>
              {row.map(product => <Label key={product.id} product={product} type={typeOf(product, types)} />)}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
