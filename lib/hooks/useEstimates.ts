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
  exchangeRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: EstimateStatus;
  notes: string;
  rep: string;
  createdAt: string;
}

export interface EstimateItemRow {
  id: string;
  estimateId?: string;
  description: string;
  houtsoort: string;
  spec: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  total: number;
  priceByArea: boolean;
  itemType: string;
}

export const useEstimates = () =>
  useQuery<EstimateRow[]>({ queryKey: ['estimates'], queryFn: () => api.get('/estimates').then(r => r.data) });

export const useEstimate = (id: string) =>
  useQuery<EstimateRow & { items: EstimateItemRow[] }>({
    queryKey: ['estimates', id],
    queryFn: () => api.get(`/estimates/${id}`).then(r => r.data),
    enabled: !!id,
  });

type EstimatePayload = Partial<EstimateRow> & { items?: Partial<EstimateItemRow>[] };

export const useCreateEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EstimatePayload) => api.post('/estimates', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
};

export const useUpdateEstimate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: EstimatePayload & { id: string }) =>
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
