import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Cloud, Edit, Loader2, Upload } from 'lucide-react';

export interface BundleInfo {
    name: string;
    resourceCount: number;
    bundleType: 'common' | 'chapter' | 'mixed';
    createdAt: Date;
}

interface BundleTableProps {
    bundles: BundleInfo[];
    selectedBundle: string | null;
    onSelectBundle: (bundleName: string) => void;
    onUpload: (bundleName: string) => void;
    onEdit: (bundleName: string) => void;
    onMigrateToCos: (bundleName: string) => void;
    migratingBundle: string | null;
    getBundleTypeLabel: (type: 'common' | 'chapter' | 'mixed') => string;
}

export function BundleTable({
    bundles,
    selectedBundle,
    onSelectBundle,
    onUpload,
    onEdit,
    onMigrateToCos,
    migratingBundle,
    getBundleTypeLabel,
}: BundleTableProps) {
    return (
        <div className='flex-1 overflow-auto border rounded-md'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Bundle 名称</TableHead>
                        <TableHead>资源数量</TableHead>
                        <TableHead>Bundle 类型</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className='text-right'>操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bundles.map(bundle => (
                        <TableRow
                            key={bundle.name}
                            className={cn(
                                'cursor-pointer hover:bg-muted/50',
                                selectedBundle === bundle.name && 'bg-muted',
                            )}
                            onClick={() => onSelectBundle(bundle.name)}
                        >
                            <TableCell className='font-medium'>{bundle.name}</TableCell>
                            <TableCell>{bundle.resourceCount}</TableCell>
                            <TableCell>{getBundleTypeLabel(bundle.bundleType)}</TableCell>
                            <TableCell>{new Date(bundle.createdAt).toLocaleString('zh-CN')}</TableCell>
                            <TableCell className='text-right' onClick={e => e.stopPropagation()}>
                                <div className='flex items-center justify-end gap-2'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => onEdit(bundle.name)}
                                        title='编辑Bundle'
                                    >
                                        <Edit className='mr-2 h-4 w-4' />
                                        编辑
                                    </Button>
                                    <Button variant='ghost' size='sm' onClick={() => onUpload(bundle.name)}>
                                        <Upload className='mr-2 h-4 w-4' />
                                        上传
                                    </Button>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => onMigrateToCos(bundle.name)}
                                        disabled={migratingBundle === bundle.name || bundle.resourceCount === 0}
                                        title='迁移该 Bundle 下的所有资源到 COS'
                                    >
                                        {migratingBundle === bundle.name ? (
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        ) : (
                                            <Cloud className='mr-2 h-4 w-4' />
                                        )}
                                        迁移到 COS
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
