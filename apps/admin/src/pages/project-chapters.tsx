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
import { apiClient } from '@/lib/api/client';
import {
    useChapters,
    useCreateChapter,
    useDeleteChapter,
    useGenerateChapterBundle,
    useUpdateChapter,
} from '@/lib/hooks/use-chapters';
import { ChapterResponseDto, CreateChapterDto, ProjectResponseDto, UpdateChapterDto } from '@lourd-game/shared';
import { Download, Edit, ExternalLink, Eye, Info, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
    const [bundlePreviewOpen, setBundlePreviewOpen] = useState(false);
    const [previewChapter, setPreviewChapter] = useState<ChapterResponseDto | null>(null);
    const [projectDetail, setProjectDetail] = useState<ProjectResponseDto | null>(null);
    const [projectDetailOpen, setProjectDetailOpen] = useState(false);
    const [isLoadingProject, setIsLoadingProject] = useState(false);

    const { toast } = useToast();
    const { data: chapters, isLoading, refetch } = useChapters(projectIdNum);
    const createChapter = useCreateChapter();
    const updateChapter = useUpdateChapter();
    const deleteChapter = useDeleteChapter();
    const generateBundle = useGenerateChapterBundle();

    if (!projectId || isNaN(projectIdNum)) {
        return <div className='p-4 text-center text-muted-foreground'>请先选择一个项目</div>;
    }

    const startChapter = chapters && chapters.length > 0 ? chapters.find(ch => ch.startInkId != null) || null : null;

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
                <div className='space-y-1'>
                    <h2 className='text-2xl font-bold'>项目章节管理 (项目ID: {projectId})</h2>
                    <p className='text-xs text-muted-foreground'>
                        当前开始章节：
                        {startChapter
                            ? `${startChapter.name} (ID: ${startChapter.id}, StartInkId: ${startChapter.startInkId})`
                            : '未设置（请在章节 Ink 页面设置起始 Ink）'}
                    </p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        onClick={async () => {
                            try {
                                setIsLoadingProject(true);
                                const detail = await apiClient.getProject(projectIdNum);
                                setProjectDetail(detail);
                                setProjectDetailOpen(true);
                            } catch (error: any) {
                                toast({
                                    title: '获取项目详情失败',
                                    description: error?.message || '无法获取项目详情',
                                    variant: 'destructive',
                                });
                            } finally {
                                setIsLoadingProject(false);
                            }
                        }}
                        disabled={isLoadingProject}
                    >
                        <Info className={`mr-2 h-4 w-4 ${isLoadingProject ? 'animate-spin' : ''}`} />
                        项目详情
                    </Button>
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
                                    <TableHead>起始 Ink</TableHead>
                                    <TableHead>ZIP 包版本</TableHead>
                                    <TableHead>Bundle 地址</TableHead>
                                    <TableHead>需要广告</TableHead>
                                    <TableHead>启用</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chapters?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
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
                                            <TableCell>
                                                {chapter.inkFiles && chapter.inkFiles.length > 0
                                                    ? (() => {
                                                          const startInk =
                                                              chapter.inkFiles.find(f => f.isStart) || null;
                                                          return startInk
                                                              ? `${startInk.filename} (ID: ${startInk.id})`
                                                              : chapter.startInkId
                                                              ? `ID: ${chapter.startInkId}`
                                                              : '未设置';
                                                      })()
                                                    : chapter.startInkId
                                                    ? `ID: ${chapter.startInkId}`
                                                    : '未设置'}
                                            </TableCell>
                                            <TableCell>
                                                {chapter.chapterBundleVersion ? (
                                                    <span className='font-mono text-sm'>
                                                        v{chapter.chapterBundleVersion}
                                                    </span>
                                                ) : (
                                                    <span className='text-muted-foreground text-sm'>未生成</span>
                                                )}
                                            </TableCell>
                                            <TableCell className='max-w-xs'>
                                                {chapter.chapterBundleUrl ? (
                                                    <span className='block truncate text-xs font-mono'>
                                                        {chapter.chapterBundleUrl}
                                                    </span>
                                                ) : (
                                                    <span className='text-muted-foreground text-xs'>未生成</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{chapter.requireAd ? '是' : '否'}</TableCell>
                                            <TableCell>{chapter.enabled ? '是' : '否'}</TableCell>
                                            <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() =>
                                                            navigate(`/admin/chapters/${chapter.id}/resources`)
                                                        }
                                                        title='查看资源'
                                                    >
                                                        <ExternalLink className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setPreviewChapter(chapter);
                                                            setBundlePreviewOpen(true);
                                                        }}
                                                        title='预览 ZIP 包'
                                                        disabled={!chapter.chapterBundleZipUrl}
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={async () => {
                                                            try {
                                                                const result = await generateBundle.mutateAsync(
                                                                    chapter.id,
                                                                );
                                                                toast({
                                                                    title: '成功',
                                                                    description: `ZIP 包生成成功！版本: v${result.version}`,
                                                                });
                                                                refetch();
                                                            } catch (error: any) {
                                                                toast({
                                                                    title: '生成失败',
                                                                    description: error.message || '生成 ZIP 包失败',
                                                                    variant: 'destructive',
                                                                });
                                                            }
                                                        }}
                                                        title='生成 ZIP 包'
                                                        disabled={generateBundle.isPending}
                                                    >
                                                        {generateBundle.isPending ? (
                                                            <Loader2 className='h-4 w-4 animate-spin' />
                                                        ) : (
                                                            <Download className='h-4 w-4' />
                                                        )}
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

            {/* 项目详情对话框 */}
            <Dialog open={projectDetailOpen} onOpenChange={setProjectDetailOpen}>
                <DialogContent className='max-w-xl'>
                    <DialogHeader>
                        <DialogTitle>项目详情</DialogTitle>
                        <DialogDescription>项目 ID: {projectDetail?.id ?? projectId}</DialogDescription>
                    </DialogHeader>
                    {projectDetail ? (
                        <div className='space-y-4 text-sm'>
                            <div className='space-y-2'>
                                <div>
                                    <span className='font-medium'>名称：</span>
                                    <span>{projectDetail.name}</span>
                                </div>
                                <div>
                                    <span className='font-medium'>描述：</span>
                                    <span>{projectDetail.description || '无'}</span>
                                </div>
                                <div>
                                    <span className='font-medium'>启用：</span>
                                    <span>{projectDetail.enabled ? '是' : '否'}</span>
                                </div>
                                <div>
                                    <span className='font-medium'>共通资源包：</span>
                                    <span>{projectDetail.commonBundle || '未设置'}</span>
                                </div>
                                <div className='space-y-1'>
                                    <div className='font-medium'>共通资源包地址：</div>
                                    <Input
                                        value={projectDetail.commonBundleZipUrl || ''}
                                        readOnly
                                        className='font-mono text-xs'
                                        placeholder='暂无'
                                    />
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    创建时间：{new Date(projectDetail.createdAt).toLocaleString('zh-CN')}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    更新时间：{new Date(projectDetail.updatedAt).toLocaleString('zh-CN')}
                                </div>
                            </div>

                            <div className='border-t pt-3 space-y-2'>
                                <div className='font-medium'>项目章节概览</div>
                                {chapters && chapters.length > 0 ? (
                                    <div className='max-h-56 overflow-auto rounded border'>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className='w-14'>ID</TableHead>
                                                    <TableHead>名称</TableHead>
                                                    <TableHead>起始 Ink</TableHead>
                                                    <TableHead>版本</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {chapters.map(ch => (
                                                    <TableRow key={ch.id}>
                                                        <TableCell className='font-mono text-xs'>{ch.id}</TableCell>
                                                        <TableCell className='text-xs'>{ch.name}</TableCell>
                                                        <TableCell className='text-xs'>
                                                            {ch.inkFiles && ch.inkFiles.length > 0
                                                                ? (() => {
                                                                      const startInk =
                                                                          ch.inkFiles.find(f => f.isStart) || null;
                                                                      return startInk
                                                                          ? `${startInk.filename} (ID: ${startInk.id})`
                                                                          : ch.startInkId
                                                                          ? `ID: ${ch.startInkId}`
                                                                          : '未设置';
                                                                  })()
                                                                : ch.startInkId
                                                                ? `ID: ${ch.startInkId}`
                                                                : '未设置'}
                                                        </TableCell>
                                                        <TableCell className='text-xs'>
                                                            {ch.chapterBundleVersion ? (
                                                                <span className='font-mono'>
                                                                    v{ch.chapterBundleVersion}
                                                                </span>
                                                            ) : (
                                                                <span className='text-muted-foreground'>未生成</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className='text-xs text-muted-foreground'>该项目暂无章节</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='py-4 text-center text-muted-foreground text-sm'>暂无项目数据</div>
                    )}
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setProjectDetailOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ZIP 包预览对话框 */}
            <Dialog open={bundlePreviewOpen} onOpenChange={setBundlePreviewOpen}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>ZIP 包详情</DialogTitle>
                        <DialogDescription>{previewChapter?.name} - 章节资源包信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {previewChapter?.chapterBundleZipUrl ? (
                            <>
                                <div className='space-y-2'>
                                    <Label>版本号</Label>
                                    <div className='text-sm font-mono bg-muted p-2 rounded'>
                                        v{previewChapter.chapterBundleVersion || 'N/A'}
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <Label>下载链接</Label>
                                    <div className='flex items-center gap-2'>
                                        <Input
                                            value={previewChapter.chapterBundleZipUrl}
                                            readOnly
                                            className='font-mono text-xs'
                                        />
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => {
                                                window.open(previewChapter.chapterBundleZipUrl, '_blank');
                                            }}
                                        >
                                            <ExternalLink className='h-4 w-4 mr-1' />
                                            打开
                                        </Button>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <Label>章节信息</Label>
                                    <div className='text-sm space-y-1'>
                                        <div>章节名称: {previewChapter.name}</div>
                                        <div>章节顺序: {previewChapter.order}</div>
                                        <div>启用状态: {previewChapter.enabled ? '已启用' : '未启用'}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className='text-center py-8 text-muted-foreground'>
                                尚未生成 ZIP 包，请先点击"生成 ZIP 包"按钮
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setBundlePreviewOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
