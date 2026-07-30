import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export interface BillPdfItem {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BillPdfData {
  businessName: string;
  businessAddressLines: string[];
  businessPhone: string | null;
  businessEmail: string | null;
  logoUrl: string | null;
  billNumber: string;
  orderDate: Date;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  paymentStatus: string;
  items: BillPdfItem[];
  totalAmount: number;
  notes: string | null;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  businessBlock: { flexDirection: "row" },
  logo: { width: 48, height: 48, marginRight: 12 },
  businessName: { fontSize: 16, fontWeight: 700, marginBottom: 3 },
  muted: { color: "#666666", marginBottom: 1 },
  billBlock: { alignItems: "flex-end" },
  billTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 8, textTransform: "uppercase", color: "#888888", marginBottom: 4 },
  table: { borderTopWidth: 1, borderTopColor: "#dddddd", marginTop: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 6,
  },
  colProduct: { width: "46%", paddingHorizontal: 4 },
  colQty: { width: "14%", paddingHorizontal: 4, textAlign: "right" },
  colPrice: { width: "20%", paddingHorizontal: 4, textAlign: "right" },
  colTotal: { width: "20%", paddingHorizontal: 4, textAlign: "right" },
  tableHeaderText: { fontSize: 9, fontWeight: 700 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, alignItems: "center" },
  totalLabel: { fontSize: 11, fontWeight: 700, marginRight: 12 },
  totalValue: { fontSize: 11, fontWeight: 700 },
  footer: { marginTop: 24, alignItems: "center" },
  footerThanks: { fontSize: 9, color: "#666666", textAlign: "center", marginBottom: 2 },
  footerReview: { fontSize: 8, color: "#999999", textAlign: "center" },
});

function formatCurrency(value: number): string {
  return `Rs. ${value.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function BillDocument({ data }: { data: BillPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.businessBlock}>
            {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.businessName}>{data.businessName}</Text>
              {data.businessAddressLines.map((line, i) => (
                <Text key={i} style={styles.muted}>
                  {line}
                </Text>
              ))}
              {data.businessPhone && <Text style={styles.muted}>Phone: {data.businessPhone}</Text>}
              {data.businessEmail && <Text style={styles.muted}>Email: {data.businessEmail}</Text>}
            </View>
          </View>
          <View style={styles.billBlock}>
            <Text style={styles.billTitle}>BILL</Text>
            <Text style={styles.muted}>No: {data.billNumber}</Text>
            <Text style={styles.muted}>Date: {formatDate(data.orderDate)}</Text>
            <Text style={styles.muted}>Status: {data.status}</Text>
            <Text style={styles.muted}>Payment: {data.paymentStatus}</Text>
          </View>
        </View>

        {data.customerName && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text>{data.customerName}</Text>
            {data.customerPhone && <Text style={styles.muted}>{data.customerPhone}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colProduct, styles.tableHeaderText]}>Item</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Price</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colProduct}>
                {item.productName}
                {item.variantName && item.variantName !== "Default" ? ` — ${item.variantName}` : ""}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.totalAmount)}</Text>
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerThanks}>Thank you for your purchase!</Text>
          <Text style={styles.footerReview}>
            We&apos;d love to hear your thoughts — please consider sharing a review.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateBillPdf(data: BillPdfData): Promise<Buffer> {
  return renderToBuffer(<BillDocument data={data} />);
}
