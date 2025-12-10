import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChapterQueryDto, CreateChapterDto, UpdateChapterDto } from '@lourd-game/shared';
import { apiClient } from '../api/client';

export function useChapters(projectId: number, query?: ChapterQueryDto) {
    return useQuery({
        queryKey: ['chapters', projectId, query],
        queryFn: () => apiClient.getChapters(projectId, query),
        enabled: !!projectId,
    });
}

export function useChapter(id: number) {
    return useQuery({
        queryKey: ['chapters', id],
        queryFn: () => apiClient.getChapter(id),
        enabled: !!id,
    });
}

export function useCreateChapter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, dto }: { projectId: number; dto: CreateChapterDto }) =>
            apiClient.createChapter(projectId, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chapters', variables.projectId] });
        },
    });
}

export function useUpdateChapter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateChapterDto }) =>
            apiClient.updateChapter(id, dto),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chapters', data.projectId] });
            queryClient.invalidateQueries({ queryKey: ['chapters', data.id] });
        },
    });
}

export function useDeleteChapter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteChapter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chapters'] });
        },
    });
}

export function useGenerateChapterBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.generateChapterBundle(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['chapters'] });
            queryClient.invalidateQueries({ queryKey: ['chapters', id] });
        },
    });
}

