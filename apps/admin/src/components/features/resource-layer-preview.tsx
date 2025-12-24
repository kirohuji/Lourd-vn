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

        // 加载所有图片（不使用 crossOrigin，与 ResourcePreview 保持一致）
        const imagePromises = resources.map(
            (resource, index) =>
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    // 移除 crossOrigin，因为资源列表的 <img> 标签也没有设置 crossOrigin
                    // 如果服务器没有设置 CORS 头，设置 crossOrigin 会导致加载失败
                    // img.crossOrigin = 'anonymous';
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

                // 按顺序绘制所有图片（直接覆盖，模拟图层叠加效果）
                // 注意：如果图片被 CORS 策略阻止，drawImage 会失败
                // 但由于我们已经移除了 crossOrigin，应该可以正常绘制
                images.forEach((img, index) => {
                    const resource = resources[index];
                    try {
                        // 直接绘制到画布，覆盖之前的图层（模拟图层叠加）
                        // 如果图片尺寸与画布不一致，直接拉伸填充（这是图层叠加的常见行为）
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        console.log(`[ResourceLayerPreview] 绘制图片 ${index + 1}: ${resource.alias}`, {
                            naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
                            canvasSize: { width: canvas.width, height: canvas.height },
                        });
                    } catch (err) {
                        console.error(`[ResourceLayerPreview] 绘制图片失败: ${resource.alias}`, err);
                        // 如果绘制失败，继续处理下一张图片
                    }
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
