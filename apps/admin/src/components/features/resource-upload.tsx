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
import { useReplaceResourceFile, useUpdateResource, useUploadResource } from '@/lib/hooks/use-resources';
import { formatFileSize } from '@/lib/utils/resource-utils';
import { ResourceResponseDto, UpdateResourceDto } from '@lourd-game/shared';
import { Save, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FilePreview } from './file-preview';

interface ResourceUploadProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bundleOptions: string[];
    bundleTypeMap?: Map<string, 'common' | 'chapter' | 'mixed'>; // Bundle 名称到类型的映射
    defaultBundle?: string;
    defaultBundleType?: string;
    defaultAlias?: string;
    resourceToEdit?: ResourceResponseDto | null;
    onSuccess?: () => void;
}

export function ResourceUpload({
    open,
    onOpenChange,
    bundleOptions,
    bundleTypeMap,
    defaultBundle,
    defaultBundleType,
    defaultAlias,
    resourceToEdit,
    onSuccess,
}: ResourceUploadProps) {
    const isEditMode = !!resourceToEdit;
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedBundle, setSelectedBundle] = useState(defaultBundle || '');
    const [newBundleType, setNewBundleType] = useState<'common' | 'chapter'>('chapter');
    const [alias, setAlias] = useState(defaultAlias || '');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();
    const uploadResource = useUploadResource();
    const updateResource = useUpdateResource();
    const replaceResourceFile = useReplaceResourceFile();

    // 判断是否是新 Bundle（不在现有列表中）
    const isNewBundle = useMemo(() => {
        if (!selectedBundle.trim()) return false;
        return !bundleOptions.includes(selectedBundle.trim());
    }, [selectedBundle, bundleOptions]);

    // 获取选中 Bundle 的类型
    const getBundleType = (bundleName: string): string => {
        if (isEditMode && resourceToEdit) {
            // 编辑模式下，如果更改了 Bundle，使用新 Bundle 的类型，否则保持原类型
            if (bundleName === resourceToEdit.bundle) {
                return resourceToEdit.bundleType || 'chapter';
            }
        }
        // 如果是新 Bundle，使用用户选择的类型
        if (isNewBundle) {
            return newBundleType;
        }
        // 如果是已存在的 Bundle，从映射中获取类型
        if (bundleTypeMap) {
            const type = bundleTypeMap.get(bundleName);
            if (type && type !== 'mixed') {
                return type;
            }
        }
        return defaultBundleType || 'chapter';
    };

    // 当 defaultBundle 变化时更新 selectedBundle
    useEffect(() => {
        if (defaultBundle) {
            setSelectedBundle(defaultBundle);
        }
    }, [defaultBundle]);

    // 当编辑模式时，初始化表单
    useEffect(() => {
        if (isEditMode && resourceToEdit) {
            setAlias(resourceToEdit.alias);
            setSelectedBundle(resourceToEdit.bundle || '');
            setSelectedFiles([]);
        } else {
            setAlias(defaultAlias || '');
            setSelectedBundle(defaultBundle || '');
            setSelectedFiles([]);
        }
    }, [isEditMode, resourceToEdit, defaultBundle, defaultAlias]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (isEditMode) {
            // 编辑模式下只允许选择一个文件
            setSelectedFiles(files.slice(0, 1));
        } else {
            // 上传模式下可以多选
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (isEditMode) {
            // 编辑模式：更新资源信息或替换文件
            if (!resourceToEdit || !alias.trim()) {
                toast({
                    title: '错误',
                    description: '请输入别名',
                    variant: 'destructive',
                });
                return;
            }

            setUploading(true);
            setUploadProgress(0);

            try {
                const bundleType = getBundleType(selectedBundle.trim());
                const dto: UpdateResourceDto = {
                    alias: alias.trim(),
                    bundle: selectedBundle.trim() || undefined,
                    bundleType: bundleType,
                };

                if (selectedFiles.length > 0) {
                    // 如果选择了新文件，替换文件
                    const file = selectedFiles[0]; // 编辑模式下只支持单个文件
                    setUploadProgress(50);
                    await replaceResourceFile.mutateAsync({
                        id: resourceToEdit.id,
                        file,
                        dto,
                    });
                    toast({
                        title: '成功',
                        description: '资源文件已替换',
                    });
                } else {
                    // 只更新元数据
                    await updateResource.mutateAsync({ id: resourceToEdit.id, dto });
                    toast({
                        title: '成功',
                        description: '资源更新成功',
                    });
                }
                setUploadProgress(100);
                onOpenChange(false);
                onSuccess?.();
            } catch (error: any) {
                toast({
                    title: '更新失败',
                    description: error.message || '更新资源失败',
                    variant: 'destructive',
                });
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        } else {
            // 上传模式：上传新文件
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
                    description: '请输入或选择 bundle',
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

                const bundleType = getBundleType(selectedBundle.trim());
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    try {
                        const fileAlias = alias.trim() || file.name.replace(/\.[^/.]+$/, '');
                        await uploadResource.mutateAsync({
                            file,
                            alias: fileAlias,
                            bundle: selectedBundle.trim(),
                            bundleType: bundleType,
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
                setSelectedBundle(defaultBundle || '');
                setAlias('');
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
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑资源' : '上传资源'}</DialogTitle>
                    <DialogDescription>{isEditMode ? '修改资源信息' : '选择文件并指定 bundle'}</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    {!isEditMode && (
                        <div className='space-y-2'>
                            <Label htmlFor='alias'>别名（可选，留空则使用文件名）</Label>
                            <Input
                                id='alias'
                                placeholder='资源别名'
                                value={alias}
                                onChange={e => setAlias(e.target.value)}
                                disabled={uploading}
                            />
                        </div>
                    )}
                    {isEditMode && (
                        <>
                            <div className='space-y-2'>
                                <Label htmlFor='edit-alias'>别名 *</Label>
                                <Input
                                    id='edit-alias'
                                    value={alias}
                                    onChange={e => setAlias(e.target.value)}
                                    disabled={uploading}
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='edit-files'>替换文件（可选）</Label>
                                <Input
                                    id='edit-files'
                                    type='file'
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                    accept='*/*'
                                />
                                {selectedFiles.length > 0 && (
                                    <div className='space-y-4'>
                                        <div className='text-sm text-muted-foreground'>
                                            已选择 {selectedFiles.length} 个文件（将替换当前文件）
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
                                                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                            <span>{formatFileSize(file.size)}</span>
                                                            <span>{file.type || '未知类型'}</span>
                                                        </div>
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
                        </>
                    )}
                    <div className='space-y-2'>
                        <Label htmlFor='bundle'>Bundle *</Label>
                        <Select
                            value={
                                selectedBundle && bundleOptions.includes(selectedBundle) ? selectedBundle : undefined
                            }
                            onValueChange={value => setSelectedBundle(value || '')}
                            disabled={uploading}
                        >
                            <SelectTrigger id='bundle'>
                                <SelectValue placeholder='选择或输入 bundle' />
                            </SelectTrigger>
                            <SelectContent>
                                {bundleOptions.map(bundle => {
                                    const bundleType = bundleTypeMap?.get(bundle);
                                    const typeLabel =
                                        bundleType === 'common'
                                            ? '（共通）'
                                            : bundleType === 'chapter'
                                            ? '（章节）'
                                            : '';
                                    return (
                                        <SelectItem key={bundle} value={bundle}>
                                            {bundle} {typeLabel}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder='或输入新的 bundle 名称'
                            value={selectedBundle}
                            onChange={e => setSelectedBundle(e.target.value)}
                            disabled={uploading}
                        />
                        {isNewBundle && (
                            <div className='space-y-2'>
                                <Label htmlFor='new-bundle-type'>新 Bundle 类型 *</Label>
                                <Select
                                    value={newBundleType}
                                    onValueChange={value => setNewBundleType(value as 'common' | 'chapter')}
                                    disabled={uploading}
                                >
                                    <SelectTrigger id='new-bundle-type'>
                                        <SelectValue placeholder='选择 Bundle 类型' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='common'>共通资源包</SelectItem>
                                        <SelectItem value='chapter'>章节资源包</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className='text-sm text-muted-foreground'>
                                    {newBundleType === 'common'
                                        ? '共通资源包：一次性加载，所有章节共享'
                                        : '章节资源包：按章节加载，每个章节独立'}
                                </p>
                            </div>
                        )}
                    </div>
                    {!isEditMode && (
                        <div className='space-y-2'>
                            <Label htmlFor='files'>文件</Label>
                            <Input id='files' type='file' multiple onChange={handleFileSelect} disabled={uploading} />
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
                                                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>{file.type || '未知类型'}</span>
                                                    </div>
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
                    )}
                    {uploading && (
                        <div className='space-y-2'>
                            <div className='text-sm text-muted-foreground'>
                                {isEditMode ? '更新中...' : '上传中...'} {Math.round(uploadProgress)}%
                            </div>
                            <Progress value={uploadProgress} />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={uploading}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            uploading || (!isEditMode && selectedFiles.length === 0) || (isEditMode && !alias.trim())
                        }
                    >
                        {uploading ? (
                            <>
                                <Upload className='mr-2 h-4 w-4 animate-spin' />
                                {isEditMode ? '保存中...' : '上传中...'}
                            </>
                        ) : (
                            <>
                                {isEditMode ? (
                                    <>
                                        <Save className='mr-2 h-4 w-4' />
                                        保存
                                    </>
                                ) : (
                                    <>
                                        <Upload className='mr-2 h-4 w-4' />
                                        上传
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
