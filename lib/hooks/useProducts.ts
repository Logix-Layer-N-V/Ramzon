import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ProductRow {
  id: string;
  name: string;
  wood_type: string;
  unit: string;
  price_per_unit: number;
  stock: number;
  category: string;
  sku: string;
  created_at: string;
}

export const useProducts = () =>
  useQuery<ProductRow[]>({ queryKey: ['products'], queryFn: () => api.get('/products').then(r => r.data) });

export const useProduct = (id: string) =>
  useQuery<ProductRow>({
    queryKey: ['products', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductRow>) => api.post('/products', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ProductRow> & { id: string }) =>
      api.put(`/products/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};
