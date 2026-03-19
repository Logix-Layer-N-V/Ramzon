// components/DocPDF.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const getAccentColor = () => localStorage.getItem('erp_doc_accent_color') || '#8B1D2A';

// Module-level stable styles (no dynamic color)
const S = StyleSheet.create({
  page:      { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1e293b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, marginBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  label:     { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  value:     { fontSize: 9, color: '#1e293b' },
  bold:      { fontWeight: 'bold' },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingVertical: 5, paddingHorizontal: 4 },
  totals:    { alignItems: 'flex-end', marginTop: 12 },
  totalRow:  { flexDirection: 'row', gap: 40, marginBottom: 4 },
});

const defaults: Record<string, string> = { invoice: 'Invoice', quote: 'Estimate', payment: 'Payment', credit: 'Credit Note' };

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
  companyLogo?: string;
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
  companyName, companyAddress, companyPhone, companyEmail, companyLogo,
  rep, paidAmount, currency, currencySymbol, items, subtotal, tax, total,
}) => {
  const accentColor = getAccentColor();
  const customTitles: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') || '{}'); } catch { return {}; }
  })();

  const docTitle = customTitles[docType] ?? defaults[docType];
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  const bankDetails     = localStorage.getItem('erp_bank_details') || '';
  const legalDisclaimer = localStorage.getItem('erp_legal_disclaimer') || '';

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── HEADER: company left | title right ── */}
        <View style={S.headerRow}>

          {/* LEFT: logo + company info */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            {companyLogo && (
              <Image
                src={companyLogo}
                style={{ height: 40, objectFit: 'contain', marginRight: 8 }}
              />
            )}
            <View>
              {companyName    && <Text style={[S.value, S.bold, { fontSize: 11, marginBottom: 3 }]}>{companyName}</Text>}
              {companyAddress && <Text style={[S.label, { marginBottom: 1 }]}>{companyAddress.toUpperCase()}</Text>}
              {companyPhone   && <Text style={S.label}>{companyPhone}</Text>}
              {companyEmail   && <Text style={S.label}>{companyEmail}</Text>}
            </View>
          </View>

          {/* RIGHT: document title + meta */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: accentColor, marginBottom: 6 }}>{docTitle}</Text>
            <Text style={[S.value, { fontSize: 10, marginBottom: 2 }]}>{docNumber}</Text>
            <Text style={S.label}>{fmtDate(date)}</Text>
            {validUntil && (
              <Text style={S.label}>
                {docType === 'quote' ? 'GELDIG T/M ' : 'VERVALDATUM '}{fmtDate(validUntil)}
              </Text>
            )}
            {docType === 'invoice' && !validUntil && (
              <Text style={S.label}>Betaaltermijn 30 dagen</Text>
            )}
          </View>
        </View>

        {/* ── CLIENT BLOCK (AAN) ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={[S.label, { marginBottom: 4 }]}>Aan</Text>
          <Text style={[S.value, S.bold]}>{clientName}</Text>
          {clientCompany && <Text style={[S.value, { fontSize: 9 }]}>{clientCompany}</Text>}
          {clientAddress && <Text style={[S.label, { marginTop: 2 }]}>{clientAddress.toUpperCase()}</Text>}
          {clientPhone   && <Text style={S.label}>{clientPhone}</Text>}
          {clientEmail   && <Text style={S.label}>{clientEmail}</Text>}
          {clientVAT     && <Text style={S.label}>BTW: {clientVAT}</Text>}
        </View>

        {/* ── REP ── */}
        {rep && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[S.label, { marginBottom: 4 }]}>Rep</Text>
            <Text style={[S.value, S.bold]}>{rep}</Text>
          </View>
        )}

        {/* ── META ROW TABLE ── */}
        <View style={{ marginBottom: 14, borderWidth: 0.5, borderColor: '#e2e8f0' }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
            {['Date', docType === 'invoice' ? 'Invoice #' : 'Estimate #', 'Terms', 'Due Date', 'Rep', 'Project'].map((h, i) => (
              <Text key={i} style={{ flex: 1, fontSize: 6, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, padding: '4 6', borderRightWidth: i < 5 ? 0.5 : 0, borderRightColor: '#e2e8f0' }}>{h}</Text>
            ))}
          </View>
          {/* Value row */}
          <View style={{ flexDirection: 'row' }}>
            {[fmtDate(date), docNumber, 'COD', validUntil ? fmtDate(validUntil) : '—', rep || '—', '—'].map((v, i) => (
              <Text key={i} style={{ flex: 1, fontSize: 8, fontWeight: 'bold', color: '#1e293b', padding: '4 6', borderRightWidth: i < 5 ? 0.5 : 0, borderRightColor: '#e2e8f0' }}>{v}</Text>
            ))}
          </View>
        </View>

        {/* ── TABLE HEADER ── */}
        <View style={{ flexDirection: 'row', backgroundColor: accentColor, paddingVertical: 7, paddingHorizontal: 4, marginTop: 12 }}>
          <Text style={{ flex: 3, color: 'white', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.6 }}>Omschrijving</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.6 }}>QTY</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.6 }}>Prijs</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.6 }}>Totaal</Text>
        </View>

        {/* ── TABLE ROWS ── */}
        {items.map((item, i) => (
          <View key={i} style={S.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={S.value}>{item.description}</Text>
              {item.houtsoort && <Text style={[S.label, { marginTop: 1 }]}>{item.houtsoort}</Text>}
            </View>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b', fontSize: 9 }}>{item.qty} {item.unit}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b', fontSize: 9 }}>{fmt(item.price)}</Text>
            <Text style={{ flex: 1, textAlign: 'right', color: '#1e293b', fontSize: 9, fontWeight: 'bold' }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* ── TOTALS ── */}
        <View style={S.totals}>
          <View style={S.totalRow}>
            <Text style={S.label}>Subtotaal</Text>
            <Text style={S.value}>{fmt(subtotal)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.label}>BTW 21%</Text>
            <Text style={S.value}>{fmt(tax)}</Text>
          </View>
          <View style={[S.totalRow, { borderTopWidth: 1.5, borderTopColor: accentColor, paddingTop: 5, marginTop: 4 }]}>
            <Text style={[S.value, S.bold, { color: accentColor }]}>TOTAAL ({currency})</Text>
            <Text style={[S.value, S.bold, { color: accentColor }]}>{fmt(total)}</Text>
          </View>
          {paidAmount != null && paidAmount > 0 && (
            <>
              <View style={S.totalRow}>
                <Text style={[S.label, { color: '#10b981' }]}>Betaald</Text>
                <Text style={[S.value, { color: '#10b981' }]}>-{fmt(paidAmount)}</Text>
              </View>
              <View style={[S.totalRow, { borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 4, marginTop: 2 }]}>
                <Text style={[S.value, S.bold]}>Saldo</Text>
                <Text style={[S.value, S.bold]}>{fmt(Math.max(0, total - paidAmount))}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── FOOTER ── */}
        {(bankDetails || legalDisclaimer) && (
          <View style={{ marginTop: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 12 }}>
            {bankDetails     && <Text style={[S.label, { marginBottom: 4, color: '#475569' }]}>{bankDetails}</Text>}
            {legalDisclaimer && <Text style={[S.label, { color: '#475569' }]}>{legalDisclaimer}</Text>}
          </View>
        )}

      </Page>
    </Document>
  );
};
