import { CompileInkResponse, CreateInkFileDto, UpdateInkFileDto } from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useInkFiles(chapterId: number) {
    return useQuery({
        queryKey: ['ink-files', chapterId],
        queryFn: () => apiClient.getInkFiles(chapterId),
        enabled: !!chapterId,
    });
}

export function useInkFile(chapterId: number, inkId: number) {
    return useQuery({
        queryKey: ['ink-files', chapterId, inkId],
        queryFn: () => apiClient.getInkFile(chapterId, inkId),
        enabled: !!chapterId && !!inkId,
    });
}

export function useCreateInkFile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ chapterId, dto }: { chapterId: number; dto: CreateInkFileDto }) =>
            apiClient.createInkFile(chapterId, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ink-files', variables.chapterId] });
        },
    });
}

export function useUpdateInkFile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ chapterId, inkId, dto }: { chapterId: number; inkId: number; dto: UpdateInkFileDto }) =>
            apiClient.updateInkFile(chapterId, inkId, dto),
        onSuccess: data => {
            queryClient.invalidateQueries({ queryKey: ['ink-files', data.chapterId] });
            queryClient.invalidateQueries({ queryKey: ['ink-files', data.chapterId, data.id] });
        },
    });
}

export function useDeleteInkFile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ chapterId, inkId }: { chapterId: number; inkId: number }) =>
            apiClient.deleteInkFile(chapterId, inkId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ink-files', variables.chapterId] });
        },
    });
}

export function useCompileInkFile() {
    return useMutation({
        mutationFn: ({ chapterId, inkId }: { chapterId: number; inkId: number }): Promise<CompileInkResponse> =>
            apiClient.compileInkFile(chapterId, inkId),
    });
}
