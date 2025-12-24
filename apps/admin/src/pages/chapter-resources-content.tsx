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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import {
    useAddResourceToChapter,
    useChapterResources,
    useRemoveResourceFromChapter,
} from '@/lib/hooks/use-chapter-resources';
import { useChapter } from '@/lib/hooks/use-chapters';
import { useAllResources, useResources } from '@/lib/hooks/use-resources';
import { cn } from '@/lib/utils';
import { ResourceResponseDto } from '@lourd-game/shared';
import { FileText, Folder, Loader2, Package, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ChapterResourcesContentProps {
    chapterId: number;
}

export function ChapterResourcesContent({ chapterId }: ChapterResourcesContentProps) {
    const chapterIdNum = chapterId;
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [resourceToRemove, setResourceToRemove] = useState<ResourceResponseDto | null>(null);
    const [bundleToRemove, setBundleToRemove] = useState<string | null>(null);
    const [removeBundleConfirmOpen, setRemoveBundleConfirmOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [availableResourcesPage, setAvailableResourcesPage] = useState(1);
    const [availableResourcesSearch, setAvailableResourcesSearch] = useState('');
    const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
    const [isAddingBundles, setIsAddingBundles] = useState(false);
    const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
    const [bundleDirTreeDialogOpen, setBundleDirTreeDialogOpen] = useState(false);
    const hasInitialized = useRef(false);

    const { toast } = useToast();
    const { data: chapter, refetch: refetchChapter } = useChapter(chapterIdNum);

    // 获取章节使用的所有资源（不分页，用于构建 Bundle 列表）
    const { data: allChapterResourcesData, isLoading: isLoadingAllChapterResources } = useChapterResources(
        chapterIdNum,
        {
            page: 1,
            limit: 1000,
            search: searchQuery || undefined,
        },
    );

    // 获取章节使用的资源（分页，用于显示选中 Bundle 的资源）
    const {
        data: chapterResourcesData,
        isLoading: isLoadingChapterResources,
        refetch: refetchChapterResources,
    } = useChapterResources(chapterIdNum, {
        page,
        limit: 20,
        bundle: selectedBundle || undefined,
        search: searchQuery || undefined,
    });

    // 获取所有可用资源（用于添加到章节）
    const {
        data: allResourcesData,
        isLoading: isLoadingAllResources,
        refetch: refetchAllResources,
    } = useResources({
        page: availableResourcesPage,
        limit: 10,
        search: availableResourcesSearch || undefined,
    });

    // 获取所有资源（用于按 Bundle 分组）
    const { data: allResourcesDataForBundles, isLoading: isLoadingAllResourcesForBundles } = useAllResources();

    const addResourceMutation = useAddResourceToChapter();
    const removeResourceMutation = useRemoveResourceFromChapter();

    const allChapterResources = allChapterResourcesData?.data || [];
    const chapterResources = chapterResourcesData?.data || [];
    const chapterResourceIds = useMemo(() => new Set(allChapterResources.map(r => r.id)), [allChapterResources]);

    // 按 Bundle 分组章节资源
    const bundleInfo: BundleInfoType[] = useMemo(() => {
        const groups = new Map<
            string,
            {
                name: string;
                resourceCount: number;
                bundleType: 'common' | 'chapter' | 'mixed';
                createdAt: Date;
            }
        >();

        allChapterResources.forEach(resource => {
            const bundle = resource.bundle || '未分类';
            if (!groups.has(bundle)) {
                groups.set(bundle, {
                    name: bundle,
                    resourceCount: 0,
                    bundleType: (resource.bundleType as 'common' | 'chapter') || 'chapter',
                    createdAt: new Date(resource.createdAt),
                });
            }
            const group = groups.get(bundle)!;
            group.resourceCount++;
            // 更新创建时间为最早的资源创建时间
            const resourceDate = new Date(resource.createdAt);
            if (resourceDate < group.createdAt) {
                group.createdAt = resourceDate;
            }
        });

        return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allChapterResources]);

    // 默认选中第一个 Bundle（仅在初始加载时）
    useEffect(() => {
        if (!hasInitialized.current && bundleInfo.length > 0) {
            hasInitialized.current = true;
            setSelectedBundle(bundleInfo[0].name);
            setPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bundleInfo]);

    // 当选中 Bundle 改变时，重置到第一页
    useEffect(() => {
        if (selectedBundle) {
            setPage(1);
        }
    }, [selectedBundle]);

    const availableResources = useMemo(() => {
        if (!allResourcesData) return [];
        return allResourcesData.data.filter(r => !chapterResourceIds.has(r.id));
    }, [allResourcesData, chapterResourceIds]);

    // 按 Bundle 分组资源（用于添加对话框）
    const bundleGroups = useMemo(() => {
        if (!allResourcesDataForBundles) return [];
        const groups = new Map<
            string,
            {
                name: string;
                bundleType: string;
                resources: ResourceResponseDto[];
                addedCount: number;
                totalCount: number;
            }
        >();

        const allResources = allResourcesDataForBundles.data || [];
        allResources.forEach(resource => {
            const bundle = resource.bundle || '未分类';
            if (!groups.has(bundle)) {
                groups.set(bundle, {
                    name: bundle,
                    bundleType: resource.bundleType || 'chapter',
                    resources: [],
                    addedCount: 0,
                    totalCount: 0,
                });
            }
            const group = groups.get(bundle)!;
            group.resources.push(resource);
            group.totalCount++;
            if (chapterResourceIds.has(resource.id)) {
                group.addedCount++;
            }
        });

        return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allResourcesDataForBundles, chapterResourceIds]);

    const handleAddResource = async (resourceId: number) => {
        try {
            await addResourceMutation.mutateAsync({ chapterId: chapterIdNum, resourceId });
            toast({ title: '成功', description: '资源已添加到章节' });
            refetchAllResources();
            refetchChapterResources();
        } catch (error: any) {
            toast({ title: '添加失败', description: error.message || '添加资源到章节失败', variant: 'destructive' });
        }
    };

    const handleRemoveResource = async () => {
        if (!resourceToRemove) return;
        try {
            await removeResourceMutation.mutateAsync({ chapterId: chapterIdNum, resourceId: resourceToRemove.id });
            toast({ title: '成功', description: '资源已从章节移除' });
            setRemoveConfirmOpen(false);
            setResourceToRemove(null);
            refetchAllResources();
            refetchChapterResources();
        } catch (error: any) {
            toast({ title: '移除失败', description: error.message || '从章节移除资源失败', variant: 'destructive' });
        }
    };

    const handleRemoveBundle = async () => {
        if (!bundleToRemove) return;
        try {
            // 获取该 Bundle 下的所有资源
            const bundleResources = allChapterResources.filter(r => (r.bundle || '未分类') === bundleToRemove);
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
                    removeResourceMutation.mutateAsync({ chapterId: chapterIdNum, resourceId: resource.id }),
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
            refetchAllResources();
            refetchChapterResources();
        } catch (error: any) {
            toast({
                title: '移除失败',
                description: error.message || '移除 Bundle 失败',
                variant: 'destructive',
            });
        }
    };

    const handleToggleBundle = (bundleName: string) => {
        setSelectedBundles(prev => {
            const next = new Set(prev);
            if (next.has(bundleName)) {
                next.delete(bundleName);
            } else {
                next.add(bundleName);
            }
            return next;
        });
    };

    const handleAddBundles = async () => {
        if (selectedBundles.size === 0) {
            toast({
                title: '错误',
                description: '请至少选择一个 Bundle',
                variant: 'destructive',
            });
            return;
        }

        setIsAddingBundles(true);
        const bundleNames = Array.from(selectedBundles);
        const allResources = allResourcesDataForBundles?.data || [];
        const resourcesToAdd = allResources.filter(
            r => bundleNames.includes(r.bundle || '未分类') && !chapterResourceIds.has(r.id),
        );

        if (resourcesToAdd.length === 0) {
            toast({
                title: '提示',
                description: '选中的 Bundle 中所有资源已添加到章节',
            });
            setIsAddingBundles(false);
            setSelectedBundles(new Set());
            return;
        }

        let successCount = 0;
        let failCount = 0;

        try {
            const results = await Promise.allSettled(
                resourcesToAdd.map(resource =>
                    addResourceMutation.mutateAsync({
                        chapterId: chapterIdNum,
                        resourceId: resource.id,
                    }),
                ),
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`添加资源 ${resourcesToAdd[index].alias} 失败:`, result.reason);
                }
            });

            toast({
                title: '批量添加完成',
                description: `成功: ${successCount}, 失败: ${failCount}`,
                variant: successCount > 0 && failCount === 0 ? 'default' : 'destructive',
            });

            setSelectedBundles(new Set());
            refetchAllResources();
            refetchChapterResources();
        } catch (error: any) {
            toast({
                title: '批量添加失败',
                description: error.message || '批量添加资源失败',
                variant: 'destructive',
            });
        } finally {
            setIsAddingBundles(false);
        }
    };

    const handleGenerateBundle = async () => {
        if (!chapterIdNum) return;
        try {
            setIsGeneratingBundle(true);
            await apiClient.generateChapterBundle(chapterIdNum);
            await refetchChapter();
            toast({
                title: '打包成功',
                description: `版本号：${chapter?.chapterBundleVersion ?? ''}`,
            });
        } catch (error: any) {
            toast({
                title: '打包失败',
                description: error?.message || '生成章节资源包失败',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingBundle(false);
        }
    };

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

    const selectedBundleResources = chapterResources;
    const selectedBundleTotal = chapterResourcesData?.total || 0;
    const selectedBundleTotalPages = chapterResourcesData?.totalPages || 1;

    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>章节资源管理</h1>
                <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={handleGenerateBundle} disabled={isGeneratingBundle}>
                        {isGeneratingBundle ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                打包中...
                            </>
                        ) : (
                            <>
                                <Package className='mr-2 h-4 w-4' />
                                生成章节资源包
                            </>
                        )}
                    </Button>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className='mr-2 h-4 w-4' />
                        添加资源
                    </Button>
                </div>
            </div>

            <div className='flex gap-2'>
                <SearchBar
                    value={searchQuery}
                    onChange={value => {
                        setSearchQuery(value);
                        setPage(1);
                    }}
                    placeholder='搜索资源别名...'
                    className='flex-1'
                />
                {chapter?.bundleDirTree && (
                    <Button
                        variant='outline'
                        onClick={() => setBundleDirTreeDialogOpen(true)}
                        className='flex-shrink-0'
                    >
                        <Folder className='mr-2 h-4 w-4' />
                        打包目录预览
                    </Button>
                )}
            </div>

            {/* Bundle 表格 */}
            {isLoadingAllChapterResources ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : bundleInfo.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-8 text-center'>
                    <p className='text-muted-foreground'>暂无资源</p>
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

                    {/* 资源卡片列表 */}
                    {selectedBundle && (
                        <div className='border-t pt-4'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold'>
                                    {selectedBundle} 的资源 ({selectedBundleTotal} 个)
                                </h3>
                                <div className='flex items-center gap-2'>
                                    <Button variant='outline' size='sm' onClick={() => setAddDialogOpen(true)}>
                                        <Plus className='mr-2 h-4 w-4' />
                                        添加资源到此 Bundle
                                    </Button>
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
                            </div>
                            {isLoadingChapterResources ? (
                                <div className='flex justify-center p-8'>
                                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                                </div>
                            ) : selectedBundleResources.length > 0 ? (
                                <>
                                    <BundleResourceGroup bundle={selectedBundle} resources={selectedBundleResources} />
                                    {/* 分页 */}
                                    {selectedBundleTotalPages > 1 && (
                                        <div className='mt-4'>
                                            <Pagination
                                                page={page}
                                                totalPages={selectedBundleTotalPages}
                                                total={selectedBundleTotal}
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
                        <DialogTitle>添加资源到章节</DialogTitle>
                        <DialogDescription>从全局资源池中选择资源添加到当前章节</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue='single' className='w-full'>
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='single'>单个添加</TabsTrigger>
                            <TabsTrigger value='bundle'>按 Bundle 添加</TabsTrigger>
                        </TabsList>
                        <TabsContent value='single' className='space-y-4'>
                            <SearchBar
                                value={availableResourcesSearch}
                                onChange={setAvailableResourcesSearch}
                                placeholder='搜索可用资源...'
                            />
                            {isLoadingAllResources ? (
                                <div className='flex items-center justify-center py-8'>
                                    <Loader2 className='h-8 w-8 animate-spin' />
                                </div>
                            ) : (
                                <div className='max-h-96 overflow-y-auto rounded-md border'>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>别名</TableHead>
                                                <TableHead>Bundle</TableHead>
                                                <TableHead>类型</TableHead>
                                                <TableHead>文件类型</TableHead>
                                                <TableHead>大小</TableHead>
                                                <TableHead className='text-right'>操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {availableResources.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        className='text-center py-8 text-muted-foreground'
                                                    >
                                                        所有资源已添加到章节
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                availableResources.map(resource => (
                                                    <TableRow key={resource.id}>
                                                        <TableCell>{resource.id}</TableCell>
                                                        <TableCell className='font-medium'>{resource.alias}</TableCell>
                                                        <TableCell>{resource.bundle}</TableCell>
                                                        <TableCell>{resource.bundleType || 'chapter'}</TableCell>
                                                        <TableCell>{resource.fileType || '-'}</TableCell>
                                                        <TableCell>
                                                            {(resource.fileSize / 1024).toFixed(2)} KB
                                                        </TableCell>
                                                        <TableCell className='text-right'>
                                                            <Button
                                                                variant='outline'
                                                                size='sm'
                                                                onClick={() => handleAddResource(resource.id)}
                                                            >
                                                                添加
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            {allResourcesData && allResourcesData.totalPages > 1 && (
                                <Pagination
                                    page={availableResourcesPage}
                                    totalPages={allResourcesData.totalPages}
                                    total={allResourcesData.total}
                                    onPageChange={setAvailableResourcesPage}
                                />
                            )}
                        </TabsContent>
                        <TabsContent value='bundle' className='space-y-4'>
                            {isLoadingAllResourcesForBundles ? (
                                <div className='flex items-center justify-center py-8'>
                                    <Loader2 className='h-8 w-8 animate-spin' />
                                </div>
                            ) : (
                                <>
                                    <div className='max-h-96 overflow-y-auto rounded-md border'>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className='w-12'></TableHead>
                                                    <TableHead>Bundle 名称</TableHead>
                                                    <TableHead>Bundle 类型</TableHead>
                                                    <TableHead>资源总数</TableHead>
                                                    <TableHead>已添加</TableHead>
                                                    <TableHead>待添加</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bundleGroups.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            className='text-center py-8 text-muted-foreground'
                                                        >
                                                            暂无 Bundle
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    bundleGroups.map(bundle => {
                                                        const pendingCount = bundle.totalCount - bundle.addedCount;
                                                        const isSelected = selectedBundles.has(bundle.name);
                                                        const canSelect = pendingCount > 0;
                                                        return (
                                                            <TableRow
                                                                key={bundle.name}
                                                                className={cn(
                                                                    !canSelect && 'opacity-50',
                                                                    isSelected && 'bg-muted',
                                                                )}
                                                            >
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onCheckedChange={() =>
                                                                            handleToggleBundle(bundle.name)
                                                                        }
                                                                        disabled={!canSelect}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className='font-medium'>
                                                                    {bundle.name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {bundle.bundleType === 'common'
                                                                        ? '共通资源包'
                                                                        : bundle.bundleType === 'chapter'
                                                                        ? '章节资源包'
                                                                        : bundle.bundleType}
                                                                </TableCell>
                                                                <TableCell>{bundle.totalCount}</TableCell>
                                                                <TableCell>{bundle.addedCount}</TableCell>
                                                                <TableCell>
                                                                    {pendingCount > 0 ? (
                                                                        <span className='text-primary'>
                                                                            {pendingCount}
                                                                        </span>
                                                                    ) : (
                                                                        <span className='text-muted-foreground'>0</span>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {selectedBundles.size > 0 && (
                                        <div className='flex items-center justify-between rounded-md border p-4'>
                                            <span className='text-sm text-muted-foreground'>
                                                已选择 {selectedBundles.size} 个 Bundle
                                            </span>
                                            <Button onClick={handleAddBundles} disabled={isAddingBundles}>
                                                {isAddingBundles ? (
                                                    <>
                                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                        添加中...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className='mr-2 h-4 w-4' />
                                                        批量添加
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setAddDialogOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 打包目录预览对话框 */}
            {chapter?.bundleDirTree && (
                <Dialog open={bundleDirTreeDialogOpen} onOpenChange={setBundleDirTreeDialogOpen}>
                    <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle className='flex items-center gap-2'>
                                <Folder className='h-5 w-5' />
                                打包目录预览
                            </DialogTitle>
                            <DialogDescription>查看章节打包后的目录结构</DialogDescription>
                        </DialogHeader>
                        <div className='space-y-6 py-4'>
                            <div>
                                <div className='flex items-center gap-2 mb-3'>
                                    <FileText className='h-4 w-4' />
                                    <h3 className='font-semibold'>
                                        Ink 文件 (
                                        {Array.isArray(chapter.bundleDirTree.ink)
                                            ? chapter.bundleDirTree.ink.length
                                            : 0}
                                        )
                                    </h3>
                                </div>
                                {Array.isArray(chapter.bundleDirTree.ink) && chapter.bundleDirTree.ink.length > 0 ? (
                                    <div className='rounded-md border bg-muted/30 p-4 max-h-60 overflow-y-auto'>
                                        <div className='space-y-1'>
                                            {chapter.bundleDirTree.ink.map((p: string) => (
                                                <div
                                                    key={p}
                                                    className='text-sm text-muted-foreground font-mono px-2 py-1 rounded hover:bg-accent'
                                                >
                                                    {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className='text-sm text-muted-foreground py-4 text-center'>暂无 Ink 文件</div>
                                )}
                            </div>
                            <div>
                                <div className='flex items-center gap-2 mb-3'>
                                    <Package className='h-4 w-4' />
                                    <h3 className='font-semibold'>
                                        资源文件 (
                                        {Array.isArray(chapter.bundleDirTree.assets)
                                            ? chapter.bundleDirTree.assets.length
                                            : 0}
                                        )
                                    </h3>
                                </div>
                                {Array.isArray(chapter.bundleDirTree.assets) &&
                                chapter.bundleDirTree.assets.length > 0 ? (
                                    <div className='rounded-md border bg-muted/30 p-4 max-h-60 overflow-y-auto'>
                                        <div className='space-y-1'>
                                            {chapter.bundleDirTree.assets.map((p: string) => (
                                                <div
                                                    key={p}
                                                    className='text-sm text-muted-foreground font-mono px-2 py-1 rounded hover:bg-accent'
                                                >
                                                    {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className='text-sm text-muted-foreground py-4 text-center'>暂无资源文件</div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant='outline' onClick={() => setBundleDirTreeDialogOpen(false)}>
                                关闭
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* 移除资源确认对话框 */}
            <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认移除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要从章节中移除资源 "{resourceToRemove?.alias}"
                            吗？这不会删除资源本身，只是移除章节与资源的关联。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveResource}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            移除
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
                            确定要从章节中移除 Bundle "{bundleToRemove}"
                            下的所有资源吗？这不会删除资源本身，只是移除章节与这些资源的关联。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveBundle}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            disabled={removeResourceMutation.isPending}
                        >
                            {removeResourceMutation.isPending ? '移除中...' : '确认移除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
