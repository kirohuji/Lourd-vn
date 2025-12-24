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
            resource =>
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`加载图片失败: ${resource.alias}`));
                    img.src = resource.src;
                }),
        );

        Promise.all(imagePromises)
            .then(images => {
                setLoadedImages(images);
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 按顺序绘制所有图片
                images.forEach(img => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                });

                setLoading(false);
            })
            .catch(err => {
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
