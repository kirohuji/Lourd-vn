import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Download, Image, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

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

        // 如果两张图片都已上传，自动比较
        if (image1) {
            handleCompare();
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
        <div className='container mx-auto p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>图片比较</h1>
                    <p className='text-sm text-muted-foreground mt-1'>上传两张图片，使用 pixelmatch 进行像素级比较</p>
                </div>
            </div>

            {/* 上传区域 */}
            <div className='grid grid-cols-2 gap-4'>
                {/* 图片1上传 */}
                <Card>
                    <CardHeader>
                        <CardTitle>图片 1</CardTitle>
                        <CardDescription>上传第一张图片</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {image1Preview ? (
                            <div className='relative'>
                                <img src={image1Preview} alt='Image 1' className='w-full h-auto rounded-lg border' />
                                <Button
                                    variant='destructive'
                                    size='icon'
                                    className='absolute top-2 right-2'
                                    onClick={clearImage1}
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className='border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors'
                                onDrop={e => handleDrop(e, 1)}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => file1InputRef.current?.click()}
                            >
                                <Upload className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                                <p className='text-sm text-muted-foreground'>点击或拖拽上传图片</p>
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
                    <CardHeader>
                        <CardTitle>图片 2</CardTitle>
                        <CardDescription>上传第二张图片</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {image2Preview ? (
                            <div className='relative'>
                                <img src={image2Preview} alt='Image 2' className='w-full h-auto rounded-lg border' />
                                <Button
                                    variant='destructive'
                                    size='icon'
                                    className='absolute top-2 right-2'
                                    onClick={clearImage2}
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className='border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors'
                                onDrop={e => handleDrop(e, 2)}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => file2InputRef.current?.click()}
                            >
                                <Upload className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                                <p className='text-sm text-muted-foreground'>点击或拖拽上传图片</p>
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

            {/* 参数面板 */}
            {image1 && image2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className='text-sm'>比较参数</CardTitle>
                        <CardDescription>调整参数以优化比较结果</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                                <Label htmlFor='threshold'>敏感度阈值</Label>
                                <Input
                                    id='threshold'
                                    type='number'
                                    min='0.05'
                                    max='1.0'
                                    step='0.05'
                                    value={threshold}
                                    onChange={e => setThreshold(parseFloat(e.target.value) || 0.3)}
                                    className='w-24'
                                />
                            </div>
                            <input
                                type='range'
                                min='0.05'
                                max='1.0'
                                step='0.05'
                                value={threshold}
                                onChange={e => setThreshold(parseFloat(e.target.value))}
                                className='w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                            />
                            <p className='text-xs text-muted-foreground'>
                                值越大，越不敏感（减少细小差异，如抗锯齿、压缩伪影等）。默认: 0.3
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                                <Label htmlFor='alpha'>Alpha 通道阈值</Label>
                                <Input
                                    id='alpha'
                                    type='number'
                                    min='0.0'
                                    max='1.0'
                                    step='0.05'
                                    value={alpha}
                                    onChange={e => setAlpha(parseFloat(e.target.value) || 0.1)}
                                    className='w-24'
                                />
                            </div>
                            <input
                                type='range'
                                min='0.0'
                                max='1.0'
                                step='0.05'
                                value={alpha}
                                onChange={e => setAlpha(parseFloat(e.target.value))}
                                className='w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer'
                            />
                            <p className='text-xs text-muted-foreground'>控制透明度的比较敏感度。默认: 0.1</p>
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='space-y-0.5'>
                                <Label htmlFor='includeAA'>包含抗锯齿</Label>
                                <p className='text-xs text-muted-foreground'>是否在比较时考虑抗锯齿边缘</p>
                            </div>
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
            )}

            {/* 比较按钮 */}
            {image1 && image2 && (
                <div className='flex justify-center'>
                    <Button onClick={handleCompare} disabled={comparing} size='lg'>
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
                <div className='grid grid-cols-5 gap-4'>
                    {/* 原图1 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm'>原图 1</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <img
                                src={image1Preview || ''}
                                alt='Original Image 1'
                                className='w-full h-auto rounded-lg border'
                            />
                        </CardContent>
                    </Card>

                    {/* 原图2 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm'>原图 2</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <img
                                src={image2Preview || ''}
                                alt='Original Image 2'
                                className='w-full h-auto rounded-lg border'
                            />
                        </CardContent>
                    </Card>

                    {/* 差异图 */}
                    <Card>
                        <CardHeader>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-sm'>差异图</CardTitle>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={handleExtractGreenDiff}
                                    disabled={!diffImageData}
                                >
                                    <Image className='mr-2 h-3 w-3' />
                                    提取绿色
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <img src={diffImageUrl} alt='Difference' className='w-full h-auto rounded-lg border' />
                        </CardContent>
                    </Card>

                    {/* 绿色差异图 */}
                    <Card>
                        <CardHeader>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-sm'>绿色差异</CardTitle>
                                {greenDiffImageData && (
                                    <Button size='sm' variant='outline' onClick={handleDownloadGreenDiff}>
                                        <Download className='mr-2 h-3 w-3' />
                                        下载
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {greenDiffImageUrl ? (
                                <img
                                    src={greenDiffImageUrl}
                                    alt='Green Difference'
                                    className='w-full h-auto rounded-lg border bg-[repeating-pattern]'
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                    }}
                                />
                            ) : (
                                <div className='flex items-center justify-center h-32 text-sm text-muted-foreground border rounded-lg'>
                                    点击"提取绿色"按钮生成
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 统计信息 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm'>统计信息</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
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
            )}
        </div>
    );
}
