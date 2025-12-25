import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePromptTags } from '@/lib/hooks/use-prompts';
import { PromptTagResponseDto, VariantTagItem } from '@lourd-game/shared';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TagSelectorProps {
    value: VariantTagItem[];
    onChange: (tags: VariantTagItem[]) => void;
    disabled?: boolean;
}

const TAG_TYPES = [
    { value: 'action', label: 'Action（动作）' },
    { value: 'status', label: 'Status（状态）' },
    { value: 'style', label: 'Style（风格）' },
    { value: 'appearance', label: 'Appearance（外观）' },
    { value: 'personality', label: 'Personality（性格）' },
] as const;

export function TagSelector({ value, onChange, disabled }: TagSelectorProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTagType, setSelectedTagType] = useState<string>('');
    const { data: allTags = [], isLoading } = usePromptTags();

    // 按类型分组标签
    const groupedTags = allTags.reduce((acc, tag) => {
        if (!acc[tag.tagType]) {
            acc[tag.tagType] = [];
        }
        acc[tag.tagType].push(tag);
        return acc;
    }, {} as Record<string, PromptTagResponseDto[]>);

    // 获取已选择的标签详情
    const selectedTags = value
        .map(item => {
            const tag = allTags.find(t => t.id === item.tagId);
            return tag ? { ...item, tag } : null;
        })
        .filter((item): item is VariantTagItem & { tag: PromptTagResponseDto } => item !== null)
        .sort((a, b) => a.order - b.order);

    // 获取可用的标签（未选择且启用的）
    const availableTags = selectedTagType
        ? (groupedTags[selectedTagType] || []).filter(tag => tag.enabled && !value.some(item => item.tagId === tag.id))
        : allTags.filter(tag => tag.enabled && !value.some(item => item.tagId === tag.id));

    const handleAddTag = (tagId: number) => {
        const maxOrder = value.length > 0 ? Math.max(...value.map(t => t.order)) : -1;
        const newTag: VariantTagItem = {
            tagId,
            order: maxOrder + 1,
        };
        onChange([...value, newTag]);
        setDialogOpen(false);
        setSelectedTagType('');
    };

    const handleRemoveTag = (tagId: number) => {
        const newValue = value.filter(item => item.tagId !== tagId).map((item, index) => ({ ...item, order: index }));
        onChange(newValue);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newValue = [...value];
        [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
        const reordered = newValue.map((item, idx) => ({ ...item, order: idx }));
        onChange(reordered);
    };

    const handleMoveDown = (index: number) => {
        if (index === value.length - 1) return;
        const newValue = [...value];
        [newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
        const reordered = newValue.map((item, idx) => ({ ...item, order: idx }));
        onChange(reordered);
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <Label>标签选择</Label>
                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setDialogOpen(true)}
                    disabled={disabled}
                >
                    <Plus className='mr-2 h-4 w-4' />
                    添加标签
                </Button>
            </div>

            {selectedTags.length === 0 ? (
                <div className='text-sm text-muted-foreground py-4 text-center border rounded-lg'>
                    暂无标签，点击"添加标签"选择
                </div>
            ) : (
                <div className='space-y-2'>
                    {selectedTags.map((item, index) => (
                        <div
                            key={item.tagId}
                            className='flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                        >
                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                                <GripVertical className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                <div className='flex-1 min-w-0'>
                                    <div className='font-medium truncate'>{item.tag.name}</div>
                                    <div className='text-xs text-muted-foreground'>
                                        {TAG_TYPES.find(t => t.value === item.tag.tagType)?.label || item.tag.tagType}
                                    </div>
                                </div>
                            </div>
                            <div className='flex items-center gap-1'>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8'
                                    onClick={() => handleMoveUp(index)}
                                    disabled={disabled || index === 0}
                                >
                                    ↑
                                </Button>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8'
                                    onClick={() => handleMoveDown(index)}
                                    disabled={disabled || index === selectedTags.length - 1}
                                >
                                    ↓
                                </Button>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-destructive hover:text-destructive'
                                    onClick={() => handleRemoveTag(item.tagId)}
                                    disabled={disabled}
                                >
                                    <Trash2 className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 添加标签对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='max-w-2xl max-h-[80vh] overflow-auto'>
                    <DialogHeader>
                        <DialogTitle>选择标签</DialogTitle>
                        <DialogDescription>选择一个标签添加到变体中</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label>筛选类型</Label>
                            <Select value={selectedTagType} onValueChange={setSelectedTagType}>
                                <SelectTrigger>
                                    <SelectValue placeholder='全部类型' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=''>全部类型</SelectItem>
                                    {TAG_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isLoading ? (
                            <div className='text-center py-8 text-muted-foreground'>加载中...</div>
                        ) : availableTags.length === 0 ? (
                            <div className='text-center py-8 text-muted-foreground'>
                                {selectedTagType ? '该类型下没有可用的标签' : '没有可用的标签'}
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 gap-2 max-h-[400px] overflow-auto'>
                                {availableTags.map(tag => {
                                    const typeLabel =
                                        TAG_TYPES.find(t => t.value === tag.tagType)?.label || tag.tagType;
                                    return (
                                        <div
                                            key={tag.id}
                                            className='flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'
                                            onClick={() => handleAddTag(tag.id)}
                                        >
                                            <div className='flex-1 min-w-0'>
                                                <div className='font-medium'>{tag.name}</div>
                                                {tag.description && (
                                                    <div className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                                                        {tag.description}
                                                    </div>
                                                )}
                                                <div className='text-xs text-muted-foreground mt-1'>
                                                    {typeLabel} · 排序: {tag.order}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
