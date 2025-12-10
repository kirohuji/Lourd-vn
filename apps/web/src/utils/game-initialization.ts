import { initI18n } from '../i18n';
import { defineAssets } from './assets-utility';
import { loadCharactersFromAPI } from './characters-utility';
import { initializeIndexedDB } from './indexedDB-utility';
import { importAllInkLabels } from './ink-utility';
import { resourceCache } from './resource-cache';

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (status: string, progress: number) => void;

/**
 * 游戏初始化函数
 * 包含所有资源加载逻辑，应该在用户登录后调用
 * 会检查资源是否已加载，避免重复加载
 * 这个函数是幂等的，可以安全地多次调用
 * @param onProgress 可选的进度回调函数，用于更新加载状态和进度
 */
export async function initializeGame(onProgress?: ProgressCallback): Promise<void> {
    try {
        // 步骤 1: 正在加载核心资源… (0% → 25%)
        onProgress?.('正在加载核心资源…', 0);
        await Promise.all([import('../values'), import('../labels')]);
        onProgress?.('正在加载核心资源…', 12);

        // 页面刷新后总是重新加载所有资源，不检查缓存

        console.log('Initializing game...');

        // 步骤 1 继续: 加载资源 manifest（可能需要认证）
        // defineAssets 内部已经检查缓存并标记，这里直接调用即可
        await defineAssets();
        onProgress?.('正在加载核心资源…', 25);

        // 步骤 2: 正在准备角色与立绘… (25% → 45%)
        onProgress?.('正在准备角色与立绘…', 25);
        // loadCharactersFromAPI 内部已经检查缓存并标记，这里直接调用即可
        await loadCharactersFromAPI();
        onProgress?.('正在准备角色与立绘…', 45);

        // 步骤 3: 正在初始化场景与背景… (45% → 65%)
        onProgress?.('正在初始化场景与背景…', 45);
        // 场景与背景资源在 defineAssets 中已加载，这里主要是验证和初始化 i18n
        // initI18n 内部已经有检查，但我们也检查缓存以确保标记
        if (!resourceCache.isI18nInitialized()) {
            initI18n();
            resourceCache.markI18nInitialized();
        }
        onProgress?.('正在初始化场景与背景…', 65);

        // 步骤 4: 正在载入剧情数据… (65% → 85%)
        onProgress?.('正在载入剧情数据…', 65);
        // importAllInkLabels 内部已经检查缓存并标记，这里直接调用即可
        await importAllInkLabels();
        onProgress?.('正在载入剧情数据…', 85);

        // 步骤 5: 正在校验存档信息… (85% → 100%)
        onProgress?.('正在校验存档信息…', 85);
        // initializeIndexedDB 内部已经检查缓存并标记，这里直接调用即可
        await initializeIndexedDB();
        onProgress?.('正在校验存档信息…', 100);

        // 完成
        onProgress?.('初始化完毕，正在进入故事世界…', 100);

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
 * @param onProgress 可选的进度回调函数，用于更新加载状态和进度
 */
export async function reinitializeGame(onProgress?: ProgressCallback): Promise<void> {
    resourceCache.clearCache();
    return initializeGame(onProgress);
}
