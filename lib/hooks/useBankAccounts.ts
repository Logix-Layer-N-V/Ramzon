import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface BankAccountRow {
  id: string;
  bank: string;
  currency: string;
  iban: string;
  balance: number;
}

export const useBankAccounts = () =>
  useQuery<BankAccountRow[]>({
    queryKey: ['bank-accounts'],
    queryFn: () => api.get('/bank-accounts').then(r => r.data),
  });

export const useCreateBankAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BankAccountRow, 'id'>) => api.post('/bank-accounts', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
};

export const useUpdateBankAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: BankAccountRow) => api.put(`/bank-accounts/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
};

export const useDeleteBankAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bank-accounts/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
};
