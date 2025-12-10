import { initI18n } from '../i18n';
import { defineAssets } from './assets-utility';
import { loadCharactersFromAPI } from './characters-utility';
import { initializeIndexedDB } from './indexedDB-utility';
import { importAllInkLabels } from './ink-utility';

/**
 * 游戏初始化函数
 * 包含所有资源加载逻辑，应该在用户登录后调用
 * 每次调用都会重新初始化，不做任何缓存
 * 这个函数是幂等的，可以安全地多次调用
 */
export async function initializeGame(): Promise<void> {
    try {
        await Promise.all([import('../values'), import('../labels')]);
        console.log('Initializing game...');

        // 1. 加载角色（需要认证）
        await loadCharactersFromAPI();

        // 2. 初始化 IndexedDB（用于游戏存档）
        await initializeIndexedDB();

        // 3. 加载资源 manifest（可能需要认证）
        await defineAssets();

        // 4. 初始化 i18n（同步调用）
        initI18n();

        // 5. 导入所有 ink labels
        await importAllInkLabels();

        console.log('Game initialization completed successfully');
    } catch (error) {
        console.error('Game initialization failed:', error);
        throw error;
    }
}
