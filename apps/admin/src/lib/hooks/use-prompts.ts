import {
    CreateBasePromptDto,
    CreateCharacterPromptDto,
    UpdateBasePromptDto,
    UpdateCharacterPromptDto,
} from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

// Base Prompt hooks
export function useBasePrompts() {
    return useQuery({
        queryKey: ['basePrompts'],
        queryFn: () => apiClient.getBasePrompts(),
    });
}

export function useBasePrompt(id: number) {
    return useQuery({
        queryKey: ['basePrompts', id],
        queryFn: () => apiClient.getBasePrompt(id),
        enabled: !!id,
    });
}

export function useCreateBasePrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateBasePromptDto) => apiClient.createBasePrompt(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
        },
    });
}

export function useUpdateBasePrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateBasePromptDto }) =>
            apiClient.updateBasePrompt(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
            queryClient.invalidateQueries({ queryKey: ['basePrompts', variables.id] });
        },
    });
}

export function useDeleteBasePrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteBasePrompt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
        },
    });
}

// Character Prompt hooks
export function useCharacterPrompts(basePromptId: number) {
    return useQuery({
        queryKey: ['characterPrompts', basePromptId],
        queryFn: () => apiClient.getCharacterPrompts(basePromptId),
        enabled: !!basePromptId,
    });
}

export function useCharacterPrompt(id: number) {
    return useQuery({
        queryKey: ['characterPrompts', 'detail', id],
        queryFn: () => apiClient.getCharacterPrompt(id),
        enabled: !!id,
    });
}

export function useCreateCharacterPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ basePromptId, dto }: { basePromptId: number; dto: CreateCharacterPromptDto }) =>
            apiClient.createCharacterPrompt(basePromptId, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['characterPrompts', variables.basePromptId] });
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
            queryClient.invalidateQueries({ queryKey: ['basePrompts', variables.basePromptId] });
        },
    });
}

export function useUpdateCharacterPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateCharacterPromptDto }) =>
            apiClient.updateCharacterPrompt(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['characterPrompts'] });
            queryClient.invalidateQueries({ queryKey: ['characterPrompts', 'detail', variables.id] });
        },
    });
}

export function useDeleteCharacterPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteCharacterPrompt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['characterPrompts'] });
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
        },
    });
}

// Prompt Image hooks
export function usePromptImages(characterPromptId: number) {
    return useQuery({
        queryKey: ['promptImages', characterPromptId],
        queryFn: () => apiClient.getPromptImages(characterPromptId),
        enabled: !!characterPromptId,
    });
}

export function useUploadPromptImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ characterPromptId, files }: { characterPromptId: number; files: File[] }) =>
            apiClient.uploadPromptImages(characterPromptId, files),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['promptImages', variables.characterPromptId] });
            queryClient.invalidateQueries({ queryKey: ['characterPrompts'] });
        },
    });
}

export function useDeletePromptImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deletePromptImage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promptImages'] });
        },
    });
}

