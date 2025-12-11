import i18n from 'i18next';

/**
 * 资源缓存状态管理
 * 页面刷新后，所有资源都会重新加载（不使用缓存）
 */
class ResourceCacheManager {
    /**
     * 检查角色是否已加载
     * 页面刷新后总是返回 false，强制重新加载
     */
    isCharactersLoaded(): boolean {
            return false;
    }

    /**
     * 标记角色已加载
     */
    markCharactersLoaded(): void {
        // 不需要保存状态，页面刷新后会重新加载
    }

    /**
     * 检查 Assets 是否已初始化
     * 页面刷新后总是返回 false，强制重新加载
     */
    isAssetsInitialized(): boolean {
        return false;
    }

    /**
     * 标记 Assets 已初始化
     */
    markAssetsInitialized(): void {
        // 不需要保存状态，页面刷新后会重新加载
    }

    /**
     * 检查指定的 bundle 是否已加载
     * 页面刷新后总是返回 false，强制重新加载
     */
    isBundleLoaded(_bundleName: string): boolean {
        return false;
    }

    /**
     * 标记 bundle 已加载
     */
    markBundleLoaded(_bundleName: string): void {
        // 不需要保存状态，页面刷新后会重新加载
    }

    /**
     * 检查 i18n 是否已初始化
     */
    isI18nInitialized(): boolean {
        return i18n.isInitialized;
    }

    /**
     * 标记 i18n 已初始化
     */
    markI18nInitialized(): void {
        // i18n 有自己的初始化状态，不需要额外标记
    }

    /**
     * 检查 ink labels 是否已导入
     * 页面刷新后总是返回 false，强制重新导入
     */
    isInkLabelsImported(): boolean {
        return false;
    }

    /**
     * 标记 ink labels 已导入
     */
    markInkLabelsImported(): void {
        // 不需要保存状态，页面刷新后会重新导入
    }

    /**
     * 检查所有资源是否已加载
     */
    isAllResourcesLoaded(): boolean {
        return false;
    }

    /**
     * 清除所有缓存状态（用于强制重新加载）
     */
    clearCache(): void {
        // 不需要清除，因为页面刷新后总是重新加载
    }

    /**
     * 清除指定 bundle 的缓存
     */
    clearBundleCache(_bundleName: string): void {
        // 不需要清除，因为页面刷新后总是重新加载
    }
}

// 导出单例实例
export const resourceCache = new ResourceCacheManager();
