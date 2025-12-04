/**
 * 文件哈希工具 - 用于计算文件的 MD5 哈希值，用于文件去重检查
 */

/**
 * 计算文件的 MD5 哈希值
 * @param file 要计算哈希的文件
 * @returns Promise<string> 文件的 MD5 哈希值（十六进制字符串）
 */
export async function calculateFileMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async event => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const hashBuffer = await crypto.subtle.digest('MD5', arrayBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (error) {
                reject(new Error(`计算文件哈希失败: ${error}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('读取文件失败'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * 计算文件的 SHA-256 哈希值
 * @param file 要计算哈希的文件
 * @returns Promise<string> 文件的 SHA-256 哈希值（十六进制字符串）
 */
export async function calculateFileSHA256(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async event => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (error) {
                reject(new Error(`计算文件哈希失败: ${error}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('读取文件失败'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * 获取文件的扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写，不带点）
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 生成 COS 文件 Key
 * @param hash 文件哈希值
 * @param filename 原始文件名
 * @returns COS 文件 Key（格式：files/{hash}.{ext}）
 */
export function generateCosKey(hash: string, filename: string): string {
    const ext = getFileExtension(filename);
    return `files/${hash}${ext ? '.' + ext : ''}`;
}

/**
 * 检查文件是否支持（基于文件类型和大小）
 * @param file 要检查的文件
 * @param options 检查选项
 * @returns 检查结果
 */
export function validateFile(
    file: File,
    options: {
        maxSize?: number; // 最大文件大小（字节）
        allowedTypes?: string[]; // 允许的文件类型
    } = {},
): { valid: boolean; error?: string } {
    const { maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options; // 默认 50MB

    // 检查文件大小
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `文件大小超过限制（最大 ${Math.round(maxSize / 1024 / 1024)}MB）`,
        };
    }

    // 检查文件类型
    if (allowedTypes.length > 0) {
        const isAllowed = allowedTypes.some(type => {
            if (type.startsWith('.')) {
                // 扩展名检查
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            } else {
                // MIME 类型检查
                return file.type.startsWith(type);
            }
        });

        if (!isAllowed) {
            return {
                valid: false,
                error: `不支持的文件类型。支持的类型：${allowedTypes.join(', ')}`,
            };
        }
    }

    return { valid: true };
}
