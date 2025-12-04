import { create } from 'zustand';
import { ResourceResponseDto } from '@lourd-game/shared';
import { apiClient } from '../utils/api-client';

interface ResourcesState {
    resources: ResourceResponseDto[];
    loading: boolean;
    loaded: boolean;
    loadAllResources: () => Promise<void>;
    findResourceByAlias: (alias: string | undefined | null) => ResourceResponseDto | undefined;
    getImageResources: () => ResourceResponseDto[];
    getBundleOptions: () => string[];
}

export const useResourcesStore = create<ResourcesState>((set, get) => ({
    resources: [],
    loading: false,
    loaded: false,

    loadAllResources: async () => {
        const { loaded, loading } = get();
        // 如果已经加载过且正在加载中，不重复加载
        if (loaded || loading) {
            return;
        }

        set({ loading: true });
        try {
            const allResources: ResourceResponseDto[] = [];
            let page = 1;
            let hasMore = true;

            // 分页获取所有资源
            while (hasMore) {
                const response = await apiClient.getResources({
                    page,
                    limit: 100, // 每页100条
                });

                allResources.push(...response.data);

                if (page >= response.totalPages) {
                    hasMore = false;
                } else {
                    page++;
                }
            }

            set({
                resources: allResources,
                loaded: true,
                loading: false,
            });
        } catch (error) {
            console.error('Failed to load resources:', error);
            set({ loading: false });
            throw error;
        }
    },

    findResourceByAlias: (alias: string | undefined | null) => {
        if (!alias) return undefined;
        const { resources } = get();
        return resources.find(r => r.alias === alias);
    },

    getImageResources: () => {
        const { resources } = get();
        return resources.filter(
            r => (r.fileType && r.fileType.startsWith('image')) || r.src.startsWith('data:image'),
        );
    },

    getBundleOptions: () => {
        const { resources } = get();
        return Array.from(
            new Set(resources.map(res => res.bundle).filter((b): b is string => !!b)),
        ).sort();
    },
}));

