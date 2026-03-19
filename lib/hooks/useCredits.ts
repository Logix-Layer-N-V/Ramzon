import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface CreditRow {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  date: string;
  reason: string;
  created_at: string;
}

export const useCredits = () =>
  useQuery<CreditRow[]>({ queryKey: ['credits'], queryFn: () => api.get('/credits').then(r => r.data) });

export const useCredit = (id: string) =>
  useQuery<CreditRow>({
    queryKey: ['credits', id],
    queryFn: () => api.get(`/credits/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateCredit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreditRow>) => api.post('/credits', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credits'] }),
  });
};
