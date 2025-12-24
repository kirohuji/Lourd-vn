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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { useChapter, useDeleteChapter, useUpdateChapter } from '@/lib/hooks/use-chapters';
import { Edit, Loader2, Package, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ChapterPropertiesProps {
    chapterId: number;
    projectId: number;
}

export function ChapterProperties({ chapterId, projectId }: ChapterPropertiesProps) {
    const { data: chapter, isLoading, refetch } = useChapter(chapterId);
    const { toast } = useToast();
    const navigate = useNavigate();
    const updateChapter = useUpdateChapter();
    const deleteChapter = useDeleteChapter();

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);

    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editOrder, setEditOrder] = useState(0);
    const [editRequireAd, setEditRequireAd] = useState(false);
    const [editEnabled, setEditEnabled] = useState(true);

    useEffect(() => {
        if (chapter) {
            setEditName(chapter.name);
            setEditDescription(chapter.description || '');
            setEditOrder(chapter.order);
            setEditRequireAd(chapter.requireAd);
            setEditEnabled(chapter.enabled);
        }
    }, [chapter]);

    const handleEdit = () => {
        if (chapter) {
            setEditDialogOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!chapter) return;
        if (!editName.trim()) {
            toast({
                title: '错误',
                description: '请输入章节名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            await updateChapter.mutateAsync({
                id: chapter.id,
                dto: {
                    name: editName.trim(),
                    description: editDescription.trim() || undefined,
                    order: editOrder,
                    requireAd: editRequireAd,
                    enabled: editEnabled,
                },
            });
            toast({ title: '成功', description: '章节更新成功' });
            setEditDialogOpen(false);
            await refetch();
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error?.message || '更新章节失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!chapter) return;
        try {
            await deleteChapter.mutateAsync(chapter.id);
            toast({ title: '成功', description: '章节删除成功' });
            setDeleteConfirmOpen(false);
            navigate(`/admin/projects/${projectId}/chapters`);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error?.message || '删除章节失败',
                variant: 'destructive',
            });
        }
    };

    const handleGenerateBundle = async () => {
        if (!chapterId) return;
        try {
            setIsGeneratingBundle(true);
            await apiClient.generateChapterBundle(chapterId);
            await refetch();
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

    if (isLoading) {
        return (
            <div className='flex h-full w-80 items-center justify-center border-l bg-card'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className='flex h-full w-80 items-center justify-center border-l bg-card p-4 text-center text-sm text-muted-foreground'>
                章节不存在
            </div>
        );
    }

    return (
        <div className='flex h-full w-80 flex-col border-l bg-card'>
            <div className='border-b p-4'>
                <h3 className='text-sm font-semibold'>章节属性</h3>
            </div>

            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                <Card>
                    <CardHeader>
                        <CardTitle className='text-sm'>基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div>
                            <Label className='text-xs text-muted-foreground'>名称</Label>
                            <p className='text-sm font-medium'>{chapter.name}</p>
                        </div>
                        {chapter.description && (
                            <div>
                                <Label className='text-xs text-muted-foreground'>描述</Label>
                                <p className='text-sm'>{chapter.description}</p>
                            </div>
                        )}
                        <div>
                            <Label className='text-xs text-muted-foreground'>排序</Label>
                            <p className='text-sm'>{chapter.order}</p>
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground'>章节ID</Label>
                            <p className='text-sm font-mono'>{chapter.id}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className='text-sm'>状态</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='flex items-center justify-between'>
                            <Label className='text-xs'>启用</Label>
                            <Switch checked={chapter.enabled} disabled />
                        </div>
                        <div className='flex items-center justify-between'>
                            <Label className='text-xs'>需要广告</Label>
                            <Switch checked={chapter.requireAd} disabled />
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground'>起始Ink ID</Label>
                            <p className='text-sm font-mono'>{chapter.startInkId ?? '未设置'}</p>
                        </div>
                    </CardContent>
                </Card>

                {chapter.chapterBundleVersion && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm'>资源包</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <Label className='text-xs text-muted-foreground'>版本号</Label>
                                <p className='text-sm font-mono'>{chapter.chapterBundleVersion}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className='space-y-2'>
                    <Button variant='outline' className='w-full' onClick={handleEdit}>
                        <Edit className='mr-2 h-4 w-4' />
                        编辑章节
                    </Button>
                    <Button
                        variant='outline'
                        className='w-full'
                        onClick={handleGenerateBundle}
                        disabled={isGeneratingBundle}
                    >
                        {isGeneratingBundle ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                打包中...
                            </>
                        ) : (
                            <>
                                <Package className='mr-2 h-4 w-4' />
                                生成资源包
                            </>
                        )}
                    </Button>
                    <Button
                        variant='outline'
                        className='w-full text-destructive hover:text-destructive'
                        onClick={() => setDeleteConfirmOpen(true)}
                    >
                        <Trash2 className='mr-2 h-4 w-4' />
                        删除章节
                    </Button>
                </div>
            </div>

            {/* 编辑对话框 */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑章节</DialogTitle>
                        <DialogDescription>修改章节的基本信息和设置</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-name'>章节名称 *</Label>
                            <Input
                                id='edit-name'
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder='请输入章节名称'
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-description'>描述</Label>
                            <Textarea
                                id='edit-description'
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                placeholder='请输入章节描述（可选）'
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-order'>排序</Label>
                            <Input
                                id='edit-order'
                                type='number'
                                value={editOrder}
                                onChange={e => setEditOrder(Number(e.target.value) || 0)}
                                placeholder='0'
                            />
                        </div>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='edit-require-ad'>需要广告</Label>
                            <Switch id='edit-require-ad' checked={editRequireAd} onCheckedChange={setEditRequireAd} />
                        </div>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='edit-enabled'>启用</Label>
                            <Switch id='edit-enabled' checked={editEnabled} onCheckedChange={setEditEnabled} />
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

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除章节 "{chapter.name}" 吗？此操作不可恢复。
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
        </div>
    );
}
