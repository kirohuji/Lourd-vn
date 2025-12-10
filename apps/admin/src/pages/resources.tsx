import { Pagination } from '@/components/features/pagination';
import { ResourceUpload } from '@/components/features/resource-upload';
import { SearchBar } from '@/components/features/search-bar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDeleteResource, useMigrateResourceToCos, useResources, useUpdateResource } from '@/lib/hooks/use-resources';
import { ResourceResponseDto, UpdateResourceDto } from '@lourd-game/shared';
import { Cloud, Edit, ExternalLink, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export function ResourcesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [bundleFilter, setBundleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceResponseDto | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [resourceToEdit, setResourceToEdit] = useState<ResourceResponseDto | null>(null);
    const [editAlias, setEditAlias] = useState('');
    const [editBundle, setEditBundle] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [migratingId, setMigratingId] = useState<number | null>(null);

    const { toast } = useToast();
    const { data, isLoading, refetch } = useResources({
        page,
        limit: 20,
        bundle: bundleFilter === 'all' ? undefined : bundleFilter,
        search: searchQuery || undefined,
    });
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();
    const migrateToCos = useMigrateResourceToCos();

    const resources = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const bundleOptions = useMemo(() => {
        const set = new Set<string>();
        resources.forEach(r => {
            if (r.bundle) set.add(r.bundle);
        });
        return Array.from(set).sort();
    }, [resources]);

    const handleEdit = (resource: ResourceResponseDto) => {
        setResourceToEdit(resource);
        setEditAlias(resource.alias);
        setEditBundle(resource.bundle || '');
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!resourceToEdit || !editAlias.trim()) {
            toast({
                title: '错误',
                description: '请输入别名',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: UpdateResourceDto = {
                alias: editAlias.trim(),
                bundle: editBundle.trim() || undefined,
            };
            await updateResource.mutateAsync({ id: resourceToEdit.id, dto });
            toast({
                title: '成功',
                description: '资源更新成功',
            });
            setEditDialogOpen(false);
            setResourceToEdit(null);
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error.message || '更新资源失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!resourceToDelete) return;

        try {
            await deleteResource.mutateAsync(resourceToDelete.id);
            toast({
                title: '成功',
                description: `已删除资源: ${resourceToDelete.alias}`,
            });
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除资源失败',
                variant: 'destructive',
            });
        }
    };

    const handleMigrateToCos = async (id: number) => {
        setMigratingId(id);
        try {
            await migrateToCos.mutateAsync(id);
            toast({
                title: '成功',
                description: '资源已迁移到 COS',
            });
        } catch (error: any) {
            toast({
                title: '迁移失败',
                description: error.message || '迁移资源失败',
                variant: 'destructive',
            });
        } finally {
            setMigratingId(null);
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>资源管理</h1>
                <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => refetch()}>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        刷新
                    </Button>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                        <Plus className='mr-2 h-4 w-4' />
                        上传资源
                    </Button>
                </div>
            </div>

            <div className='flex gap-2'>
                <SearchBar
                    placeholder='搜索资源别名...'
                    value={searchQuery}
                    onChange={value => {
                        setSearchQuery(value);
                        setPage(1);
                    }}
                    className='flex-1'
                />
                <Select
                    value={bundleFilter}
                    onValueChange={value => {
                        setBundleFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder='筛选 Bundle' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>全部</SelectItem>
                        {bundleOptions.map(bundle => (
                            <SelectItem key={bundle} value={bundle}>
                                {bundle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : (
                <>
                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>别名</TableHead>
                                    <TableHead>Bundle</TableHead>
                                    <TableHead>文件类型</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                                            暂无资源
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    resources.map(resource => (
                                        <TableRow key={resource.id}>
                                            <TableCell>{resource.id}</TableCell>
                                            <TableCell className='font-medium'>{resource.alias}</TableCell>
                                            <TableCell>{resource.bundle || '-'}</TableCell>
                                            <TableCell>{resource.fileType || '-'}</TableCell>
                                            <TableCell>
                                                <a
                                                    href={resource.src}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='flex items-center gap-1 text-primary hover:underline'
                                                >
                                                    <ExternalLink className='h-3 w-3' />
                                                    查看
                                                </a>
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleEdit(resource)}
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleMigrateToCos(resource.id)}
                                                        disabled={migratingId === resource.id}
                                                        title='迁移到 COS'
                                                    >
                                                        <Cloud className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setResourceToDelete(resource);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className='h-4 w-4 text-destructive' />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </>
            )}

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除资源 "{resourceToDelete?.alias}" 吗？此操作不可恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑资源</DialogTitle>
                        <DialogDescription>修改资源信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-alias'>别名 *</Label>
                            <Input id='edit-alias' value={editAlias} onChange={e => setEditAlias(e.target.value)} />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-bundle'>Bundle</Label>
                            <Input id='edit-bundle' value={editBundle} onChange={e => setEditBundle(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveEdit}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ResourceUpload
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                bundleOptions={bundleOptions}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
