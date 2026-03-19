// components/DocPDF.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const getAccentColor = () => localStorage.getItem('erp_doc_accent_color') || '#8B1D2A';

// Module-level stable styles (no dynamic color)
const staticStyles = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1e293b' },
  header:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  label:    { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  value:    { fontSize: 9, color: '#1e293b' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', padding: '5 4' },
  totals:   { alignItems: 'flex-end', marginTop: 12 },
  totalRow: { flexDirection: 'row', gap: 40, marginBottom: 3 },
  bold:     { fontWeight: 'bold' },
});

const defaults: Record<string, string> = { invoice: 'Factuur', quote: 'Offerte' };

export interface DocPDFProps {
  docType: 'invoice' | 'quote';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientVAT?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  rep?: string;
  paidAmount?: number;
  currency: string;
  currencySymbol: string;
  items: Array<{ description: string; qty: number; unit: string; price: number; total: number; houtsoort?: string }>;
  subtotal: number;
  tax: number;
  total: number;
}

export const DocPDF: React.FC<DocPDFProps> = ({
  docType, docNumber, date, validUntil,
  clientName, clientCompany, clientAddress, clientPhone, clientEmail, clientVAT,
  companyName, companyAddress, companyPhone, companyEmail,
  rep, paidAmount, currency, currencySymbol, items, subtotal, tax, total,
}) => {
  const accentColor = getAccentColor();
  const customTitles: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') || '{}'); } catch { return {}; }
  })();

  const docTitle = customTitles[docType] ?? defaults[docType];
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  return (
    <Document>
      <Page size="A4" style={staticStyles.page}>
        {/* Header */}
        <View style={staticStyles.header}>
          <View>
            {companyName && <Text style={[staticStyles.value, { fontWeight: 'bold', fontSize: 11, marginBottom: 4 }]}>{companyName}</Text>}
            {companyAddress && <Text style={staticStyles.label}>{companyAddress}</Text>}
            {companyPhone && <Text style={staticStyles.label}>{companyPhone}</Text>}
            {companyEmail && <Text style={staticStyles.label}>{companyEmail}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[staticStyles.value, { fontSize: 22, fontWeight: 'bold', color: accentColor }]}>{docTitle}</Text>
            <Text style={[staticStyles.value, { marginTop: 4 }]}>{docNumber}</Text>
            <Text style={staticStyles.label}>{date}</Text>
            {validUntil && <Text style={staticStyles.label}>Geldig t/m {validUntil}</Text>}
          </View>
        </View>

        {/* Client block */}
        <View style={{ marginBottom: 16 }}>
          <Text style={staticStyles.label}>Aan</Text>
          <Text style={[staticStyles.value, staticStyles.bold]}>{clientName}</Text>
          {clientCompany && <Text style={staticStyles.value}>{clientCompany}</Text>}
          {clientAddress && <Text style={staticStyles.label}>{clientAddress}</Text>}
          {clientPhone && <Text style={staticStyles.label}>{clientPhone}</Text>}
          {clientEmail && <Text style={staticStyles.label}>{clientEmail}</Text>}
          {clientVAT && <Text style={staticStyles.label}>BTW: {clientVAT}</Text>}
        </View>

        {/* Rep */}
        {rep && (
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View>
              <Text style={staticStyles.label}>Rep</Text>
              <Text style={staticStyles.value}>{rep}</Text>
            </View>
          </View>
        )}

        {/* Table header */}
        <View style={{ flexDirection: 'row', backgroundColor: accentColor, padding: '6 4', borderRadius: 3, marginTop: 16 }}>
          <Text style={{ flex: 3, color: 'white', fontSize: 7, fontWeight: 'bold' }}>OMSCHRIJVING</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>QTY</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>PRIJS</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>TOTAAL</Text>
        </View>

        {/* Table rows */}
        {items.map((item, i) => (
          <View key={i} style={staticStyles.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={{ color: '#1e293b' }}>{item.description}</Text>
              {item.houtsoort && <Text style={[staticStyles.label, { flex: 3 }]}>{item.houtsoort}</Text>}
            </View>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{item.qty} {item.unit}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{fmt(item.price)}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b' }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={staticStyles.totals}>
          <View style={staticStyles.totalRow}>
            <Text style={staticStyles.label}>Subtotaal</Text>
            <Text style={staticStyles.value}>{fmt(subtotal)}</Text>
          </View>
          <View style={staticStyles.totalRow}>
            <Text style={staticStyles.label}>BTW 21%</Text>
            <Text style={staticStyles.value}>{fmt(tax)}</Text>
          </View>
          <View style={[staticStyles.totalRow, { borderTopWidth: 1, borderTopColor: accentColor, paddingTop: 4, marginTop: 4 }]}>
            <Text style={[staticStyles.value, staticStyles.bold]}>TOTAAL ({currency})</Text>
            <Text style={[staticStyles.value, staticStyles.bold]}>{fmt(total)}</Text>
          </View>
          {paidAmount != null && paidAmount > 0 && (
            <>
              <View style={staticStyles.totalRow}>
                <Text style={staticStyles.label}>Betaald</Text>
                <Text style={[staticStyles.value, { color: '#10b981' }]}>-{fmt(paidAmount)}</Text>
              </View>
              <View style={staticStyles.totalRow}>
                <Text style={[staticStyles.value, staticStyles.bold]}>Saldo</Text>
                <Text style={[staticStyles.value, staticStyles.bold]}>{fmt(Math.max(0, total - paidAmount))}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 12 }}>
          <Text style={staticStyles.label}>{localStorage.getItem('erp_bank_details') || ''}</Text>
          <Text style={[staticStyles.label, { marginTop: 6 }]}>{localStorage.getItem('erp_legal_disclaimer') || ''}</Text>
        </View>
      </Page>
    </Document>
  );
};
