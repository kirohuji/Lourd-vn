import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ResourceQueryDto,
  UpdateResourceDto,
} from '@lourd-game/shared';
import { apiClient } from '../api/client';

export function useResources(query?: ResourceQueryDto) {
  return useQuery({
    queryKey: ['resources', query],
    queryFn: () => apiClient.getResources(query),
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => apiClient.getResource(id),
    enabled: !!id,
  });
}

export function useUploadResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      alias,
      bundle,
    }: {
      file: File;
      alias: string;
      bundle: string;
    }) => apiClient.uploadResource(file, alias, bundle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateResourceDto }) =>
      apiClient.updateResource(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useMigrateResourceToCos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.migrateResourceToCos(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', id] });
    },
  });
}

