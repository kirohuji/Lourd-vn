import { AssetsManifest } from '@drincs/pixi-vn';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * 检测 URL 是否是腾讯云 COS 格式
 * @param url 要检测的 URL
 * @returns 是否是 COS URL
 */
function isCosUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // 检测腾讯云 COS 的常见域名格式：
        // 1. bucket.cos.region.myqcloud.com
        // 2. bucket.cos-region.myqcloud.com
        // 3. 自定义域名（通常包含 cos 相关标识）
        if (
            hostname.includes('.cos.') ||
            hostname.includes('.cos-') ||
            hostname.includes('.myqcloud.com') ||
            hostname.includes('qcloud.com')
        ) {
            return true;
        }

        return false;
    } catch (error) {
        // 如果不是有效的 URL，返回 false
        return false;
    }
}

/**
 * 从 URL 中提取文件扩展名
 * @param url 原始 URL
 * @returns 文件扩展名（不含点号）
 */
function getFileExtension(url: string): string {
    try {
        const urlWithoutQuery = url.split('?')[0];
        const parts = urlWithoutQuery.split('.');
        if (parts.length > 1) {
            const ext = parts.pop()?.toLowerCase() || '';
            // 只返回有效的扩展名（1-10个字符，只包含字母和数字）
            if (ext && ext.length <= 10 && /^[a-z0-9]+$/.test(ext)) {
                return ext;
            }
        }
    } catch {
        // 如果解析失败，返回空字符串
    }
    return '';
}

/**
 * 将腾讯云 COS URL 转换为后端代理 URL
 * 通过后端代理可以避免 CORS 问题，特别是 PixiJS Assets 系统加载资源时
 * 在路径中包含文件扩展名，帮助 PixiJS 识别文件类型
 * @param url 原始 URL
 * @returns 代理 URL 或原 URL
 */
function convertCosUrlToProxy(url: string): string {
    if (!url || typeof url !== 'string') {
        return url;
    }

    // 如果是 COS URL，转换为后端代理 URL
    if (isCosUrl(url)) {
        const encodedUrl = encodeURIComponent(url);
        const ext = getFileExtension(url);

        // 如果能够提取到扩展名，将其包含在路径末尾，帮助 PixiJS 识别文件类型
        // 格式：/manifest/proxy/xxx.webp?url=... 这样 PixiJS 可以从 URL 末尾识别文件类型
        if (ext) {
            // 从原始 URL 中提取文件名，如果没有则使用 hash 或随机名称
            try {
                const urlObj = new URL(url);
                const pathname = urlObj.pathname;
                let filename = pathname.split('/').pop() || '';

                // 如果文件名没有扩展名，或者扩展名不匹配，使用原始文件名或生成一个
                if (!filename || !filename.includes('.')) {
                    // 尝试从 URL 的其他部分提取标识符
                    const hashMatch = url.match(/([a-f0-9]{32})/i);
                    filename = hashMatch ? `${hashMatch[1]}.${ext}` : `asset.${ext}`;
                } else if (!filename.endsWith(`.${ext}`)) {
                    // 如果扩展名不匹配，替换为正确的扩展名
                    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
                    filename = `${nameWithoutExt || 'file'}.${ext}`;
                }

                return `${API_BASE_URL}/manifest/proxy/${filename}?url=${encodedUrl}`;
            } catch {
                // 如果 URL 解析失败，使用默认文件名
                return `${API_BASE_URL}/manifest/proxy/asset.${ext}?url=${encodedUrl}`;
            }
        } else {
            // 如果没有扩展名，使用原来的方式
            return `${API_BASE_URL}/manifest/proxy?url=${encodedUrl}`;
        }
    }

    // 非 COS URL 直接返回
    return url;
}

/**
 * 处理单个资源，转换 COS URL 并添加 format 属性
 * @param asset 原始资源对象
 * @returns 处理后的资源对象
 */
function processAsset(asset: any): any {
    const assetSrc = typeof asset.src === 'string' ? asset.src : String(asset.src || '');
    const convertedSrc = convertCosUrlToProxy(assetSrc);
    const ext = getFileExtension(assetSrc);

    const assetObj: any = {
        alias: typeof asset.alias === 'string' ? asset.alias : '',
        src: convertedSrc,
    };

    // 如果是图片格式，添加 format 属性帮助 PixiJS 识别
    if (ext && ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
        assetObj.format = ext === 'jpeg' ? 'jpg' : ext;
    }

    return assetObj;
}

/**
 * 处理 manifest，转换所有 COS URL 为代理 URL
 * @param manifest 原始 manifest
 * @returns 处理后的 manifest
 */
export function processManifest(manifest: AssetsManifest): AssetsManifest {
    if (!manifest || !manifest.bundles) {
        return manifest;
    }

    const processedBundles = manifest.bundles.map((bundle: any) => ({
        name: bundle.name,
        assets: (Array.isArray(bundle.assets) ? bundle.assets : []).map(processAsset),
    }));

    return {
        bundles: processedBundles,
    };
}

