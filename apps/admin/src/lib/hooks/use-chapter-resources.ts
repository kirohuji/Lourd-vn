import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResourceQueryDto } from '@lourd-game/shared';
import { apiClient } from '../api/client';

export function useChapterResources(chapterId: number, query?: ResourceQueryDto) {
    return useQuery({
        queryKey: ['chapters', chapterId, 'resources', query],
        queryFn: () => apiClient.getChapterResources(chapterId, query),
        enabled: !!chapterId,
    });
}

export function useAddResourceToChapter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chapterId, resourceId }: { chapterId: number; resourceId: number }) =>
            apiClient.addResourceToChapter(chapterId, resourceId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chapters', variables.chapterId, 'resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

export function useRemoveResourceFromChapter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chapterId, resourceId }: { chapterId: number; resourceId: number }) =>
            apiClient.removeResourceFromChapter(chapterId, resourceId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chapters', variables.chapterId, 'resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

