import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ExchangeRateRow {
  id: string;
  date: string;
  usdSrd: number;
  eurSrd: number;
  eurUsd: number;
}

export const useExchangeRates = () =>
  useQuery<ExchangeRateRow[]>({
    queryKey: ['exchange-rates'],
    queryFn: () => api.get('/exchange-rates').then(r =>
      (r.data as any[]).map((row: any) => ({
        ...row,
        usdSrd: Number(row.usdSrd),
        eurSrd: Number(row.eurSrd),
        eurUsd: Number(row.eurUsd),
      }))
    ),
  });

export const useCreateExchangeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ExchangeRateRow, 'id'>) => api.post('/exchange-rates', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-rates'] }),
  });
};

export const useDeleteExchangeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/exchange-rates/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-rates'] }),
  });
};
