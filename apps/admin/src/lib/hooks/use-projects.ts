import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto, UpdateProjectPlanningDto } from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useProjects(query?: ProjectQueryDto) {
    return useQuery({
        queryKey: ['projects', query],
        queryFn: () => apiClient.getProjects(query),
    });
}

export function useProject(id: number) {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: () => apiClient.getProject(id),
        enabled: !!id,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateProjectDto) => apiClient.createProject(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateProjectDto }) => apiClient.updateProject(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useGenerateProjectBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.generateProjectBundle(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
        },
    });
}

export function useProjectPlanning(projectId: number) {
    return useQuery({
        queryKey: ['projects', projectId, 'planning'],
        queryFn: () => apiClient.getProjectPlanning(projectId),
        enabled: !!projectId,
    });
}

export function useUpdateProjectPlanning() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, dto }: { projectId: number; dto: UpdateProjectPlanningDto }) =>
            apiClient.updateProjectPlanning(projectId, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['projects', variables.projectId, 'planning'],
            });
        },
    });
}
