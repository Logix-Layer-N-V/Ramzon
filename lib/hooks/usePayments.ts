import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface PaymentRow {
  id: string;
  client_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  reference: string;
  notes: string;
  created_at: string;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};
