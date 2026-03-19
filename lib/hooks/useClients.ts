import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ClientRow {
  id: string;
  name: string;
  company: string;
  email: string;
  vat_number: string;
  address: string;
  phone: string;
  preferred_currency: string;
  total_spent: number;
  status: 'Active' | 'Inactive';
}

export const useClients = () =>
  useQuery<ClientRow[]>({ queryKey: ['clients'], queryFn: () => api.get('/clients').then(r => r.data) });

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
