import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface EstimateRow {
  id: string;
  estimate_number: string;
  client_id: string;
  client_name: string;
  date: string;
  valid_until: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string;
  rep: string;
  created_at: string;
}

export const useEstimates = () =>
  useQuery<EstimateRow[]>({ queryKey: ['estimates'], queryFn: () => api.get('/estimates').then(r => r.data) });

export const useEstimate = (id: string) =>
  useQuery<EstimateRow & { items: unknown[] }>({
    queryKey: ['estimates', id],
    queryFn: () => api.get(`/estimates/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EstimateRow> & { items?: unknown[] }) =>
      api.post('/estimates', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
};

export const useUpdateEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<EstimateRow> & { id: string }) =>
      api.put(`/estimates/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
};

export const useDeleteEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/estimates/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
};
