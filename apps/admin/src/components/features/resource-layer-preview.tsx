import { ResourceResponseDto } from '@lourd-game/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ResourceLayerPreviewProps {
    resources: ResourceResponseDto[];
    width?: number;
    height?: number;
}

export function ResourceLayerPreview({ resources, width = 400, height = 400 }: ResourceLayerPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);

    useEffect(() => {
        if (!canvasRef.current || resources.length === 0) {
            setLoading(false);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('无法初始化Canvas上下文');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // 加载所有图片
        const imagePromises = resources.map(
            (resource, index) =>
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        console.log(
                            `[ResourceLayerPreview] 图片加载成功: ${resource.alias} (${index + 1}/${resources.length})`,
                            {
                                alias: resource.alias,
                                src: resource.src,
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                            },
                        );
                        resolve(img);
                    };
                    img.onerror = e => {
                        console.error(`[ResourceLayerPreview] 图片加载失败: ${resource.alias}`, {
                            alias: resource.alias,
                            src: resource.src,
                            error: e,
                        });
                        reject(new Error(`加载图片失败: ${resource.alias} (${resource.src})`));
                    };
                    img.src = resource.src;
                }),
        );

        Promise.all(imagePromises)
            .then(images => {
                console.log(`[ResourceLayerPreview] 所有图片加载完成，共 ${images.length} 张`, {
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height,
                });
                setLoadedImages(images);
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 按顺序绘制所有图片（保持原始尺寸比例，居中绘制）
                images.forEach((img, index) => {
                    const resource = resources[index];
                    // 计算图片在画布中的尺寸（保持宽高比，适应画布）
                    const imgAspect = img.naturalWidth / img.naturalHeight;
                    const canvasAspect = canvas.width / canvas.height;

                    let drawWidth: number;
                    let drawHeight: number;
                    let drawX: number;
                    let drawY: number;

                    if (imgAspect > canvasAspect) {
                        // 图片更宽，以宽度为准
                        drawWidth = canvas.width;
                        drawHeight = canvas.width / imgAspect;
                        drawX = 0;
                        drawY = (canvas.height - drawHeight) / 2;
                    } else {
                        // 图片更高，以高度为准
                        drawWidth = canvas.height * imgAspect;
                        drawHeight = canvas.height;
                        drawX = (canvas.width - drawWidth) / 2;
                        drawY = 0;
                    }

                    console.log(`[ResourceLayerPreview] 绘制图片 ${index + 1}: ${resource.alias}`, {
                        naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
                        drawSize: { width: drawWidth, height: drawHeight },
                        position: { x: drawX, y: drawY },
                    });

                    // 绘制图片
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                });

                setLoading(false);
            })
            .catch(err => {
                console.error('[ResourceLayerPreview] 图片加载错误', err);
                setError(err.message);
                setLoading(false);
            });
    }, [resources, width, height]);

    if (resources.length === 0) {
        return (
            <div className='flex items-center justify-center p-8 text-muted-foreground'>
                <p>暂无资源</p>
            </div>
        );
    }

    return (
        <div className='space-y-2'>
            <div className='text-sm text-muted-foreground'>图层预览（{resources.length} 个资源，按顺序叠加）</div>
            <div className='relative border rounded-lg overflow-hidden bg-muted/30'>
                {loading && (
                    <div className='absolute inset-0 flex items-center justify-center bg-background/80'>
                        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                    </div>
                )}
                {error && (
                    <div className='absolute inset-0 flex items-center justify-center bg-background/80'>
                        <p className='text-sm text-destructive'>{error}</p>
                    </div>
                )}
                <canvas ref={canvasRef} width={width} height={height} className='w-full h-auto' />
            </div>
            <div className='text-xs text-muted-foreground space-y-1'>
                {resources.map((resource, index) => (
                    <div key={resource.id} className='flex items-center gap-2'>
                        <span className='font-mono'>{index + 1}.</span>
                        <span>{resource.alias}</span>
                        {loadedImages[index] && <span className='text-green-600'>✓</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
