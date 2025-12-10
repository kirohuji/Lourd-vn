import { ResourceQueryDto, UpdateResourceDto } from '@lourd-game/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useResources(query?: ResourceQueryDto) {
    return useQuery({
        queryKey: ['resources', query],
        queryFn: () => apiClient.getResources(query),
    });
}

export function useAllResources(query?: Omit<ResourceQueryDto, 'page' | 'limit'>) {
    return useQuery({
        queryKey: ['resources', 'all', query],
        queryFn: async () => {
            // 获取所有资源，使用大 limit
            const result = await apiClient.getResources({ ...query, limit: 1000, page: 1 });
            return result;
        },
    });
}

export function useResource(id: number) {
    return useQuery({
        queryKey: ['resources', id],
        queryFn: () => apiClient.getResource(id),
        enabled: !!id,
    });
}

export function useUploadResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            file,
            alias,
            bundle,
            bundleType,
        }: {
            file: File;
            alias: string;
            bundle: string;
            bundleType?: string;
        }) => apiClient.uploadResource(file, alias, bundle, bundleType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateResourceDto }) => apiClient.updateResource(id, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
        },
    });
}

export function useReplaceResourceFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file, dto }: { id: number; file: File; dto: UpdateResourceDto }) =>
            apiClient.replaceResourceFile(id, file, dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
        },
    });
}

export function useDeleteResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteResource(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

export function useMigrateResourceToCos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.migrateResourceToCos(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources', id] });
        },
    });
}

export function useUpdateBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            bundleName,
            newBundleName,
            newBundleType,
        }: {
            bundleName: string;
            newBundleName?: string;
            newBundleType?: 'common' | 'chapter';
        }) => apiClient.updateBundle(bundleName, newBundleName, newBundleType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['bundles'] });
        },
    });
}

export function useBundleList(query?: { bundleType?: string; search?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['bundles', query],
        queryFn: () => apiClient.getBundleList(query),
        // 设置 staleTime，避免频繁重新请求
        staleTime: 5 * 60 * 1000, // 5 分钟
        // 使用 placeholderData 保持之前的数据，避免闪烁
        placeholderData: previousData => previousData,
    });
}
