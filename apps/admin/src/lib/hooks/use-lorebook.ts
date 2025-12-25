import {
    CreateLoreBookCategoryDto,
    CreateLoreBookEntryDto,
    UpdateLoreBookCategoryDto,
    UpdateLoreBookEntryDto,
    UpdateLoreBookSettingsDto,
} from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

// Entry hooks
export function useLoreBookEntries(categoryId?: string) {
    return useQuery({
        queryKey: ['lorebookEntries', categoryId],
        queryFn: () => apiClient.getLoreBookEntries(categoryId),
    });
}

export function useLoreBookEntry(id: string) {
    return useQuery({
        queryKey: ['lorebookEntries', id],
        queryFn: () => apiClient.getLoreBookEntry(id),
        enabled: !!id,
    });
}

export function useCreateLoreBookEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateLoreBookEntryDto) => apiClient.createLoreBookEntry(dto),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries'] });
            if (data.categoryId) {
                queryClient.invalidateQueries({ queryKey: ['lorebookCategories', data.categoryId] });
            }
        },
    });
}

export function useUpdateLoreBookEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateLoreBookEntryDto }) =>
            apiClient.updateLoreBookEntry(id, dto),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries'] });
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries', variables.id] });
            if (data.categoryId) {
                queryClient.invalidateQueries({ queryKey: ['lorebookCategories', data.categoryId] });
            }
        },
    });
}

export function useDeleteLoreBookEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteLoreBookEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries'] });
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories'] });
        },
    });
}

// Category hooks
export function useLoreBookCategories() {
    return useQuery({
        queryKey: ['lorebookCategories'],
        queryFn: () => apiClient.getLoreBookCategories(),
    });
}

export function useLoreBookCategory(id: string) {
    return useQuery({
        queryKey: ['lorebookCategories', id],
        queryFn: () => apiClient.getLoreBookCategory(id),
        enabled: !!id,
    });
}

export function useCreateLoreBookCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateLoreBookCategoryDto) => apiClient.createLoreBookCategory(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories'] });
        },
    });
}

export function useUpdateLoreBookCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateLoreBookCategoryDto }) =>
            apiClient.updateLoreBookCategory(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories'] });
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries'] });
        },
    });
}

export function useUpdateLoreBookCategoryOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, order }: { id: string; order: string[] }) =>
            apiClient.updateLoreBookCategoryOrder(id, order),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories'] });
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories', variables.id] });
        },
    });
}

export function useDeleteLoreBookCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteLoreBookCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lorebookCategories'] });
            queryClient.invalidateQueries({ queryKey: ['lorebookEntries'] });
        },
    });
}

// Settings hooks
export function useLoreBookSettings() {
    return useQuery({
        queryKey: ['lorebookSettings'],
        queryFn: () => apiClient.getLoreBookSettings(),
    });
}

export function useUpdateLoreBookSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: UpdateLoreBookSettingsDto) => apiClient.updateLoreBookSettings(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lorebookSettings'] });
        },
    });
}

