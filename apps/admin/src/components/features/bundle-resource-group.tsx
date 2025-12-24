import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/resource-utils';
import { ResourceResponseDto } from '@lourd-game/shared';
import { Cloud, Edit, Plus, Trash2 } from 'lucide-react';
import { ResourcePreview } from './resource-preview';

interface BundleResourceGroupProps {
    bundle: string;
    resources: ResourceResponseDto[];
    onUpload?: (bundle: string) => void;
    onEdit?: (resource: ResourceResponseDto) => void;
    onDelete?: (resource: ResourceResponseDto) => void;
    onMigrateToCos?: (id: number) => void;
    migratingId?: number | null;
}

export function BundleResourceGroup({
    bundle,
    resources,
    onUpload,
    onEdit,
    onDelete,
    onMigrateToCos,
    migratingId,
}: BundleResourceGroupProps) {
    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>共 {resources.length} 个资源</div>
                {onUpload && (
                    <Button size='sm' onClick={() => onUpload(bundle)}>
                        <Plus className='mr-2 h-4 w-4' />
                        上传到 {bundle}
                    </Button>
                )}
            </div>
            <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4'>
                {resources.map(resource => (
                    <div
                        key={resource.id}
                        className='group relative rounded-lg border bg-card p-3 space-y-2 hover:shadow-md transition-shadow'
                    >
                        <ResourcePreview resource={resource} size='thumbnail' />
                        <div className='space-y-1'>
                            <p className='text-sm font-medium truncate' title={resource.alias}>
                                {resource.alias}
                            </p>
                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                <span>{formatFileSize(resource.fileSize)}</span>
                                <span>{resource.bundleType || 'chapter'}</span>
                            </div>
                        </div>
                        {onDelete && (
                            <div
                                className={cn(
                                    'absolute top-2 right-2 flex items-center justify-end gap-1 transition-opacity z-10',
                                    onEdit || onMigrateToCos ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
                                )}
                            >
                                {onEdit || onMigrateToCos ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' size='icon' className='h-7 w-7'>
                                                <span className='sr-only'>更多操作</span>
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                >
                                                    <circle cx='12' cy='12' r='1' />
                                                    <circle cx='12' cy='5' r='1' />
                                                    <circle cx='12' cy='19' r='1' />
                                                </svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end'>
                                            {onEdit && (
                                                <DropdownMenuItem onClick={() => onEdit(resource)}>
                                                    <Edit className='mr-2 h-4 w-4' />
                                                    编辑
                                                </DropdownMenuItem>
                                            )}
                                            {onMigrateToCos && (
                                                <DropdownMenuItem
                                                    onClick={() => onMigrateToCos(resource.id)}
                                                    disabled={migratingId === resource.id}
                                                >
                                                    <Cloud className='mr-2 h-4 w-4' />
                                                    迁移到 COS
                                                </DropdownMenuItem>
                                            )}
                                            {onDelete && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(resource)}
                                                    className='text-destructive focus:text-destructive'
                                                >
                                                    <Trash2 className='mr-2 h-4 w-4' />
                                                    删除
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-7 w-7 text-destructive hover:text-destructive'
                                        onClick={() => onDelete(resource)}
                                        title='删除'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
