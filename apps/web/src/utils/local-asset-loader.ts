import { AssetsManifest } from '@drincs/pixi-vn';
import { bundleFileExists, getBundleLocalPath, getLocalBundleVersion, normalizePath } from './bundle-manager';

/**
 * 从本地文件系统加载 manifest.json
 * @param projectId 项目 ID
 * @param bundleType 资源包类型
 * @returns manifest 对象，如果本地没有则返回 null
 */
async function loadManifestJsonFromLocal(
    projectId: number,
    bundleType: 'common' | 'chapter' = 'common',
): Promise<AssetsManifest | null> {
    try {
        const manifestPath = 'manifest.json';
        const manifestUrl = await getBundleLocalPath(bundleType, projectId, manifestPath);

        if (!manifestUrl) {
            return null;
        }

        // 读取 manifest.json
        let manifest: AssetsManifest;
        if (manifestUrl.startsWith('blob:')) {
            // 浏览器环境：从 Blob URL 读取
            const response = await fetch(manifestUrl);
            manifest = await response.json();
        } else {
            // 文件系统环境：使用 fetch 读取（Tauri/Capacitor 可能支持 file:// 协议）
            try {
                const response = await fetch(manifestUrl);
                manifest = await response.json();
            } catch (error) {
                console.error('无法从文件系统读取 manifest:', error);
                return null;
            }
        }

        return manifest;
    } catch (error) {
        console.error('从本地加载 manifest.json 失败:', error);
        return null;
    }
}

/**
 * 将 manifest 中的资源路径替换为本地路径
 * @param manifest 原始 manifest
 * @param projectId 项目 ID
 * @param bundleType 资源包类型
 * @returns 处理后的 manifest
 */
export async function replaceManifestPathsWithLocal(
    manifest: AssetsManifest,
    projectId: number,
    bundleType: 'common' | 'chapter' = 'common',
): Promise<AssetsManifest> {
    if (!manifest.bundles) {
        return manifest;
    }

    const processedBundles = await Promise.all(
        manifest.bundles.map(async bundle => {
            // 确保 assets 是数组
            const assetsArray = Array.isArray(bundle.assets) ? bundle.assets : [];

            const processedAssets = await Promise.all(
                assetsArray.map(async (asset: any) => {
                    const originalSrc = typeof asset.src === 'string' ? asset.src : String(asset.src || '');

                    // manifest 中的 src 格式是 assets/${bundle}/${fileName}
                    // 直接使用这个路径作为相对路径
                    let relativePath = originalSrc;

                    // 如果 src 是完整 URL，尝试提取相对路径
                    if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
                        try {
                            const urlObj = new URL(originalSrc);
                            // 尝试从 URL 路径中提取 assets/ 之后的部分
                            const pathMatch = urlObj.pathname.match(/assets\/(.+)/);
                            if (pathMatch) {
                                relativePath = `assets/${pathMatch[1]}`;
                            } else {
                                // 如果没有 assets/ 前缀，只提取文件名
                                relativePath = urlObj.pathname.split('/').pop() || originalSrc;
                            }
                        } catch {
                            // URL 解析失败，尝试从字符串中提取
                            const pathMatch = originalSrc.match(/assets\/(.+)/);
                            if (pathMatch) {
                                relativePath = `assets/${pathMatch[1]}`;
                            } else {
                                relativePath = originalSrc.replace(/^assets\//, '').replace(/^\/+/, '');
                            }
                        }
                    } else if (!originalSrc.startsWith('assets/')) {
                        // 如果不是 assets/ 开头，也不是完整 URL，可能是相对路径
                        // 尝试添加 assets/ 前缀或直接使用
                        relativePath = originalSrc.startsWith('/') ? originalSrc.substring(1) : originalSrc;
                    }

                    // 规范化路径，去除多余的斜杠（如 assets///file.webp -> assets/file.webp）
                    relativePath = normalizePath(relativePath);

                    // 检查本地文件是否存在
                    const exists = await bundleFileExists(bundleType, projectId, relativePath);
                    if (exists) {
                        const localUrl = await getBundleLocalPath(bundleType, projectId, relativePath);
                        if (localUrl) {
                            // 保留原有的 format 等属性
                            return {
                                ...asset,
                                src: localUrl,
                            };
                        }
                    }

                    // 如果本地文件不存在，保持原路径（将回退到网络加载）
                    return asset;
                }),
            );

            return {
                name: bundle.name,
                assets: processedAssets,
            };
        }),
    );

    return {
        bundles: processedBundles,
    };
}

/**
 * 从本地加载并处理 manifest
 * @param projectId 项目 ID
 * @param chapterId 可选的章节 ID
 * @returns 处理后的 manifest，如果本地没有则返回 null
 */
export async function loadManifestFromLocal(projectId: number, chapterId?: number): Promise<AssetsManifest | null> {
    try {
        // 先尝试加载共通资源包的 manifest
        const commonVersion = getLocalBundleVersion('common', projectId);
        let commonManifest: AssetsManifest | null = null;

        if (commonVersion) {
            commonManifest = await loadManifestJsonFromLocal(projectId, 'common');
            if (commonManifest) {
                commonManifest = await replaceManifestPathsWithLocal(commonManifest, projectId, 'common');
            }
        }

        // 如果有章节 ID，尝试加载章节资源包的 manifest
        let chapterManifest: AssetsManifest | null = null;
        if (chapterId) {
            const chapterVersion = getLocalBundleVersion('chapter', chapterId);
            if (chapterVersion) {
                chapterManifest = await loadManifestJsonFromLocal(chapterId, 'chapter');
                if (chapterManifest) {
                    chapterManifest = await replaceManifestPathsWithLocal(chapterManifest, chapterId, 'chapter');
                }
            }
        }

        // 合并共通和章节 manifest
        if (commonManifest || chapterManifest) {
            const bundles: any[] = [];

            if (commonManifest?.bundles) {
                bundles.push(...commonManifest.bundles);
            }

            if (chapterManifest?.bundles) {
                bundles.push(...chapterManifest.bundles);
            }

            return {
                bundles,
            };
        }

        return null;
    } catch (error) {
        console.error('从本地加载 manifest 失败:', error);
        return null;
    }
}
