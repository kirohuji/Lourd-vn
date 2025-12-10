import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UpdateUserDto,
  UserQueryDto,
} from '@lourd-game/shared';
import { apiClient } from '../api/client';

export function useUsers(query?: UserQueryDto) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => apiClient.getUsers(query),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) =>
      apiClient.updateUser(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

