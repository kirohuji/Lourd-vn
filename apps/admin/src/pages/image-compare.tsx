import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { compareImages, imageDataToDataURL, loadImageFromFile } from '@/lib/utils/image-compare';
import { Image, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

export function ImageComparePage() {
    const [image1, setImage1] = useState<File | null>(null);
    const [image2, setImage2] = useState<File | null>(null);
    const [image1Preview, setImage1Preview] = useState<string | null>(null);
    const [image2Preview, setImage2Preview] = useState<string | null>(null);
    const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
    const [comparing, setComparing] = useState(false);
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
            const result = await compareImages(image1, image2);
            const diffUrl = imageDataToDataURL(result.diffImageData);
            setDiffImageUrl(diffUrl);
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

    // 清除图片1
    const clearImage1 = () => {
        setImage1(null);
        setImage1Preview(null);
        setDiffImageUrl(null);
        setCompareResult(null);
        if (file1InputRef.current) {
            file1InputRef.current.value = '';
        }
    };

    // 清除图片2
    const clearImage2 = () => {
        setImage2(null);
        setImage2Preview(null);
        setDiffImageUrl(null);
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
                    <p className='text-sm text-muted-foreground mt-1'>
                        上传两张图片，使用 pixelmatch 进行像素级比较
                    </p>
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
                                <img
                                    src={image1Preview}
                                    alt='Image 1'
                                    className='w-full h-auto rounded-lg border'
                                />
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
                                <p className='text-sm text-muted-foreground'>
                                    点击或拖拽上传图片
                                </p>
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
                                <img
                                    src={image2Preview}
                                    alt='Image 2'
                                    className='w-full h-auto rounded-lg border'
                                />
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
                                <p className='text-sm text-muted-foreground'>
                                    点击或拖拽上传图片
                                </p>
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
                <div className='grid grid-cols-4 gap-4'>
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
                            <CardTitle className='text-sm'>差异图</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <img
                                src={diffImageUrl}
                                alt='Difference'
                                className='w-full h-auto rounded-lg border'
                            />
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
                                <p className='text-lg font-semibold'>
                                    {compareResult.diffPercentage.toFixed(2)}%
                                </p>
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
                                <p className='text-sm font-medium'>
                                    {compareResult.totalPixels.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

