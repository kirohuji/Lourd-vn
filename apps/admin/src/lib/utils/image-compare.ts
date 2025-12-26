import pixelmatch from 'pixelmatch';

export interface ImageCompareResult {
    diffImageData: ImageData;
    numDiffPixels: number;
    totalPixels: number;
    diffPercentage: number;
    width: number;
    height: number;
}

/**
 * 将图片文件加载为 Image 对象
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target?.result) {
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result as string;
            } else {
                reject(new Error('Failed to read file'));
            }
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 将 Image 对象转换为 ImageData
 */
export function imageToImageData(
    img: HTMLImageElement,
    width: number,
    height: number,
): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    ctx.drawImage(img, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
}

/**
 * 将 ImageData 转换为 base64 图片 URL
 */
export function imageDataToDataURL(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

/**
 * 比较两张图片
 */
export async function compareImages(
    file1: File,
    file2: File,
    options?: {
        threshold?: number;
        includeAA?: boolean;
        alpha?: number;
        diffColor?: [number, number, number];
        diffColorAlt?: [number, number, number];
    },
): Promise<ImageCompareResult> {
    // 加载两张图片
    const img1 = await loadImageFromFile(file1);
    const img2 = await loadImageFromFile(file2);

    // 使用较大的尺寸作为比较尺寸
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    // 转换为 ImageData
    const img1Data = imageToImageData(img1, width, height);
    const img2Data = imageToImageData(img2, width, height);

    // 创建差异图数据（使用 Uint8ClampedArray，因为 ImageData 需要这个类型）
    const diff = new Uint8ClampedArray(width * height * 4);

    // 执行比较
    const numDiffPixels = pixelmatch(
        img1Data.data,
        img2Data.data,
        diff,
        width,
        height,
        {
            threshold: options?.threshold ?? 0.1,
            includeAA: options?.includeAA ?? false,
            alpha: options?.alpha ?? 0.1,
            diffColor: options?.diffColor ?? [255, 0, 0],
            diffColorAlt: options?.diffColorAlt ?? [0, 255, 0],
        },
    );

    // 创建差异图的 ImageData
    const diffImageData = new ImageData(diff, width, height);

    // 计算统计信息
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    return {
        diffImageData,
        numDiffPixels,
        totalPixels,
        diffPercentage,
        width,
        height,
    };
}

/**
 * 从差异图中提取指定颜色的差异，并从原图中提取对应位置的像素
 * @param diffImageData 差异图的 ImageData
 * @param sourceImageData 原图的 ImageData（用于提取实际像素）
 * @param targetColor RGB 颜色值，如 [0, 255, 0] 表示绿色
 * @param tolerance 颜色容差，默认 5（允许 ±5 的颜色偏差）
 * @returns 提取后的 ImageData，只包含匹配颜色的位置的原图像素，其他像素为透明
 */
export function extractColorDiff(
    diffImageData: ImageData,
    sourceImageData: ImageData,
    targetColor: [number, number, number],
    tolerance: number = 5,
): ImageData {
    const { width, height, data: diffData } = diffImageData;
    const { data: sourceData } = sourceImageData;
    const result = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < diffData.length; i += 4) {
        const r = diffData[i];
        const g = diffData[i + 1];
        const b = diffData[i + 2];

        // 检查是否匹配目标颜色（考虑容差）
        const match =
            Math.abs(r - targetColor[0]) <= tolerance &&
            Math.abs(g - targetColor[1]) <= tolerance &&
            Math.abs(b - targetColor[2]) <= tolerance;

        if (match) {
            // 从原图中提取对应位置的像素
            result[i] = sourceData[i];
            result[i + 1] = sourceData[i + 1];
            result[i + 2] = sourceData[i + 2];
            result[i + 3] = sourceData[i + 3];
        } else {
            // 设置为透明
            result[i] = 0;
            result[i + 1] = 0;
            result[i + 2] = 0;
            result[i + 3] = 0;
        }
    }

    return new ImageData(result, width, height);
}

/**
 * 下载 ImageData 为图片文件
 * @param imageData 要下载的 ImageData
 * @param filename 文件名，默认为 'image.png'
 */
export function downloadImageData(imageData: ImageData, filename: string = 'image.png'): void {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    ctx.putImageData(imageData, 0, 0);

    canvas.toBlob(
        blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        'image/png',
    );
}

