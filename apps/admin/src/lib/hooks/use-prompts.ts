import {
    CreateBasePromptDto,
    CreateCharacterPromptDto,
    CreatePromptTagDto,
    CreatePromptVariantDto,
    UpdateBasePromptDto,
    UpdateCharacterPromptDto,
    UpdatePromptTagDto,
    UpdatePromptVariantDto,
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

// Base Prompt Images hooks
export function useBasePromptImages(basePromptId: number) {
    return useQuery({
        queryKey: ['basePromptImages', basePromptId],
        queryFn: () => apiClient.getBasePromptImages(basePromptId),
        enabled: !!basePromptId,
    });
}

export function useUploadBasePromptImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ basePromptId, files }: { basePromptId: number; files: File[] }) =>
            apiClient.uploadBasePromptImages(basePromptId, files),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['basePromptImages', variables.basePromptId] });
            queryClient.invalidateQueries({ queryKey: ['basePrompts'] });
        },
    });
}

// Prompt Tag hooks
export function usePromptTags(tagType?: string) {
    return useQuery({
        queryKey: ['promptTags', tagType],
        queryFn: () => apiClient.getPromptTags(tagType),
    });
}

export function usePromptTag(id: number) {
    return useQuery({
        queryKey: ['promptTags', id],
        queryFn: () => apiClient.getPromptTag(id),
        enabled: !!id,
    });
}

export function useCreatePromptTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreatePromptTagDto) => apiClient.createPromptTag(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promptTags'] });
        },
    });
}

export function useUpdatePromptTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdatePromptTagDto }) =>
            apiClient.updatePromptTag(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['promptTags'] });
            queryClient.invalidateQueries({ queryKey: ['promptTags', variables.id] });
        },
    });
}

export function useDeletePromptTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deletePromptTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promptTags'] });
        },
    });
}

// Prompt Variant hooks
export function usePromptVariants(basePromptId?: number, characterPromptId?: number) {
    return useQuery({
        queryKey: ['promptVariants', basePromptId, characterPromptId],
        queryFn: () => apiClient.getPromptVariants(basePromptId, characterPromptId),
        enabled: !!(basePromptId || characterPromptId),
    });
}

export function usePromptVariant(id: number) {
    return useQuery({
        queryKey: ['promptVariants', id],
        queryFn: () => apiClient.getPromptVariant(id),
        enabled: !!id,
    });
}

export function useCreatePromptVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreatePromptVariantDto) => apiClient.createPromptVariant(dto),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['promptVariants'] });
            if (data.basePromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', data.basePromptId] });
            }
            if (data.characterPromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', undefined, data.characterPromptId] });
            }
        },
    });
}

export function useUpdatePromptVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdatePromptVariantDto }) =>
            apiClient.updatePromptVariant(id, dto),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['promptVariants'] });
            queryClient.invalidateQueries({ queryKey: ['promptVariants', variables.id] });
            if (data.basePromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', data.basePromptId] });
            }
            if (data.characterPromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', undefined, data.characterPromptId] });
            }
        },
    });
}

export function useDeletePromptVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deletePromptVariant(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promptVariants'] });
        },
    });
}

export function useSetDefaultPromptVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.setDefaultPromptVariant(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['promptVariants'] });
            if (data.basePromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', data.basePromptId] });
            }
            if (data.characterPromptId) {
                queryClient.invalidateQueries({ queryKey: ['promptVariants', undefined, data.characterPromptId] });
            }
        },
    });
}

export function useMergePromptVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.mergePromptVariant(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['promptVariants', id] });
        },
    });
}

// Prompt Images Grouped hooks
export function usePromptImagesGrouped(basePromptId?: number, characterPromptId?: number) {
    return useQuery({
        queryKey: ['promptImagesGrouped', basePromptId, characterPromptId],
        queryFn: () => apiClient.getPromptImagesGrouped(basePromptId, characterPromptId),
        enabled: !!(basePromptId || characterPromptId),
    });
}

