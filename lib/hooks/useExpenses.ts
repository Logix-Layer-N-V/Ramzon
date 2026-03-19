import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ExpenseRow {
  id: string;
  category: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  status: string;
  created_at: string;
}

export const useExpenses = () =>
  useQuery<ExpenseRow[]>({ queryKey: ['expenses'], queryFn: () => api.get('/expenses').then(r => r.data) });

export const useExpense = (id: string) =>
  useQuery<ExpenseRow>({
    queryKey: ['expenses', id],
    queryFn: () => api.get(`/expenses/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExpenseRow>) => api.post('/expenses', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ExpenseRow> & { id: string }) =>
      api.put(`/expenses/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};
