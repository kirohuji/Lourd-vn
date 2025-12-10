interface FileValidationOptions {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // file extensions
}

interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateFile(file: File, options: FileValidationOptions): ValidationResult {
    const { maxSize = 100 * 1024 * 1024, allowedTypes = [] } = options;

    if (maxSize && file.size > maxSize) {
        return {
            valid: false,
            error: `文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
        };
    }

    if (allowedTypes.length > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return {
                valid: false,
                error: `不支持的文件类型: ${ext}`,
            };
        }
    }

    return { valid: true };
}

