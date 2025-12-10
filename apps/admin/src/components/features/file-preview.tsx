import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/resource-utils';
import { File, Image, Music } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FilePreviewProps {
    file: File;
    size?: 'thumbnail' | 'medium' | 'large';
    showModal?: boolean;
    onPreviewClick?: () => void;
}

/**
 * 判断文件是否为图片
 */
function isImageFile(file: File): boolean {
    return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.name);
}

/**
 * 判断文件是否为音频
 */
function isAudioFile(file: File): boolean {
    return file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
}

/**
 * 获取文件类型图标
 */
function getFileTypeIcon(file: File) {
    if (isImageFile(file)) {
        return Image;
    }
    if (isAudioFile(file)) {
        return Music;
    }
    return File;
}

export function FilePreview({ file, size = 'thumbnail', showModal = false, onPreviewClick }: FilePreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const FileIcon = getFileTypeIcon(file);
    const isImage = isImageFile(file);
    const isAudio = isAudioFile(file);

    // 创建预览 URL
    useEffect(() => {
        if (isImage || isAudio) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [file, isImage, isAudio]);

    const sizeClasses = {
        thumbnail: 'max-w-[200px] max-h-[200px]',
        medium: 'max-w-[400px] max-h-[400px]',
        large: 'max-w-[800px] max-h-[600px]',
    };

    const handleClick = () => {
        if (onPreviewClick) {
            onPreviewClick();
        } else {
            setPreviewOpen(true);
        }
    };

    return (
        <>
            <div
                className={cn(
                    'relative flex items-center justify-center rounded-lg border bg-muted/50 overflow-hidden cursor-pointer hover:bg-muted transition-colors',
                    size === 'thumbnail' && 'w-[200px] h-[200px]',
                    size === 'medium' && 'w-[400px] h-[400px]',
                    size === 'large' && 'w-[800px] h-[600px]',
                )}
                onClick={handleClick}
            >
                {isImage && previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={file.name}
                        className={cn('object-contain', sizeClasses[size])}
                        onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                ) : isAudio && previewUrl ? (
                    <div className='w-full p-4'>
                        <audio
                            src={previewUrl}
                            controls
                            className='w-full'
                            preload='metadata'
                            onError={e => {
                                console.error('Audio load error:', e);
                            }}
                        >
                            您的浏览器不支持音频播放
                        </audio>
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center p-4 space-y-2'>
                        <FileIcon className='h-12 w-12 text-muted-foreground' />
                        <span className='text-sm text-muted-foreground text-center truncate max-w-full'>
                            {file.name}
                        </span>
                        <span className='text-xs text-muted-foreground'>{formatFileSize(file.size)}</span>
                    </div>
                )}
            </div>

            {/* 详细预览对话框 */}
            <Dialog open={previewOpen || showModal} onOpenChange={setPreviewOpen}>
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto'>
                    <DialogHeader>
                        <DialogTitle>{file.name}</DialogTitle>
                        <DialogDescription>
                            类型: {file.type || '未知'} | {formatFileSize(file.size)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {isImage && previewUrl ? (
                            <div className='flex justify-center'>
                                <img
                                    src={previewUrl}
                                    alt={file.name}
                                    className='max-w-full max-h-[70vh] object-contain rounded-lg'
                                    onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            </div>
                        ) : isAudio && previewUrl ? (
                            <div className='space-y-4'>
                                <audio src={previewUrl} controls className='w-full' preload='auto'>
                                    您的浏览器不支持音频播放
                                </audio>
                            </div>
                        ) : (
                            <div className='flex flex-col items-center justify-center p-8 space-y-4'>
                                <FileIcon className='h-24 w-24 text-muted-foreground' />
                                <div className='text-center space-y-2'>
                                    <p className='text-lg font-medium'>{file.name}</p>
                                    <p className='text-sm text-muted-foreground'>文件类型: {file.type || '未知'}</p>
                                    <p className='text-sm text-muted-foreground'>大小: {formatFileSize(file.size)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
