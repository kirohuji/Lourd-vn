import * as crypto from 'crypto-js';

/**
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.json',
  '.txt',
  '.mp3',
  '.ogg',
  '.wav',
  '.mp4',
  '.webm',
];

/**
 * 最大文件大小（100MB）
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * 计算文件的 MD5 哈希值
 */
export function calculateFileMD5(file: Buffer): string {
  const hash = crypto.MD5(crypto.lib.WordArray.create(file));
  return hash.toString(crypto.enc.Hex);
}

/**
 * 生成 COS Key
 */
export function generateCosKey(hash: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return `files/${hash}.${ext}`;
}

/**
 * 验证文件
 */
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: Express.Multer.File,
  options: FileValidationOptions = {},
): FileValidationResult {
  const { maxSize = 100 * 1024 * 1024, allowedTypes = [] } = options;

  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超过限制 (${maxSize / 1024 / 1024}MB)`,
    };
  }

  // 检查文件类型
  if (allowedTypes.length > 0) {
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${ext}`,
      };
    }
  }

  return { valid: true };
}
