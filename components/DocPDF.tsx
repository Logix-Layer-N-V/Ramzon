// components/DocPDF.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const getAccentColor = () => localStorage.getItem('erp_doc_accent_color') || '#1e40af';

const customTitles: Record<string, string> = (() => {
  try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') || '{}'); } catch { return {}; }
})();
const defaults: Record<string, string> = { invoice: 'Factuur', quote: 'Offerte' };

export interface DocPDFProps {
  docType: 'invoice' | 'quote';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  rep?: string;
  paidAmount?: number;
  currency: string;
  currencySymbol: string;
  items: Array<{ description: string; qty: number; unit: string; price: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

export const DocPDF: React.FC<DocPDFProps> = ({
  docType, docNumber, date, validUntil, clientName, clientCompany, clientAddress,
  rep, paidAmount, currency, currencySymbol, items, subtotal, tax, total,
}) => {
  const accentColor = getAccentColor();

  const styles = StyleSheet.create({
    page:     { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1e293b' },
    header:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    title:    { fontSize: 22, fontWeight: 'bold', color: accentColor },
    label:    { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
    value:    { fontSize: 9, color: '#1e293b' },
    tableHdr: { flexDirection: 'row', backgroundColor: accentColor, padding: '6 4', borderRadius: 3, marginTop: 16 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', padding: '5 4' },
    totals:   { alignItems: 'flex-end', marginTop: 12 },
    totalRow: { flexDirection: 'row', gap: 40, marginBottom: 3 },
    bold:     { fontWeight: 'bold' },
  });

  const docTitle = customTitles[docType] ?? defaults[docType];
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{docTitle}</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>{docNumber}</Text>
            <Text style={styles.label}>{date}</Text>
            {validUntil && <Text style={styles.label}>Geldig t/m {validUntil}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Aan</Text>
            <Text style={[styles.value, styles.bold]}>{clientName}</Text>
            {clientCompany && <Text style={styles.value}>{clientCompany}</Text>}
            {clientAddress && <Text style={styles.label}>{clientAddress}</Text>}
          </View>
        </View>

        {/* Rep */}
        {rep && (
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View>
              <Text style={styles.label}>Rep</Text>
              <Text style={styles.value}>{rep}</Text>
            </View>
          </View>
        )}

        {/* Table header */}
        <View style={styles.tableHdr}>
          <Text style={{ flex: 3, color: 'white', fontSize: 7, fontWeight: 'bold' }}>OMSCHRIJVING</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>QTY</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>PRIJS</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>TOTAAL</Text>
        </View>

        {/* Table rows */}
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={{ flex: 3, color: '#1e293b' }}>{item.description}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{item.qty} {item.unit}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{fmt(item.price)}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotaal</Text>
            <Text style={styles.value}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>BTW 21%</Text>
            <Text style={styles.value}>{fmt(tax)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: accentColor, paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.value, styles.bold]}>TOTAAL ({currency})</Text>
            <Text style={[styles.value, styles.bold]}>{fmt(total)}</Text>
          </View>
          {paidAmount != null && paidAmount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.label}>Betaald</Text>
                <Text style={[styles.value, { color: '#10b981' }]}>-{fmt(paidAmount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.value, styles.bold]}>Saldo</Text>
                <Text style={[styles.value, styles.bold]}>{fmt(Math.max(0, total - paidAmount))}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 12 }}>
          <Text style={styles.label}>{localStorage.getItem('erp_bank_details') || ''}</Text>
          <Text style={[styles.label, { marginTop: 6 }]}>{localStorage.getItem('erp_legal_disclaimer') || ''}</Text>
        </View>
      </Page>
    </Document>
  );
};
