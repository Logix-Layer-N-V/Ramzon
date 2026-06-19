import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  pricingType: string;
  sortOrder: number;
}

export const useProductCategories = () =>
  useQuery<ProductCategory[]>({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/product-categories').then(r => r.data),
  });

export const useCreateProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ProductCategory, 'id'>) =>
      api.post('/product-categories', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
};

export const useUpdateProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ProductCategory) =>
      api.put(`/product-categories/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
};

export const useDeleteProductCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/product-categories/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
