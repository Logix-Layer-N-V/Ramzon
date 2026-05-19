import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EstimateStatus } from '../../types';
import { api } from '../api';

export interface EstimateRow {
  id: string;
  estimateNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  validUntil: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: EstimateStatus;
  notes: string;
  rep: string;
  createdAt: string;
  items?: EstimateItemRow[];
}

export interface EstimateItemRow {
  id: string;
  estimateId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const useEstimates = () =>
  useQuery<EstimateRow[]>({ queryKey: ['estimates'], queryFn: () => api.get('/estimates').then(r => r.data) });

export const useEstimate = (id: string) =>
  useQuery<EstimateRow & { items: EstimateItemRow[] }>({
    queryKey: ['estimates', id],
    queryFn: () => api.get(`/estimates/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EstimateRow> & { items?: Partial<EstimateItemRow>[] }) =>
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
