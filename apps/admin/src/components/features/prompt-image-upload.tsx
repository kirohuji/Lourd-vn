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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useUploadPromptImages } from '@/lib/hooks/use-prompts';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import { FilePreview } from './file-preview';

interface PromptImageUploadProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    characterPromptId: number;
    onSuccess?: () => void;
}

export function PromptImageUpload({
    open,
    onOpenChange,
    characterPromptId,
    onSuccess,
}: PromptImageUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();
    const uploadMutation = useUploadPromptImages();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
        setUploadProgress(0);

        try {
            await uploadMutation.mutateAsync({
                characterPromptId,
                files: selectedFiles,
            });

            toast({
                title: '上传完成',
                description: `成功上传 ${selectedFiles.length} 个文件`,
            });

            setSelectedFiles([]);
            setUploadProgress(0);
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: '上传失败',
                description: error.message || '上传图片失败',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>上传图片</DialogTitle>
                    <DialogDescription>选择图片文件并上传到 Character Prompt</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Input
                            id='files'
                            type='file'
                            multiple
                            accept='image/*'
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                        {selectedFiles.length > 0 && (
                            <div className='space-y-4'>
                                <div className='text-sm text-muted-foreground'>
                                    已选择 {selectedFiles.length} 个文件
                                </div>
                                <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 max-h-[400px] overflow-y-auto'>
                                    {selectedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className='group relative rounded-lg border bg-card p-3 space-y-2'
                                        >
                                            <FilePreview file={file} size='thumbnail' />
                                            <div className='space-y-1'>
                                                <p className='text-sm font-medium truncate' title={file.name}>
                                                    {file.name}
                                                </p>
                                            </div>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity'
                                                onClick={() => removeFile(index)}
                                                disabled={uploading}
                                            >
                                                <X className='h-4 w-4' />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {uploading && (
                        <div className='space-y-2'>
                            <div className='text-sm text-muted-foreground'>
                                上传中... {Math.round(uploadProgress)}%
                            </div>
                            <Progress value={uploadProgress} />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={uploading}>
                        取消
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                        {uploading ? (
                            <>
                                <Upload className='mr-2 h-4 w-4 animate-spin' />
                                上传中...
                            </>
                        ) : (
                            <>
                                <Upload className='mr-2 h-4 w-4' />
                                上传
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

