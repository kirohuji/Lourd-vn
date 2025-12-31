export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const endpoints = {
    auth: {
        wechatLogin: '/auth/wechat/login',
        emailLogin: '/auth/email/login',
    },
    projects: {
        list: '/projects',
        detail: (id: number) => `/projects/${id}`,
        create: '/projects',
        update: (id: number) => `/projects/${id}`,
        delete: (id: number) => `/projects/${id}`,
        // 项目资源管理
        resources: (projectId: number) => `/projects/${projectId}/resources`,
        addResource: (projectId: number, resourceId: number) => `/projects/${projectId}/resources/${resourceId}`,
        removeResource: (projectId: number, resourceId: number) => `/projects/${projectId}/resources/${resourceId}`,
        // 项目地图管理
        maps: (projectId: number) => `/projects/${projectId}/maps`,
        addMap: (projectId: number, mapId: string) => `/projects/${projectId}/maps/${mapId}`,
        removeMap: (projectId: number, mapId: string) => `/projects/${projectId}/maps/${mapId}`,
        // 项目角色管理
        characters: (projectId: number) => `/projects/${projectId}/characters`,
        addCharacter: (projectId: number, characterId: string) => `/projects/${projectId}/characters/${characterId}`,
        removeCharacter: (projectId: number, characterId: string) => `/projects/${projectId}/characters/${characterId}`,
        // 项目 Manifest
        manifest: {
            common: (projectId: number) => `/projects/${projectId}/manifest/common`,
            full: (projectId: number) => `/projects/${projectId}/manifest/full`,
        },
        // 项目策划
        planning: {
            get: (projectId: number) => `/projects/${projectId}/planning`,
            update: (projectId: number) => `/projects/${projectId}/planning`,
        },
    },
    chapters: {
        list: (projectId: number) => `/projects/${projectId}/chapters`,
        detail: (id: number) => `/chapters/${id}`,
        create: (projectId: number) => `/projects/${projectId}/chapters`,
        update: (id: number) => `/chapters/${id}`,
        delete: (id: number) => `/chapters/${id}`,
        inkFiles: {
            list: (chapterId: number) => `/chapters/${chapterId}/ink-files`,
            detail: (chapterId: number, inkId: number) => `/chapters/${chapterId}/ink-files/${inkId}`,
            create: (chapterId: number) => `/chapters/${chapterId}/ink-files`,
            update: (chapterId: number, inkId: number) => `/chapters/${chapterId}/ink-files/${inkId}`,
            delete: (chapterId: number, inkId: number) => `/chapters/${chapterId}/ink-files/${inkId}`,
            compile: (chapterId: number, inkId: number) => `/chapters/${chapterId}/ink-files/${inkId}/compile`,
        },
        resources: {
            list: (chapterId: number) => `/chapters/${chapterId}/resources`,
            add: (chapterId: number, resourceId: number) => `/chapters/${chapterId}/resources/${resourceId}`,
            remove: (chapterId: number, resourceId: number) => `/chapters/${chapterId}/resources/${resourceId}`,
        },
        manifest: (chapterId: number) => `/chapters/${chapterId}/manifest`,
    },
    resources: {
        list: '/manifest',
        detail: (id: number) => `/manifest/${id}`,
        create: '/manifest',
        update: (id: number) => `/manifest/${id}`,
        delete: (id: number) => `/manifest/${id}`,
        migrateToCos: (id: number) => `/manifest/${id}/migrate-to-cos`,
        generate: '/manifest/generate',
        bundles: '/manifest/bundles',
    },
    maps: {
        list: '/game-config/maps',
        upsert: (id: string) => `/game-config/maps/${id}`,
        delete: (id: string) => `/game-config/maps/${id}`,
    },
    locations: {
        list: '/game-config/locations',
        upsert: (id: string) => `/game-config/locations/${id}`,
        delete: (id: string) => `/game-config/locations/${id}`,
    },
    rooms: {
        list: '/game-config/rooms',
        upsert: (id: string) => `/game-config/rooms/${id}`,
        delete: (id: string) => `/game-config/rooms/${id}`,
    },
    characters: {
        list: '/game-config/characters',
        upsert: (id: string) => `/game-config/characters/${id}`,
        delete: (id: string) => `/game-config/characters/${id}`,
    },
    users: {
        list: '/users',
        detail: (id: number) => `/users/${id}`,
        update: (id: number) => `/users/${id}`,
        delete: (id: number) => `/users/${id}`,
    },
    lorebook: {
        entries: {
            list: '/lorebook/entries',
            detail: (id: string) => `/lorebook/entries/${id}`,
            create: '/lorebook/entries',
            update: (id: string) => `/lorebook/entries/${id}`,
            delete: (id: string) => `/lorebook/entries/${id}`,
        },
        categories: {
            list: '/lorebook/categories',
            detail: (id: string) => `/lorebook/categories/${id}`,
            create: '/lorebook/categories',
            update: (id: string) => `/lorebook/categories/${id}`,
            updateOrder: (id: string) => `/lorebook/categories/${id}/order`,
            delete: (id: string) => `/lorebook/categories/${id}`,
        },
        settings: {
            get: '/lorebook/settings',
            update: '/lorebook/settings',
        },
    },
} as const;
