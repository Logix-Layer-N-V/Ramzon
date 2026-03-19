import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string;
  rep: string;
  paid_amount: number;
  created_at: string;
}

export const useInvoices = () =>
  useQuery<InvoiceRow[]>({ queryKey: ['invoices'], queryFn: () => api.get('/invoices').then(r => r.data) });

export const useInvoice = (id: string) =>
  useQuery<InvoiceRow & { items: unknown[] }>({
    queryKey: ['invoices', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InvoiceRow> & { items?: unknown[] }) =>
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
