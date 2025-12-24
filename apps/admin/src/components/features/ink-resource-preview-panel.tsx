import { ResourceResponseDto } from '@lourd-game/shared';
import { Button } from '@/components/ui/button';
import { ResourcePreview } from './resource-preview';
import { ResourceLayerPreview } from './resource-layer-preview';
import { X, Package, Image as ImageIcon } from 'lucide-react';

interface InkResourcePreviewPanelProps {
    type: 'bundle' | 'resource' | 'resourceGroup';
    bundleName?: string;
    resources: ResourceResponseDto[];
    onClose: () => void;
}

export function InkResourcePreviewPanel({
    type,
    bundleName,
    resources,
    onClose,
}: InkResourcePreviewPanelProps) {
    const getTitle = () => {
        switch (type) {
            case 'bundle':
                return `Bundle: ${bundleName || '未知'}`;
            case 'resource':
                return `资源: ${resources[0]?.alias || '未知'}`;
            case 'resourceGroup':
                return `资源组合 (${resources.length} 个资源)`;
            default:
                return '资源预览';
        }
    };

    return (
        <div className='border-t bg-card p-4 space-y-4 max-h-[400px] overflow-y-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    {type === 'bundle' ? (
                        <Package className='h-5 w-5 text-muted-foreground' />
                    ) : (
                        <ImageIcon className='h-5 w-5 text-muted-foreground' />
                    )}
                    <h3 className='text-lg font-semibold'>{getTitle()}</h3>
                    {bundleName && type !== 'bundle' && (
                        <span className='text-sm text-muted-foreground'>Bundle: {bundleName}</span>
                    )}
                </div>
                <Button variant='ghost' size='icon' onClick={onClose}>
                    <X className='h-4 w-4' />
                </Button>
            </div>

            {type === 'resourceGroup' && resources.length > 0 && (
                <div className='border rounded-lg p-4 bg-muted/30'>
                    <ResourceLayerPreview resources={resources} width={400} height={400} />
                </div>
            )}

            {resources.length > 0 && (
                <div className='space-y-2'>
                    <div className='text-sm font-medium'>资源列表 ({resources.length} 个)</div>
                    <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3'>
                        {resources.map(resource => (
                            <div
                                key={resource.id}
                                className='rounded-lg border bg-card p-2 space-y-1 hover:shadow-md transition-shadow'
                            >
                                <ResourcePreview resource={resource} size='thumbnail' />
                                <p className='text-xs font-medium truncate' title={resource.alias}>
                                    {resource.alias}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {resources.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                    <p>未找到相关资源</p>
                </div>
            )}
        </div>
    );
}

