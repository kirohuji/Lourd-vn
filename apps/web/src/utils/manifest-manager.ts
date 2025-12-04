import { AssetsManifest } from '@drincs/pixi-vn';
import { apiClient } from './api-client';

/**
 * Manifest 管理工具
 */
export class ManifestManager {
    /**
     * 从后端 API 获取 manifest
     * @param baseManifest 基础 manifest（可选）
     * @returns 合并后的 manifest
     */
    async generateManifestFromAPI(baseManifest?: AssetsManifest): Promise<AssetsManifest> {
        try {
            // 从后端 API 获取 manifest
            const response = await apiClient.getManifest();
            const apiManifest = response.manifest;

            // 如果没有基础 manifest，直接返回 API manifest
            if (!baseManifest?.bundles) {
                return apiManifest;
            }

            // 合并基础 manifest 和 API manifest
            const bundleMap = new Map<string, Array<{ alias: string; src: string }>>();

            // 添加基础 manifest 的 bundles
                baseManifest.bundles.forEach(bundle => {
                    const assetsArray = Array.isArray(bundle.assets) ? bundle.assets : [];
                    const convertedAssets = assetsArray
                        .map(asset => {
                            let src = '';
                        const assetSrc = asset.src as any;

                            if (typeof assetSrc === 'string') {
                                src = assetSrc;
                            } else if (Array.isArray(assetSrc)) {
                                src = assetSrc[0] || '';
                            } else if (assetSrc && typeof assetSrc === 'object') {
                                src = String(assetSrc);
                            }
                            return {
                                alias: typeof asset.alias === 'string' ? asset.alias : '',
                                src: src,
                            };
                        })
                    .filter(asset => asset.alias && asset.src);

                bundleMap.set(bundle.name, convertedAssets as Array<{ alias: string; src: string }>);
                });

            // 合并 API manifest 的 bundles
            if (apiManifest.bundles) {
                apiManifest.bundles.forEach(bundle => {
                    const existingAssets = bundleMap.get(bundle.name) || [];
                    const newAssets = (bundle.assets || []).map(asset => ({
                        alias: typeof asset.alias === 'string' ? asset.alias : '',
                        src: typeof asset.src === 'string' ? asset.src : String(asset.src || ''),
                    }));

                    // 避免重复的 alias
                    const existingAliases = new Set(existingAssets.map(asset => asset.alias));
                    newAssets.forEach(asset => {
                        if (asset.alias && asset.src && !existingAliases.has(asset.alias)) {
                            existingAssets.push(asset);
                        }
                    });

                    bundleMap.set(bundle.name, existingAssets);
                });
            }

            // 生成最终的 bundles 数组
            const bundles = Array.from(bundleMap.entries()).map(([name, assets]) => ({
                name,
                assets,
            }));

            return { bundles };
        } catch (error) {
            console.error('从 API 获取 manifest 失败:', error);
            // 如果 API 调用失败，回退到基础 manifest
            return baseManifest || { bundles: [] };
        }
    }

    /**
     * 导出 manifest 为 JSON 文件
     * @param manifest 要导出的 manifest
     * @param filename 文件名（可选）
     */
    exportManifestToFile(manifest: AssetsManifest, filename: string = 'manifest.json'): void {
        try {
            const jsonStr = JSON.stringify(manifest, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出 manifest 文件失败:', error);
            throw error;
        }
    }

    /**
     * 检查资源 URL 是否有效
     * @param url 资源 URL
     * @returns Promise<boolean> URL 是否有效
     */
    async checkResourceUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 创建单例实例
export const manifestManager = new ManifestManager();
