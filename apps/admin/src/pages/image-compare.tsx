import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    compareImages,
    downloadImageData,
    extractColorDiff,
    imageDataToDataURL,
    imageToImageData,
    loadImageFromFile,
} from '@/lib/utils/image-compare';
import {
    Download,
    Eye,
    EyeOff,
    HelpCircle,
    Image,
    Layers,
    MoveDown,
    MoveUp,
    RotateCcw,
    Upload,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ImageComparePage() {
    const [image1, setImage1] = useState<File | null>(null);
    const [image2, setImage2] = useState<File | null>(null);
    const [image1Preview, setImage1Preview] = useState<string | null>(null);
    const [image2Preview, setImage2Preview] = useState<string | null>(null);
    const [image2Data, setImage2Data] = useState<ImageData | null>(null);
    const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
    const [diffImageData, setDiffImageData] = useState<ImageData | null>(null);
    const [greenDiffImageUrl, setGreenDiffImageUrl] = useState<string | null>(null);
    const [greenDiffImageData, setGreenDiffImageData] = useState<ImageData | null>(null);
    const [comparing, setComparing] = useState(false);
    // 比较参数
    const [threshold, setThreshold] = useState(0.3);
    const [includeAA, setIncludeAA] = useState(false);
    const [alpha, setAlpha] = useState(0.1);
    // 预览 Dialog
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    // 帮助 Dialog
    const [helpOpen, setHelpOpen] = useState(false);
    // 合并预览 Dialog
    const [mergePreviewOpen, setMergePreviewOpen] = useState(false);
    const [layers, setLayers] = useState<
        Array<{
            id: string;
            name: string;
            imageUrl: string;
            visible: boolean;
            order: number;
        }>
    >([]);
    const [previewScale, setPreviewScale] = useState(1);
    const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
    const [compareResult, setCompareResult] = useState<{
        numDiffPixels: number;
        totalPixels: number;
        diffPercentage: number;
        width: number;
        height: number;
    } | null>(null);

    const file1InputRef = useRef<HTMLInputElement>(null);
    const file2InputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // 当两张图片都上传后，自动执行比较
    useEffect(() => {
        if (image1 && image2 && image1Preview && image2Preview && !comparing) {
            handleCompare();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image1, image2, image1Preview, image2Preview]);

    // 处理图片1上传
    const handleImage1Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setImage1(file);
        try {
            const img = await loadImageFromFile(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                setImage1Preview(canvas.toDataURL());
            }
        } catch (error) {
            toast({
                title: '错误',
                description: '加载图片失败',
                variant: 'destructive',
            });
        }

        // 如果两张图片都已上传，自动比较
        if (image2) {
            handleCompare();
        }
    };

    // 处理图片2上传
    const handleImage2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setImage2(file);
        try {
            const img = await loadImageFromFile(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                setImage2Preview(canvas.toDataURL());
                // 保存 ImageData（使用统一的尺寸，与比较结果一致）
                const imageData = imageToImageData(img, img.width, img.height);
                setImage2Data(imageData);
            }
        } catch (error) {
            toast({
                title: '错误',
                description: '加载图片失败',
                variant: 'destructive',
            });
        }
    };

    // 执行比较
    const handleCompare = async () => {
        if (!image1 || !image2) {
            toast({
                title: '错误',
                description: '请上传两张图片',
                variant: 'destructive',
            });
            return;
        }

        setComparing(true);
        try {
            const result = await compareImages(image1, image2, {
                threshold,
                includeAA,
                alpha,
            });
            const diffUrl = imageDataToDataURL(result.diffImageData);
            setDiffImageUrl(diffUrl);
            setDiffImageData(result.diffImageData);
            // 清除之前的绿色差异图
            setGreenDiffImageUrl(null);
            setGreenDiffImageData(null);
            setCompareResult({
                numDiffPixels: result.numDiffPixels,
                totalPixels: result.totalPixels,
                diffPercentage: result.diffPercentage,
                width: result.width,
                height: result.height,
            });
        } catch (error: any) {
            toast({
                title: '比较失败',
                description: error.message || '图片比较失败',
                variant: 'destructive',
            });
        } finally {
            setComparing(false);
        }
    };

    // 提取绿色差异（从原图2中提取）
    const handleExtractGreenDiff = () => {
        if (!diffImageData || !image2Data) {
            toast({
                title: '错误',
                description: '请先执行图片比较',
                variant: 'destructive',
            });
            return;
        }

        try {
            // 确保 image2Data 的尺寸与 diffImageData 一致
            // 比较时使用的是较大的尺寸，所以需要调整 image2Data 的尺寸
            let resizedImage2Data = image2Data;
            if (image2Data.width !== diffImageData.width || image2Data.height !== diffImageData.height) {
                const canvas = document.createElement('canvas');
                canvas.width = diffImageData.width;
                canvas.height = diffImageData.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Failed to get canvas context');
                }

                // 将 image2Data 绘制到目标尺寸的 canvas 上
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = image2Data.width;
                tempCanvas.height = image2Data.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) {
                    throw new Error('Failed to get temp canvas context');
                }
                tempCtx.putImageData(image2Data, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, diffImageData.width, diffImageData.height);
                resizedImage2Data = ctx.getImageData(0, 0, diffImageData.width, diffImageData.height);
            }

            // 从调整后的原图2中提取绿色差异位置的像素
            const greenDiff = extractColorDiff(diffImageData, resizedImage2Data, [0, 255, 0], 5);
            const greenDiffUrl = imageDataToDataURL(greenDiff);
            setGreenDiffImageUrl(greenDiffUrl);
            setGreenDiffImageData(greenDiff);
            toast({
                title: '成功',
                description: '绿色差异已提取',
            });
        } catch (error: any) {
            toast({
                title: '提取失败',
                description: error.message || '提取绿色差异失败',
                variant: 'destructive',
            });
        }
    };

    // 下载绿色差异图
    const handleDownloadGreenDiff = () => {
        if (!greenDiffImageData) {
            toast({
                title: '错误',
                description: '请先提取绿色差异',
                variant: 'destructive',
            });
            return;
        }

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadImageData(greenDiffImageData, `green-diff-${timestamp}.png`);
            toast({
                title: '成功',
                description: '绿色差异图已下载',
            });
        } catch (error: any) {
            toast({
                title: '下载失败',
                description: error.message || '下载失败',
                variant: 'destructive',
            });
        }
    };

    // 清除图片1
    const clearImage1 = () => {
        setImage1(null);
        setImage1Preview(null);
        setDiffImageUrl(null);
        setDiffImageData(null);
        setGreenDiffImageUrl(null);
        setGreenDiffImageData(null);
        setCompareResult(null);
        if (file1InputRef.current) {
            file1InputRef.current.value = '';
        }
    };

    // 清除图片2
    const clearImage2 = () => {
        setImage2(null);
        setImage2Preview(null);
        setImage2Data(null);
        setDiffImageUrl(null);
        setDiffImageData(null);
        setGreenDiffImageUrl(null);
        setGreenDiffImageData(null);
        setCompareResult(null);
        if (file2InputRef.current) {
            file2InputRef.current.value = '';
        }
    };

    // 打开预览
    const handlePreview = (imageUrl: string, title: string) => {
        setPreviewImage(imageUrl);
        setPreviewTitle(title);
        setPreviewOpen(true);
    };

    // 打开合并预览
    const handleOpenMergePreview = () => {
        if (!image1Preview || !image2Preview) {
            toast({
                title: '错误',
                description: '请先上传两张图片',
                variant: 'destructive',
            });
            return;
        }

        const initialLayers = [
            {
                id: 'image1',
                name: '原图 1',
                imageUrl: image1Preview,
                visible: true,
                order: 0,
            },
            {
                id: 'image2',
                name: '原图 2',
                imageUrl: image2Preview,
                visible: true,
                order: 1,
            },
        ];

        if (greenDiffImageUrl) {
            initialLayers.push({
                id: 'greenDiff',
                name: '绿色差异',
                imageUrl: greenDiffImageUrl,
                visible: true,
                order: 2,
            });
        }

        setLayers(initialLayers);
        setPreviewScale(1);
        setMergePreviewOpen(true);
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
                sorted[index].order = index;
                sorted[index - 1].order = index - 1;
            } else if (direction === 'down' && index < sorted.length - 1) {
                [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
                sorted[index].order = index;
                sorted[index + 1].order = index + 1;
            }

            return sorted;
        });
    };

    // 渲染合并预览
    useEffect(() => {
        if (!mergePreviewOpen || layers.length === 0) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 加载所有可见的图层
        const visibleLayers = [...layers].filter(l => l.visible).sort((a, b) => a.order - b.order);

        if (visibleLayers.length === 0) {
            canvas.width = 800;
            canvas.height = 600;
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setPreviewCanvas(canvas);
            return;
        }

        // 加载所有图片
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
                // 找到最大尺寸
                const maxWidth = Math.max(...images.map(img => img.width));
                const maxHeight = Math.max(...images.map(img => img.height));

                canvas.width = maxWidth;
                canvas.height = maxHeight;

                // 按顺序绘制图层
                images.forEach(img => {
                    ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
                });

                setPreviewCanvas(canvas);
            })
            .catch(error => {
                console.error('Failed to load images:', error);
            });
    }, [mergePreviewOpen, layers]);

    // 缩放预览
    const handleZoom = (type: 'in' | 'out' | 'reset') => {
        if (type === 'in') {
            setPreviewScale(prev => Math.min(prev + 0.1, 3));
        } else if (type === 'out') {
            setPreviewScale(prev => Math.max(prev - 0.1, 0.1));
        } else {
            setPreviewScale(1);
        }
    };

    // 处理拖拽上传
    const handleDrop = (e: React.DragEvent, imageNumber: 1 | 2) => {
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

        if (imageNumber === 1) {
            const fakeEvent = {
                target: { files: [file] },
            } as any;
            handleImage1Upload(fakeEvent);
        } else {
            const fakeEvent = {
                target: { files: [file] },
            } as any;
            handleImage2Upload(fakeEvent);
        }
    };

    return (
        <div className='container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col gap-3 overflow-hidden'>
            {/* 标题 */}
            <div className='shrink-0'>
                <h1 className='text-2xl font-bold'>图片比较</h1>
                <p className='text-xs text-muted-foreground'>使用 pixelmatch 进行像素级比较</p>
            </div>

            {/* 上传区域 */}
            <div className='grid grid-cols-2 gap-3 shrink-0'>
                {/* 图片1上传 */}
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>图片 1</CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0'>
                        {image1Preview ? (
                            <div className='relative'>
                                <img
                                    src={image1Preview}
                                    alt='Image 1'
                                    className='w-full h-auto rounded-lg border cursor-pointer max-h-48 object-contain'
                                    onClick={() => handlePreview(image1Preview, '图片 1')}
                                />
                                <Button
                                    variant='destructive'
                                    size='icon'
                                    className='absolute top-2 right-2 h-6 w-6'
                                    onClick={clearImage1}
                                >
                                    <X className='h-3 w-3' />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className='border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted transition-colors'
                                onDrop={e => handleDrop(e, 1)}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => file1InputRef.current?.click()}
                            >
                                <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                                <p className='text-xs text-muted-foreground'>点击或拖拽上传</p>
                            </div>
                        )}
                        <Input
                            ref={file1InputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleImage1Upload}
                            className='hidden'
                        />
                    </CardContent>
                </Card>

                {/* 图片2上传 */}
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>图片 2</CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0'>
                        {image2Preview ? (
                            <div className='relative'>
                                <img
                                    src={image2Preview}
                                    alt='Image 2'
                                    className='w-full h-auto rounded-lg border cursor-pointer max-h-48 object-contain'
                                    onClick={() => handlePreview(image2Preview, '图片 2')}
                                />
                                <Button
                                    variant='destructive'
                                    size='icon'
                                    className='absolute top-2 right-2 h-6 w-6'
                                    onClick={clearImage2}
                                >
                                    <X className='h-3 w-3' />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className='border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted transition-colors'
                                onDrop={e => handleDrop(e, 2)}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => file2InputRef.current?.click()}
                            >
                                <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                                <p className='text-xs text-muted-foreground'>点击或拖拽上传</p>
                            </div>
                        )}
                        <Input
                            ref={file2InputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleImage2Upload}
                            className='hidden'
                        />
                    </CardContent>
                </Card>
            </div>

            {/* 比较按钮 */}
            {image1 && image2 && (
                <div className='flex justify-center shrink-0'>
                    <Button onClick={handleCompare} disabled={comparing} size='sm'>
                        {comparing ? (
                            <>
                                <Image className='mr-2 h-4 w-4 animate-spin' />
                                比较中...
                            </>
                        ) : (
                            <>
                                <Image className='mr-2 h-4 w-4' />
                                开始比较
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* 比较结果 */}
            {diffImageUrl && compareResult && (
                <div className='flex gap-3 flex-1 overflow-hidden min-h-0'>
                    {/* 左侧：图片结果 */}
                    <div className='grid grid-cols-4 gap-2 flex-1 overflow-auto min-h-0'>
                        {/* 原图1 */}
                        <Card className='h-fit'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xs'>原图 1</CardTitle>
                            </CardHeader>
                            <CardContent className='pt-0 p-2'>
                                <img
                                    src={image1Preview || ''}
                                    alt='Original Image 1'
                                    className='w-full h-auto rounded-lg border cursor-pointer max-h-64 object-contain'
                                    onClick={() => handlePreview(image1Preview || '', '原图 1')}
                                />
                            </CardContent>
                        </Card>

                        {/* 原图2 */}
                        <Card className='h-fit'>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xs'>原图 2</CardTitle>
                            </CardHeader>
                            <CardContent className='pt-0 p-2'>
                                <img
                                    src={image2Preview || ''}
                                    alt='Original Image 2'
                                    className='w-full h-auto rounded-lg border cursor-pointer max-h-64 object-contain'
                                    onClick={() => handlePreview(image2Preview || '', '原图 2')}
                                />
                            </CardContent>
                        </Card>

                        {/* 差异图 */}
                        <Card className='h-fit'>
                            <CardHeader className='pb-2'>
                                <div className='flex items-center justify-between'>
                                    <CardTitle className='text-xs'>差异图</CardTitle>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={handleExtractGreenDiff}
                                        disabled={!diffImageData}
                                        className='h-6 text-xs px-2'
                                    >
                                        <Image className='mr-1 h-3 w-3' />
                                        提取绿色
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-0 p-2'>
                                <img
                                    src={diffImageUrl}
                                    alt='Difference'
                                    className='w-full h-auto rounded-lg border cursor-pointer max-h-64 object-contain'
                                    onClick={() => handlePreview(diffImageUrl, '差异图')}
                                />
                            </CardContent>
                        </Card>

                        {/* 绿色差异图 */}
                        <Card className='h-fit'>
                            <CardHeader className='pb-2'>
                                <div className='flex items-center justify-between'>
                                    <CardTitle className='text-xs'>绿色差异</CardTitle>
                                    <div className='flex gap-1'>
                                        {greenDiffImageData && (
                                            <>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    onClick={handleOpenMergePreview}
                                                    className='h-6 text-xs px-2'
                                                    title='合并预览'
                                                >
                                                    <Layers className='mr-1 h-3 w-3' />
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    onClick={handleDownloadGreenDiff}
                                                    className='h-6 text-xs px-2'
                                                >
                                                    <Download className='mr-1 h-3 w-3' />
                                                    下载
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-0 p-2'>
                                {greenDiffImageUrl ? (
                                    <img
                                        src={greenDiffImageUrl}
                                        alt='Green Difference'
                                        className='w-full h-auto rounded-lg border cursor-pointer max-h-64 object-contain bg-[repeating-pattern]'
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                            backgroundSize: '20px 20px',
                                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                        }}
                                        onClick={() => handlePreview(greenDiffImageUrl, '绿色差异')}
                                    />
                                ) : (
                                    <div className='flex items-center justify-center h-24 text-xs text-muted-foreground border rounded-lg'>
                                        点击提取
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 右侧：参数面板和统计信息 */}
                    <div className='w-80 shrink-0 flex flex-col gap-3 overflow-y-auto'>
                        {/* 比较参数 */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <div className='flex items-center justify-between'>
                                    <CardTitle className='text-sm'>比较参数</CardTitle>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6'
                                        onClick={() => setHelpOpen(true)}
                                        title='参数说明'
                                    >
                                        <HelpCircle className='h-4 w-4' />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className='pt-0 space-y-3'>
                                <div className='space-y-1.5'>
                                    <div className='flex items-center justify-between'>
                                        <Label htmlFor='threshold' className='text-xs'>
                                            敏感度阈值
                                        </Label>
                                        <Input
                                            id='threshold'
                                            type='number'
                                            min='0'
                                            max='1.0'
                                            step='0.05'
                                            value={threshold}
                                            onChange={e => setThreshold(parseFloat(e.target.value) || 0.3)}
                                            className='w-20 h-7 text-xs'
                                        />
                                    </div>
                                    <input
                                        type='range'
                                        min='0'
                                        max='1.0'
                                        step='0.05'
                                        value={threshold}
                                        onChange={e => setThreshold(parseFloat(e.target.value))}
                                        className='w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer'
                                    />
                                </div>

                                <div className='space-y-1.5'>
                                    <div className='flex items-center justify-between'>
                                        <Label htmlFor='alpha' className='text-xs'>
                                            Alpha 阈值
                                        </Label>
                                        <Input
                                            id='alpha'
                                            type='number'
                                            min='0.0'
                                            max='1.0'
                                            step='0.05'
                                            value={alpha}
                                            onChange={e => setAlpha(parseFloat(e.target.value) || 0.1)}
                                            className='w-20 h-7 text-xs'
                                        />
                                    </div>
                                    <input
                                        type='range'
                                        min='0.0'
                                        max='1.0'
                                        step='0.05'
                                        value={alpha}
                                        onChange={e => setAlpha(parseFloat(e.target.value))}
                                        className='w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer'
                                    />
                                </div>

                                <div className='flex items-center justify-between pt-1'>
                                    <Label htmlFor='includeAA' className='text-xs'>
                                        包含抗锯齿
                                    </Label>
                                    <input
                                        id='includeAA'
                                        type='checkbox'
                                        checked={includeAA}
                                        onChange={e => setIncludeAA(e.target.checked)}
                                        className='h-4 w-4 rounded border-gray-300'
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* 统计信息 */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm'>统计信息</CardTitle>
                            </CardHeader>
                            <CardContent className='pt-0 space-y-2'>
                                <div>
                                    <Label className='text-xs text-muted-foreground'>差异百分比</Label>
                                    <p className='text-lg font-semibold'>{compareResult.diffPercentage.toFixed(2)}%</p>
                                </div>
                                <div>
                                    <Label className='text-xs text-muted-foreground'>不同像素数</Label>
                                    <p className='text-sm font-medium'>
                                        {compareResult.numDiffPixels.toLocaleString()} /{' '}
                                        {compareResult.totalPixels.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className='text-xs text-muted-foreground'>图片尺寸</Label>
                                    <p className='text-sm font-medium'>
                                        {compareResult.width} × {compareResult.height}
                                    </p>
                                </div>
                                <div>
                                    <Label className='text-xs text-muted-foreground'>总像素数</Label>
                                    <p className='text-sm font-medium'>{compareResult.totalPixels.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* 预览 Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className='max-w-[90vw] max-h-[90vh] p-0'>
                    <DialogHeader className='px-6 pt-6 pb-2'>
                        <DialogTitle>{previewTitle}</DialogTitle>
                    </DialogHeader>
                    <div className='p-6 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center'>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt={previewTitle}
                                className='max-w-full max-h-full object-contain rounded-lg'
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 帮助 Dialog */}
            <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>比较参数说明</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <h3 className='font-semibold text-sm'>敏感度阈值 (Threshold)</h3>
                            <p className='text-sm text-muted-foreground'>
                                控制像素差异的敏感度。值越大，越不敏感，会忽略更多细微差异。
                            </p>
                            <ul className='text-xs text-muted-foreground space-y-1 ml-4 list-disc'>
                                <li>
                                    <strong>0.0 - 0.2</strong>：非常敏感，能检测到极小的差异（如抗锯齿、压缩伪影）
                                </li>
                                <li>
                                    <strong>0.3 - 0.5</strong>：中等敏感度，适合大多数场景（推荐）
                                </li>
                                <li>
                                    <strong>0.6 - 1.0</strong>：不敏感，只检测明显的差异
                                </li>
                            </ul>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='font-semibold text-sm'>Alpha 通道阈值 (Alpha)</h3>
                            <p className='text-sm text-muted-foreground'>
                                控制透明度通道的比较敏感度。用于处理带透明度的图片。
                            </p>
                            <ul className='text-xs text-muted-foreground space-y-1 ml-4 list-disc'>
                                <li>
                                    <strong>0.0</strong>：完全忽略透明度差异
                                </li>
                                <li>
                                    <strong>0.1 - 0.3</strong>：轻微考虑透明度（推荐）
                                </li>
                                <li>
                                    <strong>0.4 - 1.0</strong>：严格比较透明度
                                </li>
                            </ul>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='font-semibold text-sm'>包含抗锯齿 (Include Anti-Aliasing)</h3>
                            <p className='text-sm text-muted-foreground'>
                                是否在比较时考虑抗锯齿边缘。启用后，会忽略因抗锯齿导致的细微差异。
                            </p>
                            <ul className='text-xs text-muted-foreground space-y-1 ml-4 list-disc'>
                                <li>
                                    <strong>关闭</strong>：严格比较所有像素，包括抗锯齿边缘
                                </li>
                                <li>
                                    <strong>开启</strong>：忽略抗锯齿边缘的差异，减少误报
                                </li>
                            </ul>
                        </div>

                        <div className='pt-2 border-t'>
                            <p className='text-xs text-muted-foreground'>
                                <strong>提示</strong>
                                ：如果发现很多细小的差异（如毛线、抗锯齿等），可以尝试提高敏感度阈值或开启"包含抗锯齿"选项。
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 合并预览 Dialog */}
            <Dialog open={mergePreviewOpen} onOpenChange={setMergePreviewOpen}>
                <DialogContent className='max-w-[95vw] max-h-[95vh] p-0 flex flex-col'>
                    <DialogHeader className='px-6 pt-6 pb-4'>
                        <DialogTitle>合并预览</DialogTitle>
                    </DialogHeader>
                    <div className='flex flex-1 overflow-hidden min-h-0'>
                        {/* 左侧：图片列表和图层管理 */}
                        <div className='w-80 border-r flex flex-col shrink-0'>
                            {/* 图片列表 */}
                            <div className='p-4 border-b space-y-2 max-h-[40%] overflow-y-auto'>
                                <h3 className='text-sm font-semibold mb-2'>所有图片</h3>
                                <div className='space-y-2'>
                                    {image1Preview && (
                                        <div className='border rounded-lg p-2'>
                                            <p className='text-xs font-medium mb-1'>原图 1</p>
                                            <img
                                                src={image1Preview}
                                                alt='Image 1'
                                                className='w-full h-auto rounded border max-h-32 object-contain'
                                            />
                                        </div>
                                    )}
                                    {image2Preview && (
                                        <div className='border rounded-lg p-2'>
                                            <p className='text-xs font-medium mb-1'>原图 2</p>
                                            <img
                                                src={image2Preview}
                                                alt='Image 2'
                                                className='w-full h-auto rounded border max-h-32 object-contain'
                                            />
                                        </div>
                                    )}
                                    {greenDiffImageUrl && (
                                        <div className='border rounded-lg p-2'>
                                            <p className='text-xs font-medium mb-1'>绿色差异</p>
                                            <img
                                                src={greenDiffImageUrl}
                                                alt='Green Diff'
                                                className='w-full h-auto rounded border max-h-32 object-contain bg-[repeating-pattern]'
                                                style={{
                                                    backgroundImage:
                                                        'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                                    backgroundSize: '20px 20px',
                                                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 图层管理 */}
                            <div className='flex-1 p-4 overflow-y-auto'>
                                <h3 className='text-sm font-semibold mb-3'>图层管理</h3>
                                <div className='space-y-2'>
                                    {[...layers]
                                        .sort((a, b) => a.order - b.order)
                                        .map((layer, index) => (
                                            <div
                                                key={layer.id}
                                                className='border rounded-lg p-2 flex items-center justify-between'
                                            >
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
                                                    <span className='text-xs flex-1'>{layer.name}</span>
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
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* 右侧：合并预览 */}
                        <div className='flex-1 flex flex-col overflow-hidden'>
                            {/* 工具栏 */}
                            <div className='p-4 border-b flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                    <Button variant='outline' size='sm' onClick={() => handleZoom('in')} title='放大'>
                                        <ZoomIn className='h-4 w-4' />
                                    </Button>
                                    <Button variant='outline' size='sm' onClick={() => handleZoom('out')} title='缩小'>
                                        <ZoomOut className='h-4 w-4' />
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() => handleZoom('reset')}
                                        title='还原'
                                    >
                                        <RotateCcw className='h-4 w-4' />
                                    </Button>
                                    <span className='text-xs text-muted-foreground ml-2'>
                                        {Math.round(previewScale * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* 预览区域 */}
                            <div className='flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30'>
                                {previewCanvas ? (
                                    <div
                                        style={{
                                            transform: `scale(${previewScale})`,
                                            transformOrigin: 'center',
                                            transition: 'transform 0.2s',
                                        }}
                                    >
                                        <img
                                            src={previewCanvas.toDataURL()}
                                            alt='Merged Preview'
                                            className='max-w-full max-h-full object-contain rounded-lg border shadow-lg'
                                        />
                                    </div>
                                ) : (
                                    <div className='text-sm text-muted-foreground'>加载中...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
