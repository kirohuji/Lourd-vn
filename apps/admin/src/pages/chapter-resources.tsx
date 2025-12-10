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
import {
    useAddResourceToChapter,
    useChapterResources,
    useRemoveResourceFromChapter,
} from '@/lib/hooks/use-chapter-resources';
import { useChapter } from '@/lib/hooks/use-chapters';
import { useAllResources, useResources } from '@/lib/hooks/use-resources';
import { cn } from '@/lib/utils';
import { ResourceResponseDto } from '@lourd-game/shared';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ChapterResourcesPage() {
    const navigate = useNavigate();
    const { chapterId } = useParams<{ chapterId: string }>();
    const chapterIdNum = chapterId ? Number(chapterId) : 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [resourceToRemove, setResourceToRemove] = useState<ResourceResponseDto | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [availableResourcesPage, setAvailableResourcesPage] = useState(1);
    const [availableResourcesSearch, setAvailableResourcesSearch] = useState('');
    const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
    const [isAddingBundles, setIsAddingBundles] = useState(false);

    const { toast } = useToast();
    const { data: chapter } = useChapter(chapterIdNum);

    // 获取章节使用的资源
    const { data: chapterResourcesData, isLoading: isLoadingChapterResources } = useChapterResources(chapterIdNum, {
        page,
        limit: 20,
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

    const chapterResources = chapterResourcesData?.data || [];
    const chapterResourceIds = useMemo(() => new Set(chapterResources.map(r => r.id)), [chapterResources]);

    const availableResources = useMemo(() => {
        if (!allResourcesData) return [];
        return allResourcesData.data.filter(r => !chapterResourceIds.has(r.id));
    }, [allResourcesData, chapterResourceIds]);

    // 按 Bundle 分组资源
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
        } catch (error: any) {
            toast({ title: '移除失败', description: error.message || '从章节移除资源失败', variant: 'destructive' });
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
            // 批量添加，使用 Promise.all 并行处理
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

    if (!chapterId || isNaN(chapterIdNum)) {
        return <div className='p-4 text-center text-muted-foreground'>请先选择一个章节</div>;
    }

    const handleBack = () => {
        if (chapter?.projectId) {
            navigate(`/admin/projects/${chapter.projectId}/chapters`);
        } else {
            navigate('/admin/projects');
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <Button variant='ghost' size='icon' onClick={handleBack} title='返回'>
                        <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <h2 className='text-2xl font-bold'>
                        章节资源视图 {chapter ? `- ${chapter.name}` : `(章节ID: ${chapterId})`}
                    </h2>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    添加资源
                </Button>
            </div>

            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder='搜索资源...' />

            {isLoadingChapterResources ? (
                <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin' />
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
                                    <TableHead>类型</TableHead>
                                    <TableHead>文件类型</TableHead>
                                    <TableHead>大小</TableHead>
                                    <TableHead>上传者ID</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chapterResources.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className='text-center py-8 text-muted-foreground'>
                                            该章节暂无资源
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    chapterResources.map(resource => (
                                        <TableRow key={resource.id}>
                                            <TableCell>{resource.id}</TableCell>
                                            <TableCell className='font-medium'>{resource.alias}</TableCell>
                                            <TableCell>{resource.bundle}</TableCell>
                                            <TableCell>{resource.bundleType || 'chapter'}</TableCell>
                                            <TableCell>{resource.fileType || '-'}</TableCell>
                                            <TableCell>{(resource.fileSize / 1024).toFixed(2)} KB</TableCell>
                                            <TableCell>{resource.uploaderId}</TableCell>
                                            <TableCell>
                                                {new Date(resource.createdAt).toLocaleString('zh-CN')}
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => {
                                                        setResourceToRemove(resource);
                                                        setRemoveConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className='h-4 w-4 text-destructive' />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {chapterResourcesData && chapterResourcesData.totalPages > 1 && (
                        <Pagination
                            page={page}
                            totalPages={chapterResourcesData.totalPages}
                            total={chapterResourcesData.total}
                            onPageChange={setPage}
                        />
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

            {/* 移除确认对话框 */}
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
        </div>
    );
}
