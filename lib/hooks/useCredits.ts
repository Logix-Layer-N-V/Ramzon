import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface CreditRow {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  date: string;
  reason: string;
  status?: string;
  createdAt: string;
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

export const useUpdateCredit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreditRow> & { id: string }) =>
      api.put(`/credits/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credits'] }),
  });
};

export const useDeleteCredit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/credits/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credits'] }),
  });
};
