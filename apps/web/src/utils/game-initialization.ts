import { initI18n } from '../i18n';
import { defineAssets } from './assets-utility';
import { loadCharactersFromAPI } from './characters-utility';
import { initializeIndexedDB } from './indexedDB-utility';
import { importAllInkLabels } from './ink-utility';
import { resourceCache } from './resource-cache';

/**
 * 游戏初始化函数
 * 包含所有资源加载逻辑，应该在用户登录后调用
 * 会检查资源是否已加载，避免重复加载
 * 这个函数是幂等的，可以安全地多次调用
 */
export async function initializeGame(): Promise<void> {
    try {
        await Promise.all([import('../values'), import('../labels')]);

        // 检查是否所有资源都已加载
        if (resourceCache.isAllResourcesLoaded()) {
            console.log('All game resources are already loaded, skipping initialization');
            return;
        }

        console.log('Initializing game...');

        // 1. 加载角色（需要认证）
        // loadCharactersFromAPI 内部已经检查缓存并标记，这里直接调用即可
        await loadCharactersFromAPI();

        // 2. 初始化 IndexedDB（用于游戏存档）
        // initializeIndexedDB 内部已经检查缓存并标记，这里直接调用即可
        await initializeIndexedDB();

        // 3. 加载资源 manifest（可能需要认证）
        // defineAssets 内部已经检查缓存并标记，这里直接调用即可
        await defineAssets();

        // 4. 初始化 i18n（同步调用）
        // initI18n 内部已经有检查，但我们也检查缓存以确保标记
        if (!resourceCache.isI18nInitialized()) {
            initI18n();
            resourceCache.markI18nInitialized();
        }

        // 5. 导入所有 ink labels
        // importAllInkLabels 内部已经检查缓存并标记，这里直接调用即可
        await importAllInkLabels();

        console.log('Game initialization completed successfully');
    } catch (error) {
        console.error('Game initialization failed:', error);
        // 初始化失败时，可以选择清除缓存状态，允许下次重试
        // resourceCache.clearCache();
        throw error;
    }
}

/**
 * 强制重新初始化所有资源（清除缓存）
 * 用于开发调试或资源更新后
 */
export async function reinitializeGame(): Promise<void> {
    resourceCache.clearCache();
    return initializeGame();
}
