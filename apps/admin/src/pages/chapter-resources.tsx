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
    useAddResourceToChapter,
    useChapterResources,
    useRemoveResourceFromChapter,
} from '@/lib/hooks/use-chapter-resources';
import { useResources } from '@/lib/hooks/use-resources';
import { ResourceResponseDto } from '@lourd-game/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export function ChapterResourcesPage() {
    const { chapterId } = useParams<{ chapterId: string }>();
    const chapterIdNum = chapterId ? Number(chapterId) : 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [resourceToRemove, setResourceToRemove] = useState<ResourceResponseDto | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [availableResourcesPage, setAvailableResourcesPage] = useState(1);
    const [availableResourcesSearch, setAvailableResourcesSearch] = useState('');

    const { toast } = useToast();

    // 获取章节使用的资源
    const { data: chapterResourcesData, isLoading: isLoadingChapterResources } = useChapterResources(chapterIdNum, {
        page,
        limit: 20,
        search: searchQuery || undefined,
    });

    // 获取所有可用资源（用于添加到章节）
    const { data: allResourcesData, isLoading: isLoadingAllResources, refetch: refetchAllResources } = useResources({
        page: availableResourcesPage,
        limit: 10,
        search: availableResourcesSearch || undefined,
    });

    const addResourceMutation = useAddResourceToChapter();
    const removeResourceMutation = useRemoveResourceFromChapter();

    const chapterResources = chapterResourcesData?.data || [];

    const availableResources = useMemo(() => {
        if (!allResourcesData) return [];
        const chapterResourceIds = new Set(chapterResources.map(r => r.id));
        return allResourcesData.data.filter(r => !chapterResourceIds.has(r.id));
    }, [allResourcesData, chapterResources]);

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

    if (!chapterId || isNaN(chapterIdNum)) {
        return <div className='p-4 text-center text-muted-foreground'>请先选择一个章节</div>;
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold'>章节资源视图 (章节ID: {chapterId})</h2>
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
                                            <TableCell>{new Date(resource.createdAt).toLocaleString('zh-CN')}</TableCell>
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
                                            <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
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
                                                <TableCell>{(resource.fileSize / 1024).toFixed(2)} KB</TableCell>
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

