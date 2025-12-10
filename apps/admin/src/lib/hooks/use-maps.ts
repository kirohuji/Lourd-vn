import { CreateMapDto, UpdateMapDto } from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useMaps() {
    return useQuery({
        queryKey: ['maps'],
        queryFn: () => apiClient.getMaps(),
    });
}

export function useUpsertMap() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: CreateMapDto | UpdateMapDto }) => apiClient.upsertMap(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maps'] });
        },
    });
}

export function useDeleteMap() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteMap(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maps'] });
        },
    });
}
