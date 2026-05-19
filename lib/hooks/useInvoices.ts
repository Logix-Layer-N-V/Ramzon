import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceStatus } from '../../types';
import { api } from '../api';

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string;
  rep: string;
  paidAmount: number;
  createdAt: string;
}

export interface InvoiceItemRow {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const useInvoices = () =>
  useQuery<InvoiceRow[]>({ queryKey: ['invoices'], queryFn: () => api.get('/invoices').then(r => r.data) });

export const useInvoice = (id: string) =>
  useQuery<InvoiceRow & { items: InvoiceItemRow[] }>({
    queryKey: ['invoices', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InvoiceRow> & { items?: Partial<InvoiceItemRow>[] }) =>
      api.post('/invoices', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useUpdateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InvoiceRow> & { id: string }) =>
      api.put(`/invoices/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
};
