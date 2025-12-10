import JSZip from 'jszip';

const STORAGE_KEY_PREFIX = 'bundle_version_';

/**
 * 获取本地资源包版本号
 */
export function getLocalBundleVersion(bundleType: 'common' | 'chapter', id: number): number | null {
    try {
        const key = `${STORAGE_KEY_PREFIX}${bundleType}_${id}`;
        const version = localStorage.getItem(key);
        return version ? Number.parseInt(version, 10) : null;
    } catch {
        return null;
    }
}

/**
 * 保存本地资源包版本号
 */
function setLocalBundleVersion(bundleType: 'common' | 'chapter', id: number, version: number): void {
    try {
        const key = `${STORAGE_KEY_PREFIX}${bundleType}_${id}`;
        localStorage.setItem(key, version.toString());
    } catch (error) {
        console.error('Failed to save bundle version:', error);
    }
}

/**
 * 检查资源包是否需要更新
 */
export function checkBundleUpdate(remoteVersion: number, localVersion: number | null): boolean {
    if (localVersion === null) {
        return true; // 本地没有版本，需要下载
    }
    return remoteVersion > localVersion; // 远程版本更高，需要更新
}

/**
 * 获取资源包存储路径
 */
function getBundlePath(bundleType: 'common' | 'chapter', id: number): string {
    return `bundles/${bundleType}/${id}`;
}

/**
 * 检测可用的文件系统 API
 */
function detectFileSystem(): any {
    // 检测 Tauri
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        return (window as any).__TAURI__.fs;
    }

    // 检测 Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Filesystem } = (window as any).Capacitor.Plugins;
        if (Filesystem) {
            return Filesystem;
        }
    }

    return null;
}

/**
 * 确保目录存在
 */
async function ensureDirectory(path: string, fs: any): Promise<void> {
    if (!fs) {
        return;
    }

    try {
        // Tauri
        if (fs.exists) {
            const exists = await fs.exists(path);
            if (!exists) {
                await fs.createDir(path, { recursive: true });
            }
            return;
        }

        // Capacitor
        if (fs.mkdir) {
            try {
                await fs.mkdir({
                    path,
                    recursive: true,
                });
            } catch (error: any) {
                if (!error.message?.includes('already exists')) {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error('Error ensuring directory exists', error);
    }
}

/**
 * 写入文件到文件系统
 */
async function writeFileToFS(filePath: string, content: string | Uint8Array, fs: any): Promise<void> {
    if (!fs) {
        throw new Error('File system API not available');
    }

    try {
        // Tauri
        if (fs.writeTextFile) {
            if (typeof content === 'string') {
                await fs.writeTextFile(filePath, content);
            } else {
                await fs.writeBinaryFile(filePath, content);
            }
            return;
        }

        // Capacitor
        if (fs.writeFile) {
            await fs.writeFile({
                path: filePath,
                data: typeof content === 'string' ? content : btoa(String.fromCharCode(...content)),
                encoding: typeof content === 'string' ? 'utf8' : 'base64',
            });
            return;
        }

        throw new Error('No file system write method available');
    } catch (error) {
        console.error('Error writing file to filesystem', error);
        throw error;
    }
}

/**
 * 下载并解压资源包 ZIP 文件
 */
export async function downloadAndExtractBundle(
    zipUrl: string,
    bundleType: 'common' | 'chapter',
    id: number,
    version: number,
): Promise<void> {
    try {
        console.log(`Downloading bundle: ${bundleType} ${id} (v${version}) from ${zipUrl}`);

        // 下载 ZIP 文件
        const response = await fetch(zipUrl);
        if (!response.ok) {
            throw new Error(`Failed to download bundle: ${response.status} ${response.statusText}`);
        }

        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        // 获取文件系统 API
        const fs = detectFileSystem();
        if (!fs) {
            throw new Error('File system API not available. Cannot extract bundle to local storage.');
        }

        // 获取资源包存储路径
        const bundlePath = getBundlePath(bundleType, id);

        // 确保目录存在
        await ensureDirectory(bundlePath, fs);

        // 解压所有文件
        const filePromises: Promise<void>[] = [];

        zip.forEach((relativePath, file) => {
            if (file.dir) {
                // 创建目录
                const dirPath = `${bundlePath}/${relativePath}`;
                filePromises.push(ensureDirectory(dirPath, fs));
            } else {
                // 提取文件
                const filePath = `${bundlePath}/${relativePath}`;
                const filePromise = file
                    .async('uint8array')
                    .then(content => {
                        // 确保父目录存在
                        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
                        return ensureDirectory(parentDir, fs).then(() => writeFileToFS(filePath, content, fs));
                    });
                filePromises.push(filePromise);
            }
        });

        await Promise.all(filePromises);

        // 保存版本号
        setLocalBundleVersion(bundleType, id, version);

        console.log(`Bundle extracted successfully: ${bundleType} ${id} (v${version})`);
    } catch (error) {
        console.error('Failed to download and extract bundle:', error);
        throw error;
    }
}

/**
 * 检查资源包是否已下载
 */
export function isBundleDownloaded(bundleType: 'common' | 'chapter', id: number): boolean {
    const version = getLocalBundleVersion(bundleType, id);
    return version !== null;
}

/**
 * 获取资源包的本地路径
 */
export function getBundleLocalPath(bundleType: 'common' | 'chapter', id: number, relativePath: string): string {
    const bundlePath = getBundlePath(bundleType, id);
    return `${bundlePath}/${relativePath}`;
}

