import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceResponseDto } from '@lourd-game/shared';
import { Eye, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ResourceLayerPreviewProps {
    resources: ResourceResponseDto[];
    width?: number;
    height?: number;
}

export function ResourceLayerPreview({ resources, width = 400, height = 400 }: ResourceLayerPreviewProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
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
                console.log(`[ResourceLayerPreview] 所有图片加载完成，共 ${images.length} 张`);
                setLoadedImages(images);

                // 计算所有图片的最大尺寸（用于确定画布尺寸）
                let maxWidth = 0;
                let maxHeight = 0;
                images.forEach(img => {
                    if (img.naturalWidth > maxWidth) maxWidth = img.naturalWidth;
                    if (img.naturalHeight > maxHeight) maxHeight = img.naturalHeight;
                });

                // 如果提供了 width 和 height，使用提供的尺寸；否则使用图片的最大尺寸
                const canvasWidth = width || maxWidth;
                const canvasHeight = height || maxHeight;

                // 更新画布尺寸
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                console.log(`[ResourceLayerPreview] 画布尺寸: ${canvasWidth} x ${canvasHeight}`, {
                    maxImageSize: { width: maxWidth, height: maxHeight },
                    providedSize: { width, height },
                });

                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 按顺序绘制所有图片（保持原始尺寸，从 (0,0) 开始叠加）
                images.forEach((img, index) => {
                    const resource = resources[index];
                    try {
                        // 按照图片的原始尺寸绘制，不拉伸
                        // 图层叠加时，每张图片都从 (0,0) 开始绘制，后面的图片会覆盖前面的
                        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                        console.log(`[ResourceLayerPreview] 绘制图片 ${index + 1}: ${resource.alias}`, {
                            naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
                            position: { x: 0, y: 0 },
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
        <>
            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <div className='text-sm text-muted-foreground'>
                        图层预览（{resources.length} 个资源，按顺序叠加）
                    </div>
                    <Button variant='outline' size='sm' onClick={() => setPreviewOpen(true)}>
                        <Eye className='h-4 w-4 mr-2' />
                        查看预览
                    </Button>
                </div>
                <div className='text-xs text-muted-foreground space-y-1'>
                    {resources.map((resource, index) => (
                        <div key={resource.id} className='flex items-center gap-2'>
                            <span className='font-mono'>{index + 1}.</span>
                            <span>{resource.alias}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 图层预览对话框 */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto'>
                    <DialogHeader>
                        <DialogTitle>图层预览</DialogTitle>
                        <DialogDescription>{resources.length} 个资源按顺序叠加显示</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='relative border rounded-lg overflow-auto bg-muted/30 flex items-center justify-center min-h-[200px]'>
                            {loading && (
                                <div className='absolute inset-0 flex items-center justify-center bg-background/80 z-10'>
                                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                                </div>
                            )}
                            {error && (
                                <div className='absolute inset-0 flex items-center justify-center bg-background/80 z-10'>
                                    <p className='text-sm text-destructive'>{error}</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} className='max-w-full h-auto' />
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
                </DialogContent>
            </Dialog>
        </>
    );
}
