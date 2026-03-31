import { pdf } from '@react-pdf/renderer';
import { DocPDF, DocPDFProps } from '../components/DocPDF';
import { api } from './api';
import React from 'react';

/**
 * Generate PDF as base64 string from DocPDF component
 */
async function generatePdfBase64(props: DocPDFProps): Promise<string> {
  const doc = React.createElement(DocPDF, props) as any;
  const blob = await pdf(doc).toBlob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface SendDocumentParams {
  // Email recipient
  to: string;
  clientName: string;
  // Document info
  docType: 'invoice' | 'estimate';
  docNumber: string;
  total: number;
  currency: string;
  currencySymbol: string;
  // PDF props
  pdfProps: DocPDFProps;
  // Company name (optional)
  companyName?: string;
}

/**
 * Generate PDF and send it as an email attachment via the API
 */
export async function sendDocumentEmail(params: SendDocumentParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, clientName, docType, docNumber, total, currency, currencySymbol, pdfProps, companyName } = params;

  // Generate PDF
  const pdfBase64 = await generatePdfBase64(pdfProps);

  // Send via API
  const { data } = await api.post('/send-document', {
    to,
    clientName,
    docType,
    docNumber,
    total: `${currencySymbol}${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    currency,
    pdfBase64,
    companyName,
  });

  return data;
}
