import { CreateCharacterDto, UpdateCharacterDto } from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useCharacters() {
    return useQuery({
        queryKey: ['characters'],
        queryFn: () => apiClient.getCharacters(),
    });
}

export function useUpsertCharacter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: CreateCharacterDto | UpdateCharacterDto }) =>
            apiClient.upsertCharacter(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        },
    });
}

export function useDeleteCharacter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteCharacter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        },
    });
}
