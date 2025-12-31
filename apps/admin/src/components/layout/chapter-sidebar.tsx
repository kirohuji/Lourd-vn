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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useChapters, useCreateChapter } from '@/lib/hooks/use-chapters';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, HardDrive, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface ChapterSidebarProps {
    projectId: number;
}

export function ChapterSidebar({ projectId }: ChapterSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ chapterId?: string }>();
    const { toast } = useToast();
    const { data: chapters = [], isLoading, refetch } = useChapters(projectId);
    const createChapter = useCreateChapter();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newChapterName, setNewChapterName] = useState('');
    const [newChapterDescription, setNewChapterDescription] = useState('');
    const [newChapterOrder, setNewChapterOrder] = useState(0);

    const currentChapterId = params.chapterId ? Number(params.chapterId) : null;

    const handleChapterClick = (chapterId: number) => {
        navigate(`/admin/projects/${projectId}/chapters/${chapterId}`);
    };

    const handleCreateChapter = async () => {
        if (!newChapterName.trim()) {
            toast({
                title: '错误',
                description: '请输入章节名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createChapter.mutateAsync({
                projectId,
                dto: {
                    name: newChapterName.trim(),
                    description: newChapterDescription.trim() || undefined,
                    order: newChapterOrder,
                    requireAd: false,
                },
            });
            toast({ title: '成功', description: '章节创建成功' });
            setCreateDialogOpen(false);
            setNewChapterName('');
            setNewChapterDescription('');
            setNewChapterOrder(0);
            await refetch();
        } catch (error: any) {
            toast({
                title: '创建失败',
                description: error?.message || '创建章节失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='flex h-full w-64 flex-col border-r bg-card'>
            <div className='border-b p-4'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-semibold'>章节列表</h3>
                    <Button
                        variant='outline'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => setCreateDialogOpen(true)}
                        title='添加章节'
                    >
                        <Plus className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            {/* 项目资源管理入口 */}
            <div className='border-b p-2 space-y-1'>
                <button
                    onClick={() => navigate(`/admin/projects/${projectId}/resources`)}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        location.pathname === `/admin/projects/${projectId}/resources`
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    <HardDrive className='h-4 w-4 shrink-0' />
                    <span className='font-medium'>项目资源管理</span>
                </button>
                <button
                    onClick={() => navigate(`/admin/projects/${projectId}/planning`)}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        location.pathname === `/admin/projects/${projectId}/planning`
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    <FileText className='h-4 w-4 shrink-0' />
                    <span className='font-medium'>项目策划</span>
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-2'>
                {isLoading ? (
                    <div className='flex items-center justify-center py-8 text-sm text-muted-foreground'>加载中...</div>
                ) : chapters.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground'>
                        <BookOpen className='mb-2 h-8 w-8 opacity-50' />
                        <p>暂无章节</p>
                        <p className='mt-1 text-xs'>点击上方 + 按钮创建</p>
                    </div>
                ) : (
                    <div className='space-y-1'>
                        {chapters
                            .sort((a, b) => a.order - b.order)
                            .map(chapter => (
                                <button
                                    key={chapter.id}
                                    onClick={() => handleChapterClick(chapter.id)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                        currentChapterId === chapter.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}
                                >
                                    <BookOpen className='h-4 w-4 shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <div className='truncate font-medium'>{chapter.name}</div>
                                        {chapter.description && (
                                            <div className='truncate text-xs opacity-75'>{chapter.description}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                    </div>
                )}
            </div>

            {/* 创建章节对话框 */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>创建新章节</DialogTitle>
                        <DialogDescription>为当前项目创建一个新章节</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='chapter-name'>章节名称 *</Label>
                            <Input
                                id='chapter-name'
                                value={newChapterName}
                                onChange={e => setNewChapterName(e.target.value)}
                                placeholder='请输入章节名称'
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='chapter-description'>描述</Label>
                            <Textarea
                                id='chapter-description'
                                value={newChapterDescription}
                                onChange={e => setNewChapterDescription(e.target.value)}
                                placeholder='请输入章节描述（可选）'
                                rows={3}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='chapter-order'>排序</Label>
                            <Input
                                id='chapter-order'
                                type='number'
                                value={newChapterOrder}
                                onChange={e => setNewChapterOrder(Number(e.target.value) || 0)}
                                placeholder='0'
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleCreateChapter}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
