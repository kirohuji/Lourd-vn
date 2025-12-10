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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    useCreateProject,
    useDeleteProject,
    useGenerateProjectBundle,
    useProjects,
    useUpdateProject,
} from '@/lib/hooks/use-projects';
import { useAllResources } from '@/lib/hooks/use-resources';
import { CreateProjectDto, ProjectResponseDto, UpdateProjectDto } from '@lourd-game/shared';
import { Download, Edit, ExternalLink, Eye, Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProjectsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<{
        id: number;
        name: string;
        description?: string;
        enabled: boolean;
    } | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCommonBundle, setEditCommonBundle] = useState('');
    const [bundlePreviewOpen, setBundlePreviewOpen] = useState(false);
    const [previewProject, setPreviewProject] = useState<ProjectResponseDto | null>(null);

    const { toast } = useToast();
    const { data, isLoading, refetch } = useProjects({ page, limit: 20, search: searchQuery || undefined });
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();
    const generateBundle = useGenerateProjectBundle();

    // 获取所有 common 类型的资源包
    const { data: allResourcesData } = useAllResources();
    const commonBundles = useMemo(() => {
        if (!allResourcesData) return [];
        const bundles = new Set<string>();
        allResourcesData.data.forEach(resource => {
            if (resource.bundleType === 'common' && resource.bundle) {
                bundles.add(resource.bundle);
            }
        });
        return Array.from(bundles).sort();
    }, [allResourcesData]);

    const projects = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handleCreate = () => {
        setEditName('');
        setEditDescription('');
        setEditCommonBundle('');
        setProjectToEdit(null);
        setCreateDialogOpen(true);
    };

    const handleSaveCreate = async () => {
        if (!editName.trim()) {
            toast({
                title: '错误',
                description: '请输入项目名称',
                variant: 'destructive',
            });
            return;
        }

        if (!editCommonBundle.trim()) {
            toast({
                title: '错误',
                description: '请选择共通资源包',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: CreateProjectDto = {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                commonBundle: editCommonBundle.trim(),
            };
            await createProject.mutateAsync(dto);
            toast({
                title: '成功',
                description: '项目创建成功',
            });
            setCreateDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast({
                title: '创建失败',
                description: error.message || '创建项目失败',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (project: (typeof projects)[0]) => {
        setProjectToEdit({
            id: project.id,
            name: project.name,
            description: project.description || undefined,
            enabled: true,
        });
        setEditName(project.name);
        setEditDescription(project.description || '');
        setEditCommonBundle(project.commonBundle || undefined || '');
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!projectToEdit || !editName.trim()) {
            toast({
                title: '错误',
                description: '请输入项目名称',
                variant: 'destructive',
            });
            return;
        }

        if (!editCommonBundle.trim()) {
            toast({
                title: '错误',
                description: '请选择共通资源包',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: UpdateProjectDto = {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                commonBundle: editCommonBundle.trim(),
            };
            await updateProject.mutateAsync({ id: projectToEdit.id, dto });
            toast({
                title: '成功',
                description: '项目更新成功',
            });
            setEditDialogOpen(false);
            setProjectToEdit(null);
            refetch();
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error.message || '更新项目失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;

        try {
            await deleteProject.mutateAsync(projectToDelete.id);
            toast({
                title: '成功',
                description: `已删除项目: ${projectToDelete.name}`,
            });
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除项目失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>项目管理</h1>
                <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => refetch()}>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        刷新
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className='mr-2 h-4 w-4' />
                        创建项目
                    </Button>
                </div>
            </div>

            <div className='flex gap-2'>
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        placeholder='搜索项目名称或描述...'
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className='pl-9'
                    />
                </div>
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
                                    <TableHead>名称</TableHead>
                                    <TableHead>描述</TableHead>
                                    <TableHead>ZIP 包版本</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                                            暂无项目
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map(project => (
                                        <TableRow key={project.id}>
                                            <TableCell>{project.id}</TableCell>
                                            <TableCell className='font-medium'>{project.name}</TableCell>
                                            <TableCell>{project.description || '-'}</TableCell>
                                            <TableCell>
                                                {project.commonBundleVersion ? (
                                                    <span className='font-mono text-sm'>
                                                        v{project.commonBundleVersion}
                                                    </span>
                                                ) : (
                                                    <span className='text-muted-foreground text-sm'>未生成</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(project.createdAt).toLocaleString('zh-CN')}</TableCell>
                                            <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() =>
                                                            navigate(`/admin/projects/${project.id}/resources`)
                                                        }
                                                        title='查看资源'
                                                    >
                                                        <ExternalLink className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setPreviewProject(project);
                                                            setBundlePreviewOpen(true);
                                                        }}
                                                        title='预览 ZIP 包'
                                                        disabled={!project.commonBundleZipUrl}
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={async () => {
                                                            try {
                                                                const result = await generateBundle.mutateAsync(
                                                                    project.id,
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
                                                        disabled={generateBundle.isPending || !project.commonBundle}
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
                                                        onClick={() => handleEdit(project)}
                                                        title='编辑项目'
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setProjectToDelete({ id: project.id, name: project.name });
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        title='删除项目'
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

                    {totalPages > 1 && (
                        <div className='flex items-center justify-center gap-4'>
                            <Button
                                variant='outline'
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                上一页
                            </Button>
                            <span className='text-sm text-muted-foreground'>
                                第 {page} 页 / 共 {totalPages} 页 (总计 {total} 项)
                            </span>
                            <Button
                                variant='outline'
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                下一页
                            </Button>
                        </div>
                    )}
                </>
            )}

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除项目 "{projectToDelete?.name}"
                            吗？此操作不可恢复，并且会删除该项目下的所有资源、地图和角色配置。
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
                        <DialogTitle>编辑项目</DialogTitle>
                        <DialogDescription>修改项目信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-name'>项目名称 *</Label>
                            <Input id='edit-name' value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-description'>描述</Label>
                            <Textarea
                                id='edit-description'
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-common-bundle'>共通资源包 *</Label>
                            <Select
                                value={editCommonBundle || undefined}
                                onValueChange={value => setEditCommonBundle(value || '')}
                            >
                                <SelectTrigger id='edit-common-bundle'>
                                    <SelectValue placeholder='请选择共通资源包' />
                                </SelectTrigger>
                                <SelectContent>
                                    {commonBundles.length === 0 ? (
                                        <div className='px-2 py-1.5 text-sm text-muted-foreground'>暂无共通资源包</div>
                                    ) : (
                                        commonBundles.map(bundle => (
                                            <SelectItem key={bundle} value={bundle}>
                                                {bundle}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {commonBundles.length === 0 && (
                                <p className='text-sm text-muted-foreground'>
                                    请先在资源管理中创建共通资源包（bundleType 为 common）
                                </p>
                            )}
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

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>创建项目</DialogTitle>
                        <DialogDescription>创建新项目</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='create-name'>项目名称 *</Label>
                            <Input id='create-name' value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='create-description'>描述</Label>
                            <Textarea
                                id='create-description'
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='create-common-bundle'>共通资源包 *</Label>
                            <Select
                                value={editCommonBundle || undefined}
                                onValueChange={value => setEditCommonBundle(value || '')}
                            >
                                <SelectTrigger id='create-common-bundle'>
                                    <SelectValue placeholder='请选择共通资源包' />
                                </SelectTrigger>
                                <SelectContent>
                                    {commonBundles.length === 0 ? (
                                        <div className='px-2 py-1.5 text-sm text-muted-foreground'>暂无共通资源包</div>
                                    ) : (
                                        commonBundles.map(bundle => (
                                            <SelectItem key={bundle} value={bundle}>
                                                {bundle}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {commonBundles.length === 0 && (
                                <p className='text-sm text-muted-foreground'>
                                    请先在资源管理中创建共通资源包（bundleType 为 common）
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveCreate}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ZIP 包预览对话框 */}
            <Dialog open={bundlePreviewOpen} onOpenChange={setBundlePreviewOpen}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>ZIP 包详情</DialogTitle>
                        <DialogDescription>{previewProject?.name} - 共通资源包信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {previewProject?.commonBundleZipUrl ? (
                            <>
                                <div className='space-y-2'>
                                    <Label>版本号</Label>
                                    <div className='text-sm font-mono bg-muted p-2 rounded'>
                                        v{previewProject.commonBundleVersion || 'N/A'}
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <Label>下载链接</Label>
                                    <div className='flex items-center gap-2'>
                                        <Input
                                            value={previewProject.commonBundleZipUrl}
                                            readOnly
                                            className='font-mono text-xs'
                                        />
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => {
                                                if (previewProject.commonBundleZipUrl) {
                                                    window.open(previewProject.commonBundleZipUrl, '_blank');
                                                }
                                            }}
                                        >
                                            <ExternalLink className='h-4 w-4 mr-1' />
                                            打开
                                        </Button>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <Label>共通资源包名称</Label>
                                    <div className='text-sm bg-muted p-2 rounded'>
                                        {previewProject.commonBundle || '未设置'}
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
