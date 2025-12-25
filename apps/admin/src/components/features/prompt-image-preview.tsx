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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface PromptImagePreviewProps {
    image: PromptImageResponseDto;
    size?: 'thumbnail' | 'medium' | 'large';
    showModal?: boolean;
    onPreviewClick?: () => void;
    onDelete?: () => void;
    isSelected?: boolean;
    isSelectionMode?: boolean;
    onToggleSelect?: () => void;
}

export function PromptImagePreview({
    image,
    size = 'thumbnail',
    showModal = false,
    onPreviewClick,
    onDelete,
    isSelected = false,
    isSelectionMode = false,
    onToggleSelect,
}: PromptImagePreviewProps) {
    const [previewOpen, setPreviewOpen] = useState(false);

    const sizeClasses = {
        thumbnail: 'max-w-[200px] max-h-[200px]',
        medium: 'max-w-[400px] max-h-[400px]',
        large: 'max-w-[800px] max-h-[600px]',
    };

    const handleClick = (e: React.MouseEvent) => {
        // 如果是在选择模式下，点击复选框区域不触发预览
        if (isSelectionMode && onToggleSelect) {
            const target = e.target as HTMLElement;
            if (target.closest('[role="checkbox"]') || target.closest('button')) {
                return;
            }
            onToggleSelect();
            return;
        }

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
                    'relative flex items-center justify-center w-full h-full overflow-hidden',
                    isSelectionMode ? 'cursor-pointer' : 'cursor-pointer',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                )}
                onClick={handleClick}
            >
                <img
                    src={image.imageUrl}
                    alt={`Prompt Image ${image.id}`}
                    className={cn(
                        'w-full h-full object-cover transition-transform duration-300 group-hover:scale-110',
                        sizeClasses[size],
                        isSelected && 'opacity-75',
                    )}
                    onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                {/* 悬停遮罩层 */}
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300' />
                
                {/* 选择模式下的复选框 */}
                {isSelectionMode && (
                    <div className='absolute top-2 left-2 z-10'>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className='h-5 w-5 bg-background border-2 shadow-lg'
                        />
                    </div>
                )}

                {/* 非选择模式下的操作按钮 */}
                {!isSelectionMode && (
                    <div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10'>
                        {onDelete && (
                            <Button
                                variant='destructive'
                                size='icon'
                                className='h-7 w-7 shadow-lg hover:scale-110'
                                onClick={e => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                title='删除'
                            >
                                <X className='h-4 w-4' />
                            </Button>
                        )}
                    </div>
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
                        {/* Base Prompt 组 */}
                        {image.basePrompt && (
                            <div className='space-y-2'>
                                <div className='text-sm font-semibold'>Base Prompt:</div>
                                <div className='p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-words border-l-4 border-primary'>
                                    {image.basePrompt.basicPrompt}
                                </div>
                                {image.basePrompt.undesiredContent && (
                                    <div className='space-y-1'>
                                        <div className='text-xs font-medium text-muted-foreground'>Undesired Content:</div>
                                        <div className='p-2 bg-destructive/10 rounded-lg text-xs font-mono whitespace-pre-wrap break-words border-l-4 border-destructive'>
                                            {image.basePrompt.undesiredContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Character Prompt 组 */}
                        {image.characterPrompt && (
                            <div className='space-y-2'>
                                <div className='text-sm font-semibold'>Character Prompt:</div>
                                <div className='p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-words border-l-4 border-secondary'>
                                    {image.characterPrompt.basicPrompt}
                                </div>
                                {image.characterPrompt.undesiredContent && (
                                    <div className='space-y-1'>
                                        <div className='text-xs font-medium text-muted-foreground'>Undesired Content:</div>
                                        <div className='p-2 bg-destructive/10 rounded-lg text-xs font-mono whitespace-pre-wrap break-words border-l-4 border-destructive'>
                                            {image.characterPrompt.undesiredContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 变体合并 Prompt 组 */}
                        {image.variant && (
                            <div className='space-y-2'>
                                <div className='text-sm font-semibold'>
                                    变体合并 Prompt ({image.variant.name}):
                                </div>
                                <div className='p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-words border-l-4 border-accent'>
                                    {image.variant.mergedPrompt}
                                </div>
                            </div>
                        )}

                        {/* 如果没有分组信息，显示生成的 Prompt */}
                        {!image.basePrompt && !image.characterPrompt && (
                            <div className='space-y-2'>
                                <div className='text-sm font-medium'>生成的 Prompt:</div>
                                <div className='p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-words'>
                                    {image.generatedPrompt}
                                </div>
                            </div>
                        )}
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

