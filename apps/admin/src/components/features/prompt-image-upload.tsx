import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePromptVariants, useUploadBasePromptImages, useUploadPromptImages } from '@/lib/hooks/use-prompts';
import { Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { FilePreview } from './file-preview';

interface PromptImageUploadProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    characterPromptId: number;
    basePromptId?: number;
    onSuccess?: () => void;
}

export function PromptImageUpload({
    open,
    onOpenChange,
    characterPromptId,
    basePromptId,
    onSuccess,
}: PromptImageUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const uploadCharacterMutation = useUploadPromptImages();
    const uploadBaseMutation = useUploadBasePromptImages();

    // 获取变体列表
    const { data: variants = [] } = usePromptVariants(
        basePromptId,
        characterPromptId || undefined,
    );

    // 根据是否有 characterPromptId 决定使用哪个 mutation
    const isBasePromptUpload = !characterPromptId && !!basePromptId;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
        }
        // 重置 input，允许重复选择相同文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 当对话框关闭时，清空文件列表
    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setSelectedFiles([]);
            setUploadProgress(0);
            setSelectedVariantId(undefined);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
        onOpenChange(open);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast({
                title: '错误',
                description: '请先选择文件',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        setUploadProgress(10); // 开始上传

        try {
            // 模拟上传进度
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            if (isBasePromptUpload && basePromptId) {
                await uploadBaseMutation.mutateAsync({
                    basePromptId,
                    files: selectedFiles,
                    variantId: selectedVariantId,
                });
            } else if (characterPromptId) {
                await uploadCharacterMutation.mutateAsync({
                    characterPromptId,
                    files: selectedFiles,
                    variantId: selectedVariantId,
                });
            } else {
                throw new Error('请指定 Base Prompt 或 Character Prompt');
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            toast({
                title: '上传完成',
                description: `成功上传 ${selectedFiles.length} 个文件`,
            });

            // 延迟一下再关闭，让用户看到完成状态
            setTimeout(() => {
                setSelectedFiles([]);
                setUploadProgress(0);
                onOpenChange(false);
                onSuccess?.();
            }, 500);
        } catch (error: any) {
            toast({
                title: '上传失败',
                description: error.message || '上传图片失败',
                variant: 'destructive',
            });
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className='max-w-3xl max-h-[90vh] overflow-auto'>
                <DialogHeader>
                    <DialogTitle>上传图片（支持多选）</DialogTitle>
                    <DialogDescription>
                        可以选择多张图片一次性上传，最多支持 20 张图片。可以多次选择文件，已选择的文件会累积显示。
                        {isBasePromptUpload ? '（上传到 Base Prompt）' : '（上传到 Character Prompt）'}
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    {/* 变体选择 */}
                    {variants.length > 0 && (
                        <div className='space-y-2'>
                            <Label htmlFor='variant-select'>选择变体（可选）</Label>
                            <Select
                                value={selectedVariantId?.toString() || 'none'}
                                onValueChange={value => {
                                    setSelectedVariantId(value === 'none' ? undefined : parseInt(value, 10));
                                }}
                                disabled={uploading}
                            >
                                <SelectTrigger id='variant-select'>
                                    <SelectValue placeholder='选择变体（留空则上传到未分类）' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='none'>未分类</SelectItem>
                                    {variants.map(variant => (
                                        <SelectItem key={variant.id} value={variant.id.toString()}>
                                            {variant.name}
                                            {variant.isDefault && ' (默认)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className='text-xs text-muted-foreground'>
                                选择变体后，上传的图片将自动分类到该变体。留空则上传到未分类。
                            </p>
                        </div>
                    )}

                    <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                            <Input
                                ref={fileInputRef}
                                id='files'
                                type='file'
                                multiple
                                accept='image/*'
                                onChange={handleFileSelect}
                                disabled={uploading}
                                className='flex-1'
                            />
                            {selectedFiles.length > 0 && (
                                <Button variant='outline' size='sm' onClick={clearAllFiles} disabled={uploading}>
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    清空
                                </Button>
                            )}
                        </div>
                        {selectedFiles.length > 0 && (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-sm font-medium'>已选择 {selectedFiles.length} 个文件</div>
                                    <div className='text-xs text-muted-foreground'>可以继续选择更多文件</div>
                                </div>
                                <div className='grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 max-h-[400px] overflow-y-auto p-2 border rounded-lg'>
                                    {selectedFiles.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className='group relative rounded-lg border bg-card p-3 space-y-2'
                                        >
                                            <FilePreview file={file} size='thumbnail' />
                                            <div className='space-y-1'>
                                                <p className='text-xs font-medium truncate' title={file.name}>
                                                    {file.name}
                                                </p>
                                                <p className='text-xs text-muted-foreground'>
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80'
                                                onClick={() => removeFile(index)}
                                                disabled={uploading}
                                            >
                                                <X className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {uploading && (
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between text-sm'>
                                <span className='text-muted-foreground'>上传中...</span>
                                <span className='font-medium'>{Math.round(uploadProgress)}%</span>
                            </div>
                            <Progress value={uploadProgress} />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => handleDialogClose(false)} disabled={uploading}>
                        取消
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                        {uploading ? (
                            <>
                                <Upload className='mr-2 h-4 w-4 animate-spin' />
                                上传中... ({selectedFiles.length} 个文件)
                            </>
                        ) : (
                            <>
                                <Upload className='mr-2 h-4 w-4' />
                                上传 {selectedFiles.length > 0 ? `(${selectedFiles.length} 个文件)` : ''}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
