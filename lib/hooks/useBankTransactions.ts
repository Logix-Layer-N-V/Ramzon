import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface BankTransactionRow {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee';
  amount: number;
  date: string;
  description: string;
  reference: string;
  toAccountId: string;
}

export const useBankTransactions = (accountId?: string) =>
  useQuery<BankTransactionRow[]>({
    queryKey: ['bank-transactions', accountId],
    enabled: !!accountId,
    queryFn: () =>
      api.get(`/bank-transactions?accountId=${accountId}`).then(r =>
        (r.data as any[]).map((row: any) => ({ ...row, amount: Number(row.amount) }))
      ),
  });

export const useCreateBankTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BankTransactionRow, 'id'>) =>
      api.post('/bank-transactions', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};

export const useDeleteBankTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bank-transactions/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};
