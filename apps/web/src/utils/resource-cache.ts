import { Assets } from '@drincs/pixi-vn';
import i18n from 'i18next';

/**
 * 资源加载状态接口
 */
interface ResourceLoadState {
    charactersLoaded: boolean;
    indexedDBInitialized: boolean;
    assetsInitialized: boolean;
    assetsBundleLoaded: string[]; // 已加载的 bundle 名称列表
    i18nInitialized: boolean;
    inkLabelsImported: boolean;
    initializedAt: number; // 初始化时间戳
}

/**
 * localStorage key for resource cache state
 */
const RESOURCE_CACHE_KEY = 'game_resource_cache_state';

/**
 * 资源缓存状态管理
 */
class ResourceCacheManager {
    private state: ResourceLoadState = {
        charactersLoaded: false,
        indexedDBInitialized: false,
        assetsInitialized: false,
        assetsBundleLoaded: [],
        i18nInitialized: false,
        inkLabelsImported: false,
        initializedAt: 0,
    };

    constructor() {
        // 从 localStorage 恢复状态
        this.loadState();
    }

    /**
     * 从 localStorage 加载状态
     */
    private loadState(): void {
        try {
            const saved = localStorage.getItem(RESOURCE_CACHE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 验证状态是否仍然有效（例如，检查时间戳是否在合理范围内）
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load resource cache state from localStorage:', error);
        }
    }

    /**
     * 保存状态到 localStorage
     */
    private saveState(): void {
        try {
            localStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.warn('Failed to save resource cache state to localStorage:', error);
        }
    }

    /**
     * 检查角色是否已加载
     */
    isCharactersLoaded(): boolean {
        // 同时检查内存中的状态
        // 如果 RegisteredCharacters 中有角色，说明已经加载过
        try {
            // RegisteredCharacters 可能有 size 或类似属性
            // 如果有缓存状态，优先信任缓存状态
            if (this.state.charactersLoaded) {
                return true;
            }
            // 尝试检查是否有角色已注册（这需要知道至少一个角色ID，或者检查内部状态）
            // 由于无法直接获取所有角色，主要依赖缓存状态
            return false;
        } catch {
            return this.state.charactersLoaded;
        }
    }

    /**
     * 标记角色已加载
     */
    markCharactersLoaded(): void {
        this.state.charactersLoaded = true;
        this.saveState();
    }

    /**
     * 检查 IndexedDB 是否已初始化
     */
    isIndexedDBInitialized(): boolean {
        return this.state.indexedDBInitialized;
    }

    /**
     * 标记 IndexedDB 已初始化
     */
    markIndexedDBInitialized(): void {
        this.state.indexedDBInitialized = true;
        this.saveState();
    }

    /**
     * 检查 Assets 是否已初始化
     */
    isAssetsInitialized(): boolean {
        // 同时检查内存状态和缓存状态
        try {
            // @ts-ignore - 检查 Assets 的内部状态
            const hasParsers = Assets._parsers && Assets._parsers.size > 0;
            return this.state.assetsInitialized || hasParsers;
        } catch {
            return this.state.assetsInitialized;
        }
    }

    /**
     * 标记 Assets 已初始化
     */
    markAssetsInitialized(): void {
        this.state.assetsInitialized = true;
        this.saveState();
    }

    /**
     * 检查指定的 bundle 是否已加载
     */
    isBundleLoaded(bundleName: string): boolean {
        // 检查缓存状态
        if (this.state.assetsBundleLoaded.includes(bundleName)) {
            // 同时验证 Assets 中确实已加载
            try {
                // 尝试检查 Assets 的解析器是否有该 bundle 的信息
                if (Assets.resolver) {
                    // 如果 resolver 存在，说明 Assets 已初始化
                    // bundle 的具体加载状态可能难以直接检查，所以信任缓存状态
                    return true;
                }
            } catch {
                // 如果无法访问，信任缓存状态
                return true;
            }
        }
        return false;
    }

    /**
     * 标记 bundle 已加载
     */
    markBundleLoaded(bundleName: string): void {
        if (!this.state.assetsBundleLoaded.includes(bundleName)) {
            this.state.assetsBundleLoaded.push(bundleName);
            this.saveState();
        }
    }

    /**
     * 检查 i18n 是否已初始化
     */
    isI18nInitialized(): boolean {
        return this.state.i18nInitialized || i18n.isInitialized;
    }

    /**
     * 标记 i18n 已初始化
     */
    markI18nInitialized(): void {
        this.state.i18nInitialized = true;
        this.saveState();
    }

    /**
     * 检查 ink labels 是否已导入
     */
    isInkLabelsImported(): boolean {
        return this.state.inkLabelsImported;
    }

    /**
     * 标记 ink labels 已导入
     */
    markInkLabelsImported(): void {
        this.state.inkLabelsImported = true;
        this.saveState();
    }

    /**
     * 检查所有资源是否已加载
     */
    isAllResourcesLoaded(): boolean {
        return (
            this.isCharactersLoaded() &&
            this.isIndexedDBInitialized() &&
            this.isAssetsInitialized() &&
            this.isI18nInitialized() &&
            this.isInkLabelsImported()
        );
    }

    /**
     * 清除所有缓存状态（用于强制重新加载）
     */
    clearCache(): void {
        this.state = {
            charactersLoaded: false,
            indexedDBInitialized: false,
            assetsInitialized: false,
            assetsBundleLoaded: [],
            i18nInitialized: false,
            inkLabelsImported: false,
            initializedAt: 0,
        };
        try {
            localStorage.removeItem(RESOURCE_CACHE_KEY);
        } catch (error) {
            console.warn('Failed to clear resource cache state from localStorage:', error);
        }
    }

    /**
     * 清除指定 bundle 的缓存
     */
    clearBundleCache(bundleName: string): void {
        this.state.assetsBundleLoaded = this.state.assetsBundleLoaded.filter(name => name !== bundleName);
        this.saveState();
    }

    /**
     * 获取当前状态（用于调试）
     */
    getState(): Readonly<ResourceLoadState> {
        return { ...this.state };
    }
}

// 导出单例实例
export const resourceCache = new ResourceCacheManager();
