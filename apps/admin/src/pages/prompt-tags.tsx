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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreatePromptTag, useDeletePromptTag, usePromptTags, useUpdatePromptTag } from '@/lib/hooks/use-prompts';
import { CreatePromptTagDto, PromptTagResponseDto, UpdatePromptTagDto } from '@lourd-game/shared';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const TAG_TYPES = [
    { value: 'action', label: 'Action（动作）' },
    { value: 'status', label: 'Status（状态）' },
    { value: 'style', label: 'Style（风格）' },
    { value: 'appearance', label: 'Appearance（外观）' },
    { value: 'personality', label: 'Personality（性格）' },
] as const;

export function PromptTagsPage() {
    const [selectedTagType, setSelectedTagType] = useState<string>('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<PromptTagResponseDto | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<PromptTagResponseDto | null>(null);

    const { toast } = useToast();
    const {
        data: tags = [],
        isLoading,
        refetch,
    } = usePromptTags(selectedTagType === 'all' ? undefined : selectedTagType);
    const deleteMutation = useDeletePromptTag();

    // 按类型分组标签
    const groupedTags = tags.reduce((acc, tag) => {
        if (!acc[tag.tagType]) {
            acc[tag.tagType] = [];
        }
        acc[tag.tagType].push(tag);
        return acc;
    }, {} as Record<string, PromptTagResponseDto[]>);

    const handleCreate = () => {
        setEditingTag(null);
        setFormOpen(true);
    };

    const handleEdit = (tag: PromptTagResponseDto) => {
        setEditingTag(tag);
        setFormOpen(true);
    };

    const handleDelete = (tag: PromptTagResponseDto) => {
        setTagToDelete(tag);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!tagToDelete) return;

        try {
            await deleteMutation.mutateAsync(tagToDelete.id);
            toast({
                title: '成功',
                description: '标签删除成功',
            });
            setDeleteConfirmOpen(false);
            setTagToDelete(null);
            refetch();
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除标签失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>标签 Prompt 管理</h1>
                    <p className='text-muted-foreground mt-1'>管理可复用的 Prompt 标签</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className='mr-2 h-4 w-4' />
                    新建标签
                </Button>
            </div>

            {/* 筛选 */}
            <div className='flex items-center gap-4'>
                <Label>筛选类型：</Label>
                <Select value={selectedTagType} onValueChange={setSelectedTagType}>
                    <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder='全部类型' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>全部类型</SelectItem>
                        {TAG_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 标签列表 */}
            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : (
                <div className='space-y-8'>
                    {Object.entries(groupedTags).map(([tagType, typeTags]) => {
                        const typeLabel = TAG_TYPES.find(t => t.value === tagType)?.label || tagType;
                        return (
                            <div key={tagType} className='space-y-4'>
                                <h2 className='text-xl font-semibold'>{typeLabel}</h2>
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    {typeTags.map(tag => (
                                        <div
                                            key={tag.id}
                                            className='border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow'
                                        >
                                            <div className='flex items-start justify-between'>
                                                <div className='flex-1 min-w-0'>
                                                    <h3 className='font-semibold text-lg truncate'>{tag.name}</h3>
                                                    {tag.description && (
                                                        <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                                                            {tag.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className='flex items-center gap-2 ml-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleEdit(tag)}
                                                        className='h-8 w-8'
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleDelete(tag)}
                                                        className='h-8 w-8 text-destructive hover:text-destructive'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className='space-y-2'>
                                                <div className='text-sm'>
                                                    <span className='text-muted-foreground'>内容：</span>
                                                    <p className='mt-1 text-xs bg-muted p-2 rounded line-clamp-3'>
                                                        {tag.content}
                                                    </p>
                                                </div>
                                                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                                    <span>排序：{tag.order}</span>
                                                    <span className={tag.enabled ? 'text-green-600' : 'text-gray-400'}>
                                                        {tag.enabled ? '启用' : '禁用'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(groupedTags).length === 0 && (
                        <div className='text-center py-12 text-muted-foreground'>
                            {selectedTagType !== 'all' ? '该类型下暂无标签' : '暂无标签，点击"新建标签"创建'}
                        </div>
                    )}
                </div>
            )}

            {/* 创建/编辑表单 */}
            <TagFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                tag={editingTag}
                onSuccess={() => {
                    setFormOpen(false);
                    setEditingTag(null);
                    refetch();
                }}
            />

            {/* 删除确认 */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>确定要删除标签 "{tagToDelete?.name}" 吗？此操作不可撤销。</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDeleteConfirmOpen(false)}>
                            取消
                        </Button>
                        <Button variant='destructive' onClick={confirmDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? '删除中...' : '删除'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface TagFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tag?: PromptTagResponseDto | null;
    onSuccess?: () => void;
}

function TagFormDialog({ open, onOpenChange, tag, onSuccess }: TagFormDialogProps) {
    const isEditMode = !!tag;
    const [name, setName] = useState('');
    const [tagType, setTagType] = useState<string>('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState(0);
    const [enabled, setEnabled] = useState(true);

    const { toast } = useToast();
    const createMutation = useCreatePromptTag();
    const updateMutation = useUpdatePromptTag();

    // 重置表单
    const resetForm = () => {
        if (isEditMode && tag) {
            setName(tag.name);
            setTagType(tag.tagType);
            setContent(tag.content);
            setDescription(tag.description || '');
            setOrder(tag.order);
            setEnabled(tag.enabled);
        } else {
            setName('');
            setTagType('');
            setContent('');
            setDescription('');
            setOrder(0);
            setEnabled(true);
        }
    };

    // 当对话框打开或 tag 变化时重置表单
    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open, tag]);

    const handleSubmit = async () => {
        if (!name.trim() || !tagType || !content.trim()) {
            toast({
                title: '错误',
                description: '请填写名称、类型和内容',
                variant: 'destructive',
            });
            return;
        }

        try {
            if (isEditMode && tag) {
                const dto: UpdatePromptTagDto = {
                    name: name.trim(),
                    tagType,
                    content: content.trim(),
                    description: description.trim() || undefined,
                    order,
                    enabled,
                };
                await updateMutation.mutateAsync({ id: tag.id, dto });
                toast({
                    title: '成功',
                    description: '标签更新成功',
                });
            } else {
                const dto: CreatePromptTagDto = {
                    name: name.trim(),
                    tagType,
                    content: content.trim(),
                    description: description.trim() || undefined,
                    order,
                };
                await createMutation.mutateAsync(dto);
                toast({
                    title: '成功',
                    description: '标签创建成功',
                });
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: isEditMode ? '更新失败' : '创建失败',
                description: error.message || '操作失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-auto'>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑标签' : '新建标签'}</DialogTitle>
                    <DialogDescription>{isEditMode ? '修改标签信息' : '创建一个新的 Prompt 标签'}</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='name'>名称 *</Label>
                        <Input
                            id='name'
                            placeholder='标签名称'
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='tagType'>类型 *</Label>
                        <Select value={tagType} onValueChange={setTagType} disabled={isEditMode}>
                            <SelectTrigger>
                                <SelectValue placeholder='选择标签类型' />
                            </SelectTrigger>
                            <SelectContent>
                                {TAG_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='content'>Prompt 内容 *</Label>
                        <Textarea
                            id='content'
                            placeholder='输入 Prompt 内容'
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            rows={6}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='description'>描述（可选）</Label>
                        <Input
                            id='description'
                            placeholder='标签描述'
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='order'>排序</Label>
                            <Input
                                id='order'
                                type='number'
                                value={order}
                                onChange={e => setOrder(parseInt(e.target.value) || 0)}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>
                        {isEditMode && (
                            <div className='space-y-2'>
                                <Label htmlFor='enabled'>启用状态</Label>
                                <div className='flex items-center space-x-2 pt-2'>
                                    <Switch
                                        id='enabled'
                                        checked={enabled}
                                        onCheckedChange={setEnabled}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    />
                                    <Label htmlFor='enabled' className='cursor-pointer'>
                                        {enabled ? '启用' : '禁用'}
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            createMutation.isPending ||
                            updateMutation.isPending ||
                            !name.trim() ||
                            !tagType ||
                            !content.trim()
                        }
                    >
                        {createMutation.isPending || updateMutation.isPending
                            ? '保存中...'
                            : isEditMode
                            ? '保存'
                            : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
