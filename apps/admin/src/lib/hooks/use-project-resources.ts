import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ResourceQueryDto,
} from '@lourd-game/shared';
import { apiClient } from '../api/client';

export function useProjectResources(projectId: number, query?: ResourceQueryDto) {
  return useQuery({
    queryKey: ['project-resources', projectId, query],
    queryFn: () => apiClient.getProjectResources(projectId, query),
    enabled: !!projectId,
  });
}

export function useAddResourceToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, resourceId }: { projectId: number; resourceId: number }) =>
      apiClient.addResourceToProject(projectId, resourceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-resources', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useRemoveResourceFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, resourceId }: { projectId: number; resourceId: number }) =>
      apiClient.removeResourceFromProject(projectId, resourceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-resources', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

