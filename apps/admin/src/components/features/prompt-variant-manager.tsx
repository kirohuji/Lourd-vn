import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    useCreatePromptVariant,
    useDeletePromptVariant,
    useMergePromptVariant,
    usePromptVariants,
    useSetDefaultPromptVariant,
    useUpdatePromptVariant,
} from '@/lib/hooks/use-prompts';
import { CreatePromptVariantDto, PromptVariantResponseDto, VariantTagItem } from '@lourd-game/shared';
import { Edit, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TagSelector } from './tag-selector';

interface PromptVariantManagerProps {
    basePromptId?: number;
    characterPromptId?: number;
    basicPrompt: string;
    disabled?: boolean;
}

export function PromptVariantManager({
    basePromptId,
    characterPromptId,
    basicPrompt,
    disabled,
}: PromptVariantManagerProps) {
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantDescription, setNewVariantDescription] = useState('');
    const [newVariantParentId, setNewVariantParentId] = useState<number | undefined>(undefined);
    const [variantTagIds, setVariantTagIds] = useState<VariantTagItem[]>([]);
    const [mergedPreview, setMergedPreview] = useState<string>('');
    const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
    const [editingVariantName, setEditingVariantName] = useState<string>('');
    const [editingVariantParentId, setEditingVariantParentId] = useState<number | undefined>(undefined);

    const { toast } = useToast();
    const { data: variants = [], isLoading, refetch } = usePromptVariants(basePromptId, characterPromptId);
    const createMutation = useCreatePromptVariant();
    const updateMutation = useUpdatePromptVariant();
    const deleteMutation = useDeletePromptVariant();
    const setDefaultMutation = useSetDefaultPromptVariant();
    const mergeMutation = useMergePromptVariant();

    const selectedVariant = variants.find(v => v.id === selectedVariantId);

    // 默认选中第一个变体
    useEffect(() => {
        if (variants.length > 0 && !selectedVariantId) {
            const defaultVariant = variants.find(v => v.isDefault) || variants[0];
            setSelectedVariantId(defaultVariant.id);
        }
    }, [variants, selectedVariantId]);

    // 当选中变体变化时，更新标签和预览
    useEffect(() => {
        if (selectedVariant) {
            setVariantTagIds(selectedVariant.tagIds);
            setMergedPreview(selectedVariant.mergedPrompt);
            setEditingVariantParentId(selectedVariant.parentVariantId);
        } else {
            setVariantTagIds([]);
            setMergedPreview(basicPrompt);
            setEditingVariantParentId(undefined);
        }
    }, [selectedVariant, basicPrompt]);

    // 实时预览合并结果 - 当标签变化或基础变体变化时自动更新预览
    useEffect(() => {
        if (selectedVariant) {
            // 延迟触发合并预览，避免频繁请求
            const timer = setTimeout(() => {
                handlePreviewMerge();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setMergedPreview(basicPrompt);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantTagIds, editingVariantParentId, selectedVariant]);

    const handlePreviewMerge = async () => {
        if (!selectedVariant) return;
        try {
            const result = await mergeMutation.mutateAsync(selectedVariant.id);
            setMergedPreview(result.mergedPrompt);
        } catch (error) {
            // 预览失败时使用缓存的 mergedPrompt
            if (selectedVariant) {
                setMergedPreview(selectedVariant.mergedPrompt);
            }
        }
    };

    const handleCreateVariant = async () => {
        if (!newVariantName.trim()) {
            toast({
                title: '错误',
                description: '请输入变体名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: CreatePromptVariantDto = {
                name: newVariantName.trim(),
                description: newVariantDescription.trim() || undefined,
                basePromptId,
                characterPromptId,
                parentVariantId: newVariantParentId,
                tagIds: [],
                order: variants.length,
            };
            const result = await createMutation.mutateAsync(dto);
            setSelectedVariantId(result.id);
            setNewVariantName('');
            setNewVariantDescription('');
            setNewVariantParentId(undefined);
            refetch();
            toast({
                title: '成功',
                description: '变体创建成功',
            });
        } catch (error: any) {
            toast({
                title: '创建失败',
                description: error.message || '创建变体失败',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteVariant = async (variant: PromptVariantResponseDto) => {
        if (variant.isDefault) {
            toast({
                title: '错误',
                description: '不能删除默认变体',
                variant: 'destructive',
            });
            return;
        }

        try {
            await deleteMutation.mutateAsync(variant.id);
            if (selectedVariantId === variant.id) {
                const remaining = variants.filter(v => v.id !== variant.id);
                setSelectedVariantId(remaining[0]?.id || null);
            }
            refetch();
            toast({
                title: '成功',
                description: '变体删除成功',
            });
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除变体失败',
                variant: 'destructive',
            });
        }
    };

    const handleSetDefault = async (variant: PromptVariantResponseDto) => {
        try {
            await setDefaultMutation.mutateAsync(variant.id);
            refetch();
            toast({
                title: '成功',
                description: '默认变体设置成功',
            });
        } catch (error: any) {
            toast({
                title: '设置失败',
                description: error.message || '设置默认变体失败',
                variant: 'destructive',
            });
        }
    };

    const handleSaveVariantName = async (variantId: number) => {
        if (!editingVariantName.trim()) {
            toast({
                title: '错误',
                description: '变体名称不能为空',
                variant: 'destructive',
            });
            setEditingVariantId(null);
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: variantId,
                dto: { name: editingVariantName.trim() },
            });
            setEditingVariantId(null);
            refetch();
            toast({
                title: '成功',
                description: '变体名称已更新',
            });
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error.message || '更新变体名称失败',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* 变体列表 */}
            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <Label>变体列表</Label>
                    <Button size='sm' onClick={handleCreateVariant} disabled={disabled || createMutation.isPending}>
                        <Plus className='mr-2 h-4 w-4' />
                        新建
                    </Button>
                </div>
                <div className='flex items-center gap-2'>
                    <Input
                        placeholder='新变体名称'
                        value={newVariantName}
                        onChange={e => setNewVariantName(e.target.value)}
                        className='flex-1'
                        disabled={disabled}
                    />
                    <Select
                        value={newVariantParentId?.toString() || 'none'}
                        onValueChange={value => {
                            setNewVariantParentId(value === 'none' ? undefined : parseInt(value, 10));
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger className='w-48'>
                            <SelectValue placeholder='选择基础变体（可选）' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='none'>无（基于 Basic Prompt）</SelectItem>
                            {variants.map(variant => (
                                <SelectItem key={variant.id} value={variant.id.toString()}>
                                    {variant.name}
                                    {variant.isDefault && ' (默认)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex flex-wrap gap-2'>
                    {variants.map(variant => (
                        <div
                            key={variant.id}
                            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${
                                selectedVariantId === variant.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                            }`}
                            onClick={() => {
                                if (editingVariantId !== variant.id) {
                                    setSelectedVariantId(variant.id);
                                }
                            }}
                        >
                            {variant.isDefault && <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />}
                            {editingVariantId === variant.id ? (
                                <Input
                                    value={editingVariantName}
                                    onChange={e => setEditingVariantName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleSaveVariantName(variant.id);
                                        }
                                        if (e.key === 'Escape') {
                                            setEditingVariantId(null);
                                            setEditingVariantName('');
                                        }
                                    }}
                                    onBlur={() => handleSaveVariantName(variant.id)}
                                    onClick={e => e.stopPropagation()}
                                    className='h-6 text-sm'
                                    autoFocus
                                />
                            ) : (
                                <span className='text-sm font-medium'>{variant.name}</span>
                            )}
                            {editingVariantId !== variant.id && (
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-5 w-5 ml-1'
                                    onClick={e => {
                                        e.stopPropagation();
                                        setEditingVariantId(variant.id);
                                        setEditingVariantName(variant.name);
                                    }}
                                    disabled={disabled}
                                    title='编辑名称'
                                >
                                    <Edit className='h-3 w-3' />
                                </Button>
                            )}
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-5 w-5 ml-1'
                                onClick={e => {
                                    e.stopPropagation();
                                    if (!variant.isDefault) {
                                        handleSetDefault(variant);
                                    }
                                }}
                                disabled={disabled || variant.isDefault || editingVariantId === variant.id}
                                title={variant.isDefault ? '默认变体' : '设为默认'}
                            >
                                <Star className='h-3 w-3' />
                            </Button>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-5 w-5 text-destructive hover:text-destructive'
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteVariant(variant);
                                }}
                                disabled={
                                    disabled ||
                                    variant.isDefault ||
                                    deleteMutation.isPending ||
                                    editingVariantId === variant.id
                                }
                            >
                                <Trash2 className='h-3 w-3' />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 当前变体编辑 */}
            {selectedVariant && (
                <div className='space-y-4 border rounded-lg p-4'>
                    <div className='font-semibold'>
                        当前变体: {selectedVariant.name}
                        {selectedVariant.isDefault && (
                            <span className='ml-2 text-xs text-muted-foreground'>(默认)</span>
                        )}
                    </div>

                    {/* 基础变体选择 */}
                    <div className='space-y-2'>
                        <Label>基础变体（可选）</Label>
                        <Select
                            value={editingVariantParentId?.toString() || 'none'}
                            onValueChange={async value => {
                                const newParentId = value === 'none' ? undefined : parseInt(value, 10);
                                setEditingVariantParentId(newParentId);
                                // 自动保存
                                if (selectedVariant) {
                                    try {
                                        await updateMutation.mutateAsync({
                                            id: selectedVariant.id,
                                            dto: { parentVariantId: newParentId },
                                        });
                                        refetch();
                                        // 更新后立即刷新预览
                                        setTimeout(() => {
                                            handlePreviewMerge();
                                        }, 300);
                                    } catch (error: any) {
                                        toast({
                                            title: '更新失败',
                                            description: error.message || '更新基础变体失败',
                                            variant: 'destructive',
                                        });
                                        // 恢复原值
                                        setEditingVariantParentId(selectedVariant.parentVariantId);
                                    }
                                }
                            }}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='选择基础变体（留空则基于 Basic Prompt）' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='none'>无（基于 Basic Prompt）</SelectItem>
                                {variants
                                    .filter(v => v.id !== selectedVariant.id)
                                    .map(variant => (
                                        <SelectItem key={variant.id} value={variant.id.toString()}>
                                            {variant.name}
                                            {variant.isDefault && ' (默认)'}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {selectedVariant.parentVariantId && (
                            <p className='text-xs text-muted-foreground'>
                                当前基于:{' '}
                                {variants.find(v => v.id === selectedVariant.parentVariantId)?.name || '未知变体'}
                            </p>
                        )}
                    </div>

                    {/* 标签选择和合并预览 - 左右布局 */}
                    <div className='grid grid-cols-2 gap-4'>
                        {/* 左侧：标签选择 */}
                        <div className='space-y-2'>
                            <Label>标签选择</Label>
                            <TagSelector
                                value={variantTagIds}
                                onChange={async tags => {
                                    setVariantTagIds(tags);
                                    // 自动保存
                                    if (selectedVariant) {
                                        try {
                                            await updateMutation.mutateAsync({
                                                id: selectedVariant.id,
                                                dto: { tagIds: tags },
                                            });
                                            refetch();
                                            handlePreviewMerge();
                                        } catch (error) {
                                            // 保存失败时恢复原值
                                            setVariantTagIds(selectedVariant.tagIds);
                                        }
                                    }
                                }}
                                disabled={disabled}
                            />
                        </div>

                        {/* 右侧：合并预览 */}
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                                <Label>合并预览</Label>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={handlePreviewMerge}
                                    disabled={disabled || mergeMutation.isPending}
                                >
                                    {mergeMutation.isPending ? (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    ) : (
                                        '刷新预览'
                                    )}
                                </Button>
                            </div>
                            <Textarea
                                value={mergedPreview}
                                readOnly
                                rows={12}
                                className='font-mono text-sm bg-muted'
                                placeholder='合并后的 Prompt 将显示在这里...'
                            />
                        </div>
                    </div>
                </div>
            )}

            {variants.length === 0 && (
                <div className='text-center py-8 text-muted-foreground border rounded-lg'>
                    暂无变体，点击"新建"创建第一个变体
                </div>
            )}
        </div>
    );
}
