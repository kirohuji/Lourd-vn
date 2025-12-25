import { useState } from 'react';
import { PromptImageResponseDto } from '@lourd-game/shared';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptImagePreviewProps {
    image: PromptImageResponseDto;
    size?: 'thumbnail' | 'medium' | 'large';
    showModal?: boolean;
    onPreviewClick?: () => void;
    onDelete?: () => void;
}

export function PromptImagePreview({
    image,
    size = 'thumbnail',
    showModal = false,
    onPreviewClick,
    onDelete,
}: PromptImagePreviewProps) {
    const [previewOpen, setPreviewOpen] = useState(false);

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
                    'relative flex items-center justify-center w-full h-full overflow-hidden cursor-pointer',
                    size === 'thumbnail' && '',
                    size === 'medium' && '',
                    size === 'large' && '',
                )}
                onClick={handleClick}
            >
                <img
                    src={image.imageUrl}
                    alt={`Prompt Image ${image.id}`}
                    className={cn(
                        'w-full h-full object-cover transition-transform duration-300 group-hover:scale-110',
                        sizeClasses[size],
                    )}
                    onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                {/* 悬停遮罩层 */}
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300' />
                {onDelete && (
                    <Button
                        variant='destructive'
                        size='icon'
                        className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10 hover:scale-110'
                        onClick={e => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <X className='h-4 w-4' />
                    </Button>
                )}
            </div>

            {/* 详细预览对话框 */}
            <Dialog open={previewOpen || showModal} onOpenChange={setPreviewOpen}>
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto'>
                    <DialogHeader>
                        <DialogTitle>Prompt Image #{image.id}</DialogTitle>
                        <DialogDescription>
                            状态: {image.status === 'uploaded' ? '已上传' : '已生成'} | 创建时间:{' '}
                            {new Date(image.createdAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='flex justify-center'>
                            <img
                                src={image.imageUrl}
                                alt={`Prompt Image ${image.id}`}
                                className='max-w-full max-h-[70vh] object-contain rounded-lg'
                                onError={e => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className='space-y-2'>
                            <div className='text-sm font-medium'>生成的 Prompt:</div>
                            <div className='p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-words'>
                                {image.generatedPrompt}
                            </div>
                        </div>
                        <div className='flex justify-end gap-2'>
                            <Button variant='outline' asChild>
                                <a href={image.imageUrl} target='_blank' rel='noopener noreferrer'>
                                    <ExternalLink className='mr-2 h-4 w-4' />
                                    在新窗口打开
                                </a>
                            </Button>
                            <Button variant='outline' asChild>
                                <a href={image.imageUrl} download>
                                    <Download className='mr-2 h-4 w-4' />
                                    下载
                                </a>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

