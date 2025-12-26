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

