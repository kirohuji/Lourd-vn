import { useState } from 'react';
import { ResourceResponseDto } from '@lourd-game/shared';
import { isImageFile, isAudioFile, getFileTypeIcon, formatFileSize } from '@/lib/utils/resource-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourcePreviewProps {
  resource: ResourceResponseDto;
  size?: 'thumbnail' | 'medium' | 'large';
  showModal?: boolean;
  onPreviewClick?: () => void;
}

export function ResourcePreview({
  resource,
  size = 'thumbnail',
  showModal = false,
  onPreviewClick,
}: ResourcePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const FileIcon = getFileTypeIcon(resource);
  const isImage = isImageFile(resource);
  const isAudio = isAudioFile(resource);

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
          'relative flex items-center justify-center rounded-lg border bg-muted/50 overflow-hidden cursor-pointer hover:bg-muted transition-colors w-full h-full',
          size === 'thumbnail' && 'min-w-[200px] min-h-[200px]',
          size === 'medium' && 'min-w-[400px] min-h-[400px]',
          size === 'large' && 'min-w-[800px] min-h-[600px]',
        )}
        onClick={handleClick}
      >
        {isImage ? (
          <img
            src={resource.src}
            alt={resource.alias}
            className={cn('w-full h-full object-contain', sizeClasses[size])}
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : isAudio ? (
          <div className='w-full p-4'>
            <audio
              src={resource.src}
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
              {resource.alias}
            </span>
            <span className='text-xs text-muted-foreground'>{formatFileSize(resource.fileSize)}</span>
          </div>
        )}
      </div>

      {/* 详细预览对话框 */}
      <Dialog open={previewOpen || showModal} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>{resource.alias}</DialogTitle>
            <DialogDescription>
              Bundle: {resource.bundle || '未分类'} | 类型: {resource.bundleType || 'chapter'} |{' '}
              {formatFileSize(resource.fileSize)}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {isImage ? (
              <div className='flex justify-center'>
                <img
                  src={resource.src}
                  alt={resource.alias}
                  className='max-w-full max-h-[70vh] object-contain rounded-lg'
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ) : isAudio ? (
              <div className='space-y-4'>
                <audio src={resource.src} controls className='w-full' preload='auto'>
                  您的浏览器不支持音频播放
                </audio>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-8 space-y-4'>
                <FileIcon className='h-24 w-24 text-muted-foreground' />
                <div className='text-center space-y-2'>
                  <p className='text-lg font-medium'>{resource.alias}</p>
                  <p className='text-sm text-muted-foreground'>
                    文件类型: {resource.fileType || '未知'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    大小: {formatFileSize(resource.fileSize)}
                  </p>
                </div>
              </div>
            )}
            <div className='flex justify-end gap-2'>
              <Button variant='outline' asChild>
                <a href={resource.src} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  在新窗口打开
                </a>
              </Button>
              <Button variant='outline' asChild>
                <a href={resource.src} download>
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

