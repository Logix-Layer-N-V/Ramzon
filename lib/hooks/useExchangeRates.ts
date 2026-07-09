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

/**
 * The single source of truth for "today's" exchange rate — the most recent
 * row from the database, shared by every user/device. Pass the result into
 * lib/storage.ts's toBase/toSRD instead of letting them fall back to the
 * per-browser localStorage copy.
 */
export const useLatestExchangeRate = (): ExchangeRateRow | null => {
  const { data: rates = [] } = useExchangeRates();
  if (!rates.length) return null;
  return [...rates].sort((a, b) => b.date.localeCompare(a.date))[0];
};
