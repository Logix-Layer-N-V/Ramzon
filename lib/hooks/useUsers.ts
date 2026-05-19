import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Accountant';
  status: 'Active' | 'Inactive';
  avatar?: string;
  joinedDate?: string;
}

export const useUsers = () =>
  useQuery<UserRow[]>({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserRow> & { password?: string }) => api.post('/users', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<UserRow> & { id: string }) => api.put(`/users/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
