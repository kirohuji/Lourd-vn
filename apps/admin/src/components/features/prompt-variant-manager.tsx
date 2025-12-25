import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Plus, Star, Trash2 } from 'lucide-react';
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
    const [variantTagIds, setVariantTagIds] = useState<VariantTagItem[]>([]);
    const [mergedPreview, setMergedPreview] = useState<string>('');

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
        } else {
            setVariantTagIds([]);
            setMergedPreview(basicPrompt);
        }
    }, [selectedVariant, basicPrompt]);

    // 实时预览合并结果 - 当标签变化时自动更新预览
    useEffect(() => {
        if (selectedVariant && variantTagIds.length > 0) {
            // 延迟触发合并预览，避免频繁请求
            const timer = setTimeout(() => {
                handlePreviewMerge();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setMergedPreview(basicPrompt);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantTagIds]);

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
                tagIds: [],
                order: variants.length,
            };
            const result = await createMutation.mutateAsync(dto);
            setSelectedVariantId(result.id);
            setNewVariantName('');
            setNewVariantDescription('');
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
                    <div className='flex items-center gap-2'>
                        <Input
                            placeholder='新变体名称'
                            value={newVariantName}
                            onChange={e => setNewVariantName(e.target.value)}
                            className='w-32'
                            disabled={disabled}
                        />
                        <Button size='sm' onClick={handleCreateVariant} disabled={disabled || createMutation.isPending}>
                            <Plus className='mr-2 h-4 w-4' />
                            新建
                        </Button>
                    </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                    {variants.map(variant => (
                        <div
                            key={variant.id}
                            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${
                                selectedVariantId === variant.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedVariantId(variant.id)}
                        >
                            {variant.isDefault && <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />}
                            <span className='text-sm font-medium'>{variant.name}</span>
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
                                disabled={disabled || variant.isDefault}
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
                                disabled={disabled || variant.isDefault || deleteMutation.isPending}
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

                    {/* 标签选择 */}
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
                                } catch (error) {
                                    // 保存失败时恢复原值
                                    setVariantTagIds(selectedVariant.tagIds);
                                }
                            }
                        }}
                        disabled={disabled}
                    />

                    {/* 合并预览 */}
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
                            rows={8}
                            className='font-mono text-sm bg-muted'
                            placeholder='合并后的 Prompt 将显示在这里...'
                        />
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
