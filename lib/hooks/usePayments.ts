import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface PaymentRow {
  id: string;
  clientId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  bankAccountId: string;
  date: string;
  method: string;
  reference: string;
  notes: string;
  status: string;
  createdAt: string;
}

export const usePayments = () =>
  useQuery<PaymentRow[]>({ queryKey: ['payments'], queryFn: () => api.get('/payments').then(r => r.data) });

export const usePayment = (id: string) =>
  useQuery<PaymentRow>({
    queryKey: ['payments', id],
    queryFn: () => api.get(`/payments/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PaymentRow>) => api.post('/payments', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUpdatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PaymentRow> & { id: string }) =>
      api.put(`/payments/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useDeletePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};
