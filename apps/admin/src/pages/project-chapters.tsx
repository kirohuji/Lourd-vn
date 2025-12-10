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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useChapters, useCreateChapter, useDeleteChapter, useUpdateChapter } from '@/lib/hooks/use-chapters';
import { CreateChapterDto, UpdateChapterDto } from '@lourd-game/shared';
import { Edit, ExternalLink, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

export function ProjectChaptersPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = Number(projectId);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [chapterToDelete, setChapterToDelete] = useState<{ id: number; name: string } | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [chapterToEdit, setChapterToEdit] = useState<{
        id: number;
        name: string;
        description?: string;
        order: number;
        requireAd: boolean;
        enabled: boolean;
    } | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editOrder, setEditOrder] = useState(0);
    const [editRequireAd, setEditRequireAd] = useState(false);
    const [editEnabled, setEditEnabled] = useState(true);

    const { toast } = useToast();
    const { data: chapters, isLoading, refetch } = useChapters(projectIdNum);
    const createChapter = useCreateChapter();
    const updateChapter = useUpdateChapter();
    const deleteChapter = useDeleteChapter();

    if (!projectId || isNaN(projectIdNum)) {
        return <div className='p-4 text-center text-muted-foreground'>请先选择一个项目</div>;
    }

    const handleCreate = () => {
        setEditName('');
        setEditDescription('');
        setEditOrder(0);
        setEditRequireAd(false);
        setEditEnabled(true);
        setChapterToEdit(null);
        setCreateDialogOpen(true);
    };

    const handleSaveCreate = async () => {
        if (!editName.trim()) {
            toast({
                title: '错误',
                description: '请输入章节名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: CreateChapterDto = {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                order: editOrder,
                requireAd: editRequireAd,
            };
            await createChapter.mutateAsync({ projectId: projectIdNum, dto });
            toast({
                title: '成功',
                description: '章节创建成功',
            });
            setCreateDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast({
                title: '创建失败',
                description: error.message || '创建章节失败',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (chapter: any) => {
        setChapterToEdit(chapter);
        setEditName(chapter.name);
        setEditDescription(chapter.description || '');
        setEditOrder(chapter.order);
        setEditRequireAd(chapter.requireAd);
        setEditEnabled(chapter.enabled);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!chapterToEdit) return;
        if (!editName.trim()) {
            toast({
                title: '错误',
                description: '请输入章节名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: UpdateChapterDto = {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                order: editOrder,
                requireAd: editRequireAd,
                enabled: editEnabled,
            };
            await updateChapter.mutateAsync({ id: chapterToEdit.id, dto });
            toast({
                title: '成功',
                description: '章节更新成功',
            });
            setEditDialogOpen(false);
            setChapterToEdit(null);
            refetch();
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error.message || '更新章节失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!chapterToDelete) return;
        try {
            await deleteChapter.mutateAsync(chapterToDelete.id);
            toast({
                title: '成功',
                description: '章节删除成功',
            });
            setDeleteConfirmOpen(false);
            setChapterToDelete(null);
            refetch();
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除章节失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold'>项目章节管理 (项目ID: {projectId})</h2>
                <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        刷新
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className='mr-2 h-4 w-4' />
                        新建章节
                    </Button>
                </div>
            </div>

            {isLoading ? (
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
                                    <TableHead>名称</TableHead>
                                    <TableHead>描述</TableHead>
                                    <TableHead>顺序</TableHead>
                                    <TableHead>需要广告</TableHead>
                                    <TableHead>启用</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chapters?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                                            暂无章节
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    chapters?.map(chapter => (
                                        <TableRow key={chapter.id}>
                                            <TableCell>{chapter.id}</TableCell>
                                            <TableCell className='font-medium'>{chapter.name}</TableCell>
                                            <TableCell>{chapter.description || '-'}</TableCell>
                                            <TableCell>{chapter.order}</TableCell>
                                            <TableCell>{chapter.requireAd ? '是' : '否'}</TableCell>
                                            <TableCell>{chapter.enabled ? '是' : '否'}</TableCell>
                                            <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => navigate(`/admin/chapters/${chapter.id}/resources`)}
                                                        title='查看资源'
                                                    >
                                                        <ExternalLink className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleEdit(chapter)}
                                                        title='编辑章节'
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setChapterToDelete({ id: chapter.id, name: chapter.name });
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        title='删除章节'
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
                </>
            )}

            {/* 创建章节对话框 */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建章节</DialogTitle>
                        <DialogDescription>创建一个新的章节</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='create-name'>名称 *</Label>
                            <Input
                                id='create-name'
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder='请输入章节名称'
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='create-description'>描述</Label>
                            <Textarea
                                id='create-description'
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                placeholder='请输入章节描述'
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='create-order'>顺序</Label>
                            <Input
                                id='create-order'
                                type='number'
                                value={editOrder}
                                onChange={e => setEditOrder(Number(e.target.value))}
                                placeholder='0'
                            />
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='create-require-ad'
                                checked={editRequireAd}
                                onCheckedChange={checked => setEditRequireAd(checked === true)}
                            />
                            <Label htmlFor='create-require-ad' className='cursor-pointer'>
                                需要广告才能解锁
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveCreate} disabled={createChapter.isPending}>
                            {createChapter.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    创建中...
                                </>
                            ) : (
                                '创建'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 编辑章节对话框 */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑章节</DialogTitle>
                        <DialogDescription>修改章节信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-name'>名称 *</Label>
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
                                placeholder='请输入章节描述'
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-order'>顺序</Label>
                            <Input
                                id='edit-order'
                                type='number'
                                value={editOrder}
                                onChange={e => setEditOrder(Number(e.target.value))}
                                placeholder='0'
                            />
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='edit-require-ad'
                                checked={editRequireAd}
                                onCheckedChange={checked => setEditRequireAd(checked === true)}
                            />
                            <Label htmlFor='edit-require-ad' className='cursor-pointer'>
                                需要广告才能解锁
                            </Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='edit-enabled'
                                checked={editEnabled}
                                onCheckedChange={checked => setEditEnabled(checked === true)}
                            />
                            <Label htmlFor='edit-enabled' className='cursor-pointer'>
                                启用
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={updateChapter.isPending}>
                            {updateChapter.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    更新中...
                                </>
                            ) : (
                                '保存'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除章节 "{chapterToDelete?.name}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {deleteChapter.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    删除中...
                                </>
                            ) : (
                                '删除'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

