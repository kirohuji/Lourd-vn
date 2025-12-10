import { Pagination } from '@/components/features/pagination';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    useAddResourceToProject,
    useProjectResources,
    useRemoveResourceFromProject,
} from '@/lib/hooks/use-project-resources';
import { useResources } from '@/lib/hooks/use-resources';
import { ResourceResponseDto } from '@lourd-game/shared';
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export function ProjectResourcesPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = projectId ? Number(projectId) : 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [bundleFilter, setBundleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [resourceToRemove, setResourceToRemove] = useState<ResourceResponseDto | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [availableResourcesPage, setAvailableResourcesPage] = useState(1);

    const { toast } = useToast();

    // 获取项目使用的资源
    const { data: projectResourcesData, isLoading: isLoadingProjectResources } = useProjectResources(projectIdNum, {
        page,
        limit: 20,
        bundle: bundleFilter === 'all' ? undefined : bundleFilter,
        search: searchQuery || undefined,
    });

    // 获取所有可用资源（用于添加到项目）
    const { data: allResourcesData, isLoading: isLoadingAllResources } = useResources({
        page: availableResourcesPage,
        limit: 20,
        bundle: bundleFilter === 'all' ? undefined : bundleFilter,
    });

    const addResourceMutation = useAddResourceToProject();
    const removeResourceMutation = useRemoveResourceFromProject();

    // 过滤出未添加到项目的资源
    const availableResources = useMemo(() => {
        if (!allResourcesData?.data || !projectResourcesData?.data) {
            return allResourcesData?.data || [];
        }
        const projectResourceIds = new Set(projectResourcesData.data.map(r => r.id));
        return allResourcesData.data.filter(r => !projectResourceIds.has(r.id));
    }, [allResourcesData, projectResourcesData]);

    const handleAddResource = async (resource: ResourceResponseDto) => {
        try {
            await addResourceMutation.mutateAsync({
                projectId: projectIdNum,
                resourceId: resource.id,
            });
            toast({
                title: '成功',
                description: `已将资源 "${resource.alias}" 添加到项目`,
            });
            setAddDialogOpen(false);
        } catch (error: any) {
            toast({
                title: '错误',
                description: error.message || '添加资源失败',
                variant: 'destructive',
            });
        }
    };

    const handleRemoveResource = async () => {
        if (!resourceToRemove) return;
        try {
            await removeResourceMutation.mutateAsync({
                projectId: projectIdNum,
                resourceId: resourceToRemove.id,
            });
            toast({
                title: '成功',
                description: `已从项目移除资源 "${resourceToRemove.alias}"`,
            });
            setRemoveConfirmOpen(false);
            setResourceToRemove(null);
        } catch (error: any) {
            toast({
                title: '错误',
                description: error.message || '移除资源失败',
                variant: 'destructive',
            });
        }
    };

    if (!projectIdNum) {
        return (
            <div className='p-6'>
                <p className='text-muted-foreground'>无效的项目 ID</p>
            </div>
        );
    }

    return (
        <div className='p-6'>
            <div className='mb-6 flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>项目资源视图</h1>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    添加资源
                </Button>
            </div>

            <div className='mb-4 flex gap-4'>
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder='搜索资源...' className='flex-1' />
                <Select value={bundleFilter} onValueChange={setBundleFilter}>
                    <SelectTrigger className='w-48'>
                        <SelectValue placeholder='选择 Bundle' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>所有 Bundle</SelectItem>
                        {Array.from(new Set(projectResourcesData?.data?.map(r => r.bundle) || [])).map(bundle => (
                            <SelectItem key={bundle} value={bundle}>
                                {bundle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoadingProjectResources ? (
                <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                </div>
            ) : (
                <>
                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>别名</TableHead>
                                    <TableHead>Bundle</TableHead>
                                    <TableHead>文件大小</TableHead>
                                    <TableHead>文件类型</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectResourcesData?.data && projectResourcesData.data.length > 0 ? (
                                    projectResourcesData.data.map(resource => (
                                        <TableRow key={resource.id}>
                                            <TableCell className='font-medium'>{resource.alias}</TableCell>
                                            <TableCell>{resource.bundle}</TableCell>
                                            <TableCell>{(resource.fileSize / 1024).toFixed(2)} KB</TableCell>
                                            <TableCell>{resource.fileType || '-'}</TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => window.open(resource.src, '_blank')}
                                                    >
                                                        <ExternalLink className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => {
                                                            setResourceToRemove(resource);
                                                            setRemoveConfirmOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className='h-4 w-4 text-destructive' />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className='text-center text-muted-foreground'>
                                            暂无资源
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {projectResourcesData && projectResourcesData.totalPages > 1 && (
                        <div className='mt-4'>
                            <Pagination
                                page={page}
                                totalPages={projectResourcesData.totalPages}
                                total={projectResourcesData.total}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </>
            )}

            {/* 添加资源对话框 */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className='max-w-4xl'>
                    <DialogHeader>
                        <DialogTitle>添加资源到项目</DialogTitle>
                        <DialogDescription>从全局资源池中选择资源添加到当前项目</DialogDescription>
                    </DialogHeader>
                    <div className='max-h-96 overflow-y-auto'>
                        {isLoadingAllResources ? (
                            <div className='flex items-center justify-center py-12'>
                                <Loader2 className='h-8 w-8 animate-spin' />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>别名</TableHead>
                                        <TableHead>Bundle</TableHead>
                                        <TableHead>文件大小</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableResources.length > 0 ? (
                                        availableResources.map(resource => (
                                            <TableRow key={resource.id}>
                                                <TableCell className='font-medium'>{resource.alias}</TableCell>
                                                <TableCell>{resource.bundle}</TableCell>
                                                <TableCell>{(resource.fileSize / 1024).toFixed(2)} KB</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size='sm'
                                                        onClick={() => handleAddResource(resource)}
                                                        disabled={addResourceMutation.isPending}
                                                    >
                                                        {addResourceMutation.isPending ? (
                                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                        ) : (
                                                            <Plus className='mr-2 h-4 w-4' />
                                                        )}
                                                        添加
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className='text-center text-muted-foreground'>
                                                所有资源已添加到项目
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    {allResourcesData && allResourcesData.totalPages > 1 && (
                        <div className='mt-4'>
                            <Pagination
                                page={availableResourcesPage}
                                totalPages={allResourcesData.totalPages}
                                total={allResourcesData.total}
                                onPageChange={setAvailableResourcesPage}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setAddDialogOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 移除确认对话框 */}
            <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认移除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要从项目中移除资源 "{resourceToRemove?.alias}"
                            吗？这不会删除资源本身，只是移除项目与资源的关联。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveResource} disabled={removeResourceMutation.isPending}>
                            {removeResourceMutation.isPending ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : null}
                            确认移除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
