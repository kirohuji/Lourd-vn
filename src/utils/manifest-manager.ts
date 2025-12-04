import { AssetsManifest } from '@drincs/pixi-vn';
import { cosUtility } from './cos-utility';
import { calculateFileMD5, generateCosKey } from './file-hash-utility';
import {
    ResourceRecord,
    deleteResource,
    getAllResources,
    getResourceByAlias,
    getResourceByHash,
    putResource,
} from './indexedDB-utility';

/**
 * Manifest 管理工具
 */
export class ManifestManager {
    /**
     * 从 IndexedDB 读取资源并生成 manifest 结构
     * @param baseManifest 基础 manifest（可选）
     * @returns 合并后的 manifest
     */
    async generateManifestFromIndexedDB(baseManifest?: AssetsManifest): Promise<AssetsManifest> {
        try {
            // 从 IndexedDB 获取所有资源
            const resources = await getAllResources({
                order: { field: 'bundle', direction: 'next' },
            });

            // 按 bundle 分组
            const bundleMap = new Map<string, ResourceRecord[]>();
            resources.forEach(resource => {
                if (!bundleMap.has(resource.bundle)) {
                    bundleMap.set(resource.bundle, []);
                }
                bundleMap.get(resource.bundle)!.push(resource);
            });

            // 生成 bundles 数组
            const bundles: Array<{
                name: string;
                assets: Array<{
                    alias: string;
                    src: string;
                }>;
            }> = [];

            // 添加基础 manifest 的 bundles（如果提供）
            if (baseManifest?.bundles) {
                baseManifest.bundles.forEach(bundle => {
                    // 确保 assets 是数组
                    const assetsArray = Array.isArray(bundle.assets) ? bundle.assets : [];
                    // 转换 UnresolvedAsset 到 { alias: string; src: string }
                    const convertedAssets = assetsArray
                        .map(asset => {
                            // 处理 src，确保是字符串
                            let src = '';
                            const assetSrc = asset.src as any; // 使用类型断言

                            if (typeof assetSrc === 'string') {
                                src = assetSrc;
                            } else if (Array.isArray(assetSrc)) {
                                src = assetSrc[0] || '';
                            } else if (assetSrc && typeof assetSrc === 'object') {
                                // 处理 ResolvedSrc 类型（对象）
                                // 尝试获取字符串表示
                                src = String(assetSrc);
                            }
                            return {
                                alias: typeof asset.alias === 'string' ? asset.alias : '',
                                src: src,
                            };
                        })
                        .filter(asset => asset.alias && asset.src); // 过滤掉无效的资产

                    bundles.push({
                        name: bundle.name,
                        assets: convertedAssets as Array<{ alias: string; src: string }>,
                    });
                });
            }

            // 添加 IndexedDB 资源的 bundles
            bundleMap.forEach((resources, bundleName) => {
                // 检查是否已存在同名 bundle
                const existingBundleIndex = bundles.findIndex(b => b.name === bundleName);

                if (existingBundleIndex >= 0) {
                    // 合并到现有 bundle
                    const existingAssets = bundles[existingBundleIndex].assets;
                    const newAssets = resources.map(resource => ({
                        alias: resource.alias,
                        src: resource.src,
                    }));

                    // 避免重复的 alias
                    const existingAliases = new Set(existingAssets.map(asset => asset.alias));
                    newAssets.forEach(asset => {
                        if (!existingAliases.has(asset.alias)) {
                            existingAssets.push(asset);
                        }
                    });
                } else {
                    // 创建新 bundle
                    bundles.push({
                        name: bundleName,
                        assets: resources.map(resource => ({
                            alias: resource.alias,
                            src: resource.src,
                        })),
                    });
                }
            });

            return { bundles };
        } catch (error) {
            console.error('从 IndexedDB 生成 manifest 失败:', error);
            return baseManifest || { bundles: [] };
        }
    }

    /**
     * 上传文件并添加到 IndexedDB
     * @param file 要上传的文件
     * @param bundle 目标 bundle 名称
     * @param alias 资源别名（可选，默认使用文件名）
     * @param onProgress 上传进度回调
     * @returns Promise<ResourceRecord> 添加的资源记录
     */
    async uploadAndAddResource(
        file: File,
        bundle: string,
        alias?: string,
        onProgress?: (progress: { percent: number; speed: number }) => void,
    ): Promise<ResourceRecord> {
        try {
            // 计算文件哈希
            const hash = await calculateFileMD5(file);

            // 检查是否已存在相同哈希的文件
            const existingResource = await getResourceByHash(hash);
            if (existingResource) {
                throw new Error(`文件已存在: ${existingResource.originalName || existingResource.alias}`);
            }

            // 检查别名是否已存在
            const resourceAlias = alias || file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名
            const existingByAlias = await getResourceByAlias(resourceAlias);
            if (existingByAlias) {
                throw new Error(`别名 "${resourceAlias}" 已存在`);
            }

            // 生成 COS Key
            const cosKey = generateCosKey(hash, file.name);

            // 上传到 COS
            const fileUrl = await cosUtility.uploadFile(file, cosKey, onProgress);

            // 创建资源记录
            const resource: ResourceRecord = {
                alias: resourceAlias,
                src: fileUrl,
                bundle,
                hash,
                uploadDate: new Date(),
                fileSize: file.size,
                cosKey,
                originalName: file.name,
                fileType: file.type || file.name.split('.').pop()?.toLowerCase(),
            };

            // 保存到 IndexedDB
            const savedResource = await putResource(resource);
            return savedResource;
        } catch (error) {
            console.error('上传并添加资源失败:', error);
            throw error;
        }
    }

    /**
     * 删除资源（从 IndexedDB 和 COS）
     * @param resourceId 资源 ID
     * @returns Promise<void>
     */
    async deleteResource(resourceId: number): Promise<void> {
        try {
            // 获取资源记录
            const resources = await getAllResources();
            const resource = resources.find(r => r.id === resourceId);

            if (!resource) {
                throw new Error(`资源 ID ${resourceId} 不存在`);
            }

            // 从 COS 删除文件（如果存在 cosKey）
            if (resource.cosKey) {
                try {
                    await cosUtility.deleteFile(resource.cosKey);
                } catch (cosError) {
                    console.warn(`从 COS 删除文件失败: ${cosError}`);
                    // 继续删除 IndexedDB 记录
                }
            }

            // 删除 IndexedDB 记录
            await deleteResource(resourceId);
        } catch (error) {
            console.error('删除资源失败:', error);
            throw error;
        }
    }

    /**
     * 获取指定 bundle 的所有资源
     * @param bundle bundle 名称
     * @returns Promise<ResourceRecord[]>
     */
    async getResourcesByBundle(bundle: string): Promise<ResourceRecord[]> {
        const resources = await getAllResources();
        return resources.filter(r => r.bundle === bundle);
    }

    /**
     * 获取所有资源
     * @returns Promise<ResourceRecord[]>
     */
    async getAllResources(): Promise<ResourceRecord[]> {
        return getAllResources({
            order: { field: 'uploadDate', direction: 'prev' },
        });
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

    /**
     * 批量检查资源 URL 有效性
     * @param resources 资源记录数组
     * @returns Promise<Array<{ resource: ResourceRecord; valid: boolean }>>
     */
    async batchCheckResourceUrls(
        resources: ResourceRecord[],
    ): Promise<Array<{ resource: ResourceRecord; valid: boolean }>> {
        const checks = resources.map(async resource => {
            const valid = await this.checkResourceUrl(resource.src);
            return { resource, valid };
        });

        return Promise.all(checks);
    }
}

// 创建单例实例
export const manifestManager = new ManifestManager();
