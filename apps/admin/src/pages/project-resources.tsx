import { BundleResourceGroup } from '@/components/features/bundle-resource-group';
import { BundleInfo as BundleInfoType, BundleTable } from '@/components/features/bundle-table';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    useAddResourceToProject,
    useProjectResources,
    useRemoveResourceFromProject,
} from '@/lib/hooks/use-project-resources';
import { useResources } from '@/lib/hooks/use-resources';
import { ResourceResponseDto } from '@lourd-game/shared';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface BundleInfo extends BundleInfoType {
    resources: ResourceResponseDto[];
}

export function ProjectResourcesPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = projectId ? Number(projectId) : 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [resourceToRemove, setResourceToRemove] = useState<ResourceResponseDto | null>(null);
    const [bundleToRemove, setBundleToRemove] = useState<string | null>(null);
    const [removeBundleConfirmOpen, setRemoveBundleConfirmOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [availableResourcesPage, setAvailableResourcesPage] = useState(1);

    const { toast } = useToast();

    // 获取项目使用的所有资源（不分页，用于构建 Bundle 列表）
    const { data: allProjectResourcesData, isLoading: isLoadingAllProjectResources } = useProjectResources(
        projectIdNum,
        {
            page: 1,
            limit: 1000, // 获取所有资源以构建 Bundle 列表
            search: searchQuery || undefined,
        },
    );

    // 获取项目使用的资源（分页，用于显示选中 Bundle 的资源）
    const {
        data: projectResourcesData,
        isLoading: isLoadingProjectResources,
        refetch: refetchProjectResources,
    } = useProjectResources(projectIdNum, {
        page,
        limit: 20,
        bundle: selectedBundle || undefined,
        search: searchQuery || undefined,
    });

    // 获取所有可用资源（用于添加到项目）
    const { data: allResourcesData, isLoading: isLoadingAllResources } = useResources({
        page: availableResourcesPage,
        limit: 20,
    });

    const addResourceMutation = useAddResourceToProject();
    const removeResourceMutation = useRemoveResourceFromProject();

    // 构建 Bundle 信息
    const bundleInfo: BundleInfo[] = useMemo(() => {
        if (!allProjectResourcesData?.data) return [];

        // 按 Bundle 分组
        const bundleMap = new Map<string, ResourceResponseDto[]>();
        allProjectResourcesData.data.forEach(resource => {
            const bundleName = resource.bundle || '未分类';
            if (!bundleMap.has(bundleName)) {
                bundleMap.set(bundleName, []);
            }
            bundleMap.get(bundleName)!.push(resource);
        });

        // 转换为 BundleInfo 数组
        return Array.from(bundleMap.entries())
            .map(([name, resources]) => {
                // 确定 Bundle 类型
                const bundleTypes = new Set(resources.map(r => r.bundleType || 'chapter'));
                let bundleType: 'common' | 'chapter' | 'mixed' = 'chapter';
                if (bundleTypes.size === 1) {
                    bundleType = (Array.from(bundleTypes)[0] as 'common' | 'chapter') || 'chapter';
                } else if (bundleTypes.size > 1) {
                    bundleType = 'mixed';
                }

                // 获取创建时间（使用最早资源的创建时间）
                const createdAt =
                    resources.reduce((earliest, r) => {
                        const resourceDate = new Date(r.createdAt);
                        return !earliest || resourceDate < earliest ? resourceDate : earliest;
                    }, null as Date | null) || new Date();

                return {
                    name,
                    resourceCount: resources.length,
                    bundleType,
                    createdAt,
                    resources: [], // Bundle 列表不包含资源详情
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allProjectResourcesData]);

    // 默认选中第一个 Bundle
    useEffect(() => {
        if (!selectedBundle && bundleInfo.length > 0) {
            setSelectedBundle(bundleInfo[0].name);
            setPage(1);
        }
    }, [bundleInfo, selectedBundle]);

    // 当选中 Bundle 改变时，重置到第一页
    useEffect(() => {
        if (selectedBundle) {
            setPage(1);
        }
    }, [selectedBundle]);

    // 当前页的资源
    const paginatedResources = projectResourcesData?.data || [];
    const totalPages = projectResourcesData?.totalPages || 1;
    const total = projectResourcesData?.total || 0;

    // 过滤出未添加到项目的资源
    const availableResources = useMemo(() => {
        if (!allResourcesData?.data || !allProjectResourcesData?.data) {
            return allResourcesData?.data || [];
        }
        const projectResourceIds = new Set(allProjectResourcesData.data.map(r => r.id));
        return allResourcesData.data.filter(r => !projectResourceIds.has(r.id));
    }, [allResourcesData, allProjectResourcesData]);

    const getBundleTypeLabel = (type: 'common' | 'chapter' | 'mixed') => {
        switch (type) {
            case 'common':
                return '共通资源包';
            case 'chapter':
                return '章节资源包';
            case 'mixed':
                return '混合';
            default:
                return '-';
        }
    };

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
            refetchProjectResources();
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
            refetchProjectResources();
        } catch (error: any) {
            toast({
                title: '错误',
                description: error.message || '移除资源失败',
                variant: 'destructive',
            });
        }
    };

    const handleRemoveBundle = async () => {
        if (!bundleToRemove || !allProjectResourcesData?.data) return;
        try {
            // 获取该 Bundle 下的所有资源
            const bundleResources = allProjectResourcesData.data.filter(r => (r.bundle || '未分类') === bundleToRemove);
            if (bundleResources.length === 0) {
                toast({ title: '提示', description: '该 Bundle 下没有资源' });
                setRemoveBundleConfirmOpen(false);
                setBundleToRemove(null);
                return;
            }

            // 批量删除资源关联
            let successCount = 0;
            let failCount = 0;
            const results = await Promise.allSettled(
                bundleResources.map(resource =>
                    removeResourceMutation.mutateAsync({
                        projectId: projectIdNum,
                        resourceId: resource.id,
                    }),
                ),
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`移除资源 ${bundleResources[index].alias} 失败:`, result.reason);
                }
            });

            toast({
                title: '批量移除完成',
                description: `成功: ${successCount}, 失败: ${failCount}`,
                variant: successCount > 0 && failCount === 0 ? 'default' : 'destructive',
            });

            setRemoveBundleConfirmOpen(false);
            setBundleToRemove(null);
            if (selectedBundle === bundleToRemove) {
                setSelectedBundle(null);
            }
            refetchProjectResources();
        } catch (error: any) {
            toast({
                title: '移除失败',
                description: error.message || '移除 Bundle 失败',
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
        <div className='flex flex-col space-y-4'>
            {/* 顶部操作栏 */}
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>项目资源管理</h1>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        onClick={() => {
                            refetchProjectResources();
                        }}
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        刷新
                    </Button>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className='mr-2 h-4 w-4' />
                        添加资源
                    </Button>
                </div>
            </div>

            {/* 搜索 */}
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
            </div>

            {/* Bundle 表格 */}
            {isLoadingAllProjectResources ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : bundleInfo.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-8 text-center'>
                    <p className='text-muted-foreground'>项目暂无资源</p>
                    <Button onClick={() => setAddDialogOpen(true)} className='mt-4'>
                        <Plus className='mr-2 h-4 w-4' />
                        添加第一个资源
                    </Button>
                </div>
            ) : (
                <>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold'>Bundle 列表</h2>
                    </div>
                    <div className='flex-1 overflow-auto min-h-0'>
                        <BundleTable
                            bundles={bundleInfo}
                            selectedBundle={selectedBundle}
                            onSelectBundle={setSelectedBundle}
                            getBundleTypeLabel={getBundleTypeLabel}
                            showActions={false}
                            showDelete={true}
                            onDelete={bundleName => {
                                setBundleToRemove(bundleName);
                                setRemoveBundleConfirmOpen(true);
                            }}
                        />
                    </div>

                    {/* 资源预览 */}
                    {selectedBundle && (
                        <div className='border-t pt-4 flex-shrink-0'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold'>
                                    {selectedBundle} 的资源 ({total} 个)
                                </h3>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setSelectedBundle(null)}
                                    title='关闭资源列表'
                                >
                                    <X className='mr-2 h-4 w-4' />
                                    关闭
                                </Button>
                            </div>
                            {isLoadingProjectResources ? (
                                <div className='flex justify-center p-8'>
                                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                                </div>
                            ) : paginatedResources.length > 0 ? (
                                <>
                                    <BundleResourceGroup bundle={selectedBundle} resources={paginatedResources} />
                                    {/* 分页 */}
                                    {totalPages > 1 && (
                                        <div className='mt-4'>
                                            <Pagination
                                                page={page}
                                                totalPages={totalPages}
                                                total={total}
                                                onPageChange={setPage}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='text-center text-muted-foreground py-8'>
                                    <p>该 Bundle 暂无资源</p>
                                </div>
                            )}
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

            {/* 移除资源确认对话框 */}
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

            {/* 移除 Bundle 确认对话框 */}
            <AlertDialog open={removeBundleConfirmOpen} onOpenChange={setRemoveBundleConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认移除 Bundle</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要从项目中移除 Bundle "{bundleToRemove}"
                            下的所有资源吗？这不会删除资源本身，只是移除项目与这些资源的关联。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveBundle}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            disabled={removeResourceMutation.isPending}
                        >
                            {removeResourceMutation.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    移除中...
                                </>
                            ) : (
                                '确认移除'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
