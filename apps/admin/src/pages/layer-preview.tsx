import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { loadImageFromFile } from '@/lib/utils/image-compare';
import { Eye, EyeOff, Layers, MoveDown, MoveUp, Upload, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface UploadedImage {
    id: string;
    name: string;
    imageUrl: string;
}

interface LayerItem {
    id: string;
    name: string;
    imageUrl: string;
    visible: boolean;
    order: number;
    scale: number; // 每个图层的独立缩放比例
}

export function LayerPreviewPage() {
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [layers, setLayers] = useState<LayerItem[]>([]);
    const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // 处理文件上传
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: '错误',
                description: '请上传图片文件',
                variant: 'destructive',
            });
            return;
        }

        try {
            const img = await loadImageFromFile(file);
            const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const name = file.name || `图片 ${uploadedImages.length + 1}`;

            setUploadedImages(prev => [
                ...prev,
                {
                    id,
                    name,
                    imageUrl: img.src,
                },
            ]);
        } catch {
            toast({
                title: '错误',
                description: '加载图片失败',
                variant: 'destructive',
            });
        } finally {
            // 允许重复选择同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // 处理拖拽上传
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) {
            toast({
                title: '错误',
                description: '请拖拽图片文件',
                variant: 'destructive',
            });
            return;
        }

        const fakeEvent = {
            target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(fakeEvent);
    };

    // 添加到图层
    const addToLayers = (image: UploadedImage) => {
        setLayers(prev => {
            const maxOrder = prev.length > 0 ? Math.max(...prev.map(l => l.order)) : 0;
            const exists = prev.some(l => l.id === image.id);
            if (exists) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: image.id,
                    name: image.name,
                    imageUrl: image.imageUrl,
                    visible: true,
                    order: maxOrder + 1,
                    scale: 1, // 默认缩放为 1
                },
            ];
        });
    };

    // 切换图层可见性
    const toggleLayerVisibility = (layerId: string) => {
        setLayers(prev => prev.map(layer => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)));
    };

    // 移动图层顺序
    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const sorted = [...prev].sort((a, b) => a.order - b.order);
            const index = sorted.findIndex(l => l.id === layerId);
            if (index === -1) return prev;

            if (direction === 'up' && index > 0) {
                [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
            } else if (direction === 'down' && index < sorted.length - 1) {
                [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
            } else {
                return prev;
            }

            // 重新标记 order
            return sorted.map((layer, i) => ({ ...layer, order: i }));
        });
    };

    // 图层缩放控制
    const handleLayerZoom = (layerId: string, type: 'in' | 'out' | 'reset') => {
        setLayers(prev =>
            prev.map(layer => {
                if (layer.id !== layerId) return layer;

                let newScale = layer.scale;
                if (type === 'in') {
                    newScale = Math.min(layer.scale + 0.1, 3);
                } else if (type === 'out') {
                    newScale = Math.max(layer.scale - 0.1, 0.1);
                } else {
                    newScale = 1;
                }

                return { ...layer, scale: newScale };
            }),
        );
    };

    // 合成预览
    useEffect(() => {
        if (layers.length === 0) {
            setPreviewCanvas(null);
            return;
        }

        const visibleLayers = [...layers].filter(l => l.visible).sort((a, b) => a.order - b.order);

        if (visibleLayers.length === 0) {
            setPreviewCanvas(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imagePromises = visibleLayers.map(
            layer =>
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = document.createElement('img');
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = layer.imageUrl;
                }),
        );

        Promise.all(imagePromises)
            .then(images => {
                // 计算每个图层缩放后的尺寸，找到最大尺寸作为画布尺寸
                let maxWidth = 0;
                let maxHeight = 0;

                visibleLayers.forEach((layer, index) => {
                    const img = images[index];
                    const scaledWidth = img.width * layer.scale;
                    const scaledHeight = img.height * layer.scale;
                    maxWidth = Math.max(maxWidth, scaledWidth);
                    maxHeight = Math.max(maxHeight, scaledHeight);
                });

                canvas.width = maxWidth || 800;
                canvas.height = maxHeight || 600;

                // 按顺序绘制每个图层，使用各自的缩放比例
                visibleLayers.forEach((layer, index) => {
                    const img = images[index];
                    const scaledWidth = img.width * layer.scale;
                    const scaledHeight = img.height * layer.scale;
                    // 居中绘制（可选，也可以从左上角开始）
                    const x = (canvas.width - scaledWidth) / 2;
                    const y = (canvas.height - scaledHeight) / 2;
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                });

                setPreviewCanvas(canvas);
            })
            .catch(() => {
                toast({
                    title: '错误',
                    description: '合成预览失败',
                    variant: 'destructive',
                });
            });
    }, [layers, toast]);

    return (
        <div className='container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col gap-3 overflow-hidden'>
            {/* 标题 */}
            <div className='shrink-0'>
                <h1 className='text-2xl font-bold flex items-center gap-2'>
                    <Layers className='h-6 w-6' />
                    图层预览
                </h1>
                <p className='text-xs text-muted-foreground'>
                    仅在本地浏览器内处理，不会上传到服务器。用于快速预览多张图片的图层叠加效果。
                </p>
            </div>

            <div className='flex-1 flex gap-3 min-h-0 overflow-hidden'>
                {/* 左侧：上传与图片列表 */}
                <div className='w-80 shrink-0 flex flex-col gap-3 overflow-hidden'>
                    <Card>
                        <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>上传图片</CardTitle>
                        </CardHeader>
                        <CardContent className='pt-0'>
                            <div
                                className='border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted transition-colors'
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                                <p className='text-xs text-muted-foreground'>点击或拖拽上传图片</p>
                            </div>
                            <Input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*'
                                onChange={handleFileUpload}
                                className='hidden'
                            />
                        </CardContent>
                    </Card>

                    <Card className='flex-1 min-h-0 flex flex-col'>
                        <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>已上传图片</CardTitle>
                        </CardHeader>
                        <CardContent className='pt-0 overflow-y-auto space-y-2'>
                            {uploadedImages.length === 0 && (
                                <p className='text-xs text-muted-foreground'>还没有上传图片。</p>
                            )}
                            {uploadedImages.map(image => (
                                <div
                                    key={image.id}
                                    className='border rounded-lg p-2 flex items-center gap-2 justify-between'
                                >
                                    <div className='flex items-center gap-2'>
                                        <img
                                            src={image.imageUrl}
                                            alt={image.name}
                                            className='w-12 h-12 rounded border object-cover'
                                        />
                                        <div className='flex flex-col'>
                                            <span className='text-xs font-medium truncate max-w-[140px]'>
                                                {image.name}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        className='h-7 text-xs px-2'
                                        onClick={() => addToLayers(image)}
                                    >
                                        添加到图层
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* 右侧：图层管理与预览 */}
                <div className='flex-1 flex flex-col gap-3 min-h-0 overflow-hidden'>
                    <div className='flex gap-3 min-h-0 overflow-hidden'>
                        {/* 图层管理 */}
                        <Card className='w-80 shrink-0 flex flex-col min-h-0'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm'>图层管理</CardTitle>
                            </CardHeader>
                            <CardContent className='pt-0 flex-1 overflow-y-auto space-y-2'>
                                {layers.length === 0 && (
                                    <p className='text-xs text-muted-foreground'>
                                        从左侧已上传图片中添加图层以开始预览。
                                    </p>
                                )}
                                {[...layers]
                                    .sort((a, b) => a.order - b.order)
                                    .map((layer, index) => (
                                        <div
                                            key={layer.id}
                                            className='border rounded-lg p-2 space-y-2'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center gap-2 flex-1'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-6 w-6'
                                                        onClick={() => toggleLayerVisibility(layer.id)}
                                                        title={layer.visible ? '隐藏' : '显示'}
                                                    >
                                                        {layer.visible ? (
                                                            <Eye className='h-4 w-4' />
                                                        ) : (
                                                            <EyeOff className='h-4 w-4' />
                                                        )}
                                                    </Button>
                                                    <span className='text-xs flex-1 truncate'>{layer.name}</span>
                                                </div>
                                                <div className='flex items-center gap-1'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-6 w-6'
                                                        onClick={() => moveLayer(layer.id, 'up')}
                                                        disabled={index === 0}
                                                        title='上移'
                                                    >
                                                        <MoveUp className='h-3 w-3' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-6 w-6'
                                                        onClick={() => moveLayer(layer.id, 'down')}
                                                        disabled={index === layers.length - 1}
                                                        title='下移'
                                                    >
                                                        <MoveDown className='h-3 w-3' />
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* 图层缩放控制 */}
                                            <div className='flex items-center gap-1 pl-8'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6'
                                                    onClick={() => handleLayerZoom(layer.id, 'out')}
                                                    title='缩小'
                                                >
                                                    <ZoomOut className='h-3 w-3' />
                                                </Button>
                                                <span className='text-[10px] text-muted-foreground min-w-[40px] text-center'>
                                                    {Math.round(layer.scale * 100)}%
                                                </span>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6'
                                                    onClick={() => handleLayerZoom(layer.id, 'in')}
                                                    title='放大'
                                                >
                                                    <ZoomIn className='h-3 w-3' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6'
                                                    onClick={() => handleLayerZoom(layer.id, 'reset')}
                                                    title='还原'
                                                >
                                                    <RotateCcw className='h-3 w-3' />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>

                        {/* 预览区域 */}
                        <Card className='flex-1 flex flex-col min-h-0'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm'>预览</CardTitle>
                            </CardHeader>
                            <CardContent className='pt-0 flex-1 overflow-auto flex items-center justify-center bg-muted/30'>
                                {previewCanvas ? (
                                    <img
                                        src={previewCanvas.toDataURL()}
                                        alt='Layer Preview'
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                        className='rounded-lg border shadow-lg'
                                    />
                                ) : (
                                    <div className='text-xs text-muted-foreground'>
                                        暂无可预览内容，请先添加至少一个可见图层。
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 底部提示 */}
                    <div className='text-[11px] text-muted-foreground'>
                        提示：图层顺序从上到下依次叠加，可通过左侧上传多张图片并添加为图层，仅在当前浏览器会话中生效。
                    </div>
                </div>
            </div>
        </div>
    );
}

