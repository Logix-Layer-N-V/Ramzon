import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ClientRow {
  id: string;
  name: string;
  company: string;
  email: string;
  vatNumber: string;
  address: string;
  phone: string;
  preferredCurrency: string;
  /** @deprecated never written by the API — always 0. Compute revenue from invoices instead. */
  totalSpent: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export const useClients = () =>
  useQuery<ClientRow[]>({ queryKey: ['clients'], queryFn: () => api.get('/clients').then(r => r.data) });

export const useClient = (id: string) => {
  const qc = useQueryClient();
  return useQuery<ClientRow>({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`).then(r => r.data),
    enabled: !!id,
    // Serve immediately from list cache when available — avoids a round-trip and the
    // "not found" flash that occurs when the individual-client query hasn't settled yet.
    initialData: () => qc.getQueryData<ClientRow[]>(['clients'])?.find(c => c.id === id),
    initialDataUpdatedAt: () => qc.getQueryState(['clients'])?.dataUpdatedAt,
  });
};

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClientRow>) => api.post('/clients', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ClientRow> & { id: string }) =>
      api.put(`/clients/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};
