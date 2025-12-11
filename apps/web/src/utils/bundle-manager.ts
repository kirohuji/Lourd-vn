import JSZip from 'jszip';
import { getProjectId } from './project-config';

const STORAGE_KEY_PREFIX = 'bundle_version_';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * 规范化路径，去除多余的斜杠
 * @param path 原始路径
 * @returns 规范化后的路径
 */
export function normalizePath(path: string): string {
    return path
        .replace(/\/+/g, '/') // 将多个斜杠替换为单个斜杠
        .replace(/^\/+/, '') // 去除开头的斜杠
        .replace(/\/+$/, ''); // 去除结尾的斜杠
}

/**
 * 将 COS URL 转换为后端代理 URL（避免 CORS 问题）
 */
function convertToProxyUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // 检查是否是 COS URL
        if (
            urlObj.hostname.includes('.cos.') ||
            urlObj.hostname.includes('.cos-') ||
            urlObj.hostname.includes('.myqcloud.com') ||
            urlObj.hostname.includes('qcloud.com')
        ) {
            // 使用后端代理
            const encodedUrl = encodeURIComponent(url);
            return `${API_BASE_URL}/manifest/proxy/bundle.zip?url=${encodedUrl}`;
        }
        // 非 COS URL 直接返回
        return url;
    } catch {
        // URL 解析失败，尝试使用代理
        const encodedUrl = encodeURIComponent(url);
        return `${API_BASE_URL}/manifest/proxy/bundle.zip?url=${encodedUrl}`;
    }
}

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
 * 检查是否在浏览器环境（没有文件系统 API）
 */
function isBrowserEnvironment(): boolean {
    return detectFileSystem() === null;
}

/**
 * 使用 IndexedDB 存储文件（浏览器环境降级方案）
 */
const BUNDLE_STORE_NAME = 'bundle_files';

async function initBundleIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BundleStorage', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(BUNDLE_STORE_NAME)) {
                db.createObjectStore(BUNDLE_STORE_NAME);
            }
        };
    });
}

/**
 * 将文件存储到 IndexedDB（浏览器环境）
 */
async function storeFileInIndexedDB(key: string, content: Uint8Array | string): Promise<void> {
    const db = await initBundleIndexedDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BUNDLE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BUNDLE_STORE_NAME);

        // 如果是 Uint8Array，转换为 Blob 存储
        // 确保 Uint8Array 的 buffer 是 ArrayBuffer 类型
        let data: Blob | string;
        if (typeof content === 'string') {
            data = content;
        } else {
            // 创建一个新的 ArrayBuffer 来避免类型问题
            const buffer = new ArrayBuffer(content.byteLength);
            const view = new Uint8Array(buffer);
            view.set(content);
            data = new Blob([buffer]);
        }
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 从 IndexedDB 读取文件（浏览器环境）
 */
async function getFileFromIndexedDB(key: string): Promise<Blob | null> {
    try {
        const db = await initBundleIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([BUNDLE_STORE_NAME], 'readonly');
            const store = transaction.objectStore(BUNDLE_STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error reading file from IndexedDB:', error);
        return null;
    }
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

        // 将 COS URL 转换为后端代理 URL（避免 CORS 问题）
        const proxyUrl = convertToProxyUrl(zipUrl);
        console.log(`Using proxy URL: ${proxyUrl}`);

        // 通过后端代理下载 ZIP 文件
        const response = await fetch(proxyUrl, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Failed to download bundle: ${response.status} ${response.statusText}`);
        }

        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        // 获取项目 ID（用于生成 key）
        const projectId = await getProjectId(); // 需要导入这个函数
        // 检查环境：浏览器环境使用 IndexedDB，否则使用文件系统
        if (isBrowserEnvironment()) {
            console.log('Browser environment detected, using IndexedDB for storage');
            // 浏览器环境：使用 IndexedDB 存储
            const filePromises: Promise<void>[] = [];

            zip.forEach((relativePath, file) => {
                if (!file.dir) {
                    // 使用 projectId + relativePath 作为 key
                    // relativePath 就是 manifest.json 中的 src 格式
                    const fileKey = `${projectId}_${relativePath}`;
                    const filePromise = file
                        .async('uint8array')
                        .then(content => storeFileInIndexedDB(fileKey, content));
                    filePromises.push(filePromise);
                }
            });

            await Promise.all(filePromises);
        } else {
            // 文件系统环境：使用文件系统 API
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
                    const filePromise = file.async('uint8array').then(content => {
                        // 确保父目录存在
                        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
                        return ensureDirectory(parentDir, fs).then(() => writeFileToFS(filePath, content, fs));
                    });
                    filePromises.push(filePromise);
                }
            });

            await Promise.all(filePromises);
        }

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
 * 获取资源包的本地路径或 Blob URL
 * 现在直接使用 projectId + src 作为 key
 */
export async function getBundleLocalPath(
    bundleType: 'common' | 'chapter',
    id: number,
    relativePath: string, // 这个就是 manifest 中的 src
): Promise<string> {
    if (isBrowserEnvironment()) {
        // 获取项目 ID
        const projectId = await getProjectId();
        // 规范化路径，确保与 IndexedDB 中的 key 格式一致
        const normalizedPath = normalizePath(relativePath);
        const fileKey = `${projectId}_${normalizedPath}`;
        const blob = await getFileFromIndexedDB(fileKey);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return '';
    } else {
        // 文件系统环境：返回文件路径
        const bundlePath = getBundlePath(bundleType, id);
        return `${bundlePath}/${relativePath}`;
    }
}

/**
 * 检查资源包文件是否存在
 */
export async function bundleFileExists(
    bundleType: 'common' | 'chapter',
    id: number,
    relativePath: string, // 这个就是 manifest 中的 src
): Promise<boolean> {
    if (isBrowserEnvironment()) {
        const projectId = await getProjectId();
        // 规范化路径，确保与 IndexedDB 中的 key 格式一致
        const normalizedPath = normalizePath(relativePath);
        const fileKey = `${projectId}_${normalizedPath}`;
        const blob = await getFileFromIndexedDB(fileKey);
        return blob !== null;
    } else {
        // 文件系统环境：检查文件是否存在
        const fs = detectFileSystem();
        if (!fs) {
            return false;
        }
        const bundlePath = getBundlePath(bundleType, id);
        const filePath = `${bundlePath}/${relativePath}`;
        try {
            if (fs.exists) {
                return await fs.exists(filePath);
            }
            return false;
        } catch {
            return false;
        }
    }
}
