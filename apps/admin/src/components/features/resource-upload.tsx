import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUploadResource } from '@/lib/hooks/use-resources';

interface ResourceUploadProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bundleOptions: string[];
    onSuccess?: () => void;
}

export function ResourceUpload({ open, onOpenChange, bundleOptions, onSuccess }: ResourceUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedBundle, setSelectedBundle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();
    const uploadResource = useUploadResource();

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

        if (!selectedBundle.trim()) {
            toast({
                title: '错误',
                description: '请选择或输入 bundle',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const total = selectedFiles.length;
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                try {
                    const alias = file.name.replace(/\.[^/.]+$/, '');
                    await uploadResource.mutateAsync({
                        file,
                        alias,
                        bundle: selectedBundle,
                    });
                    successCount++;
                } catch (error: any) {
                    console.error(`上传 ${file.name} 失败:`, error);
                    failCount++;
                }
                setUploadProgress(((i + 1) / total) * 100);
            }

            toast({
                title: '上传完成',
                description: `成功: ${successCount}, 失败: ${failCount}`,
            });

            setSelectedFiles([]);
            setSelectedBundle('');
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: '上传失败',
                description: error.message || '上传资源失败',
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
                    <DialogTitle>上传资源</DialogTitle>
                    <DialogDescription>选择文件并指定 bundle</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='bundle'>Bundle</Label>
                        <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                            <SelectTrigger>
                                <SelectValue placeholder='选择或输入 bundle' />
                            </SelectTrigger>
                            <SelectContent>
                                {bundleOptions.map(bundle => (
                                    <SelectItem key={bundle} value={bundle}>
                                        {bundle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder='或输入新的 bundle 名称'
                            value={selectedBundle}
                            onChange={e => setSelectedBundle(e.target.value)}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='files'>文件</Label>
                        <Input
                            id='files'
                            type='file'
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                        {selectedFiles.length > 0 && (
                            <div className='space-y-2'>
                                <div className='text-sm text-muted-foreground'>已选择 {selectedFiles.length} 个文件</div>
                                <div className='max-h-40 space-y-1 overflow-y-auto'>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className='flex items-center justify-between rounded border p-2'>
                                            <span className='text-sm'>{file.name}</span>
                                            <Button
                                                variant='ghost'
                                                size='icon'
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
                            <div className='text-sm text-muted-foreground'>上传中... {Math.round(uploadProgress)}%</div>
                            <Progress value={uploadProgress} />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={uploading}>
                        取消
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                        <Upload className='mr-2 h-4 w-4' />
                        上传
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

