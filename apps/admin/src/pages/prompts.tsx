import { BasePromptForm } from '@/components/features/base-prompt-form';
import { CharacterPromptForm } from '@/components/features/character-prompt-form';
import { PromptImagePreview } from '@/components/features/prompt-image-preview';
import { PromptImageUpload } from '@/components/features/prompt-image-upload';
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
import { useToast } from '@/hooks/use-toast';
import {
    useBasePromptImages,
    useBasePrompts,
    useCharacterPrompts,
    useDeleteBasePrompt,
    useDeleteCharacterPrompt,
    useDeletePromptImage,
    usePromptImages,
} from '@/lib/hooks/use-prompts';
import { BasePromptResponseDto, CharacterPromptResponseDto, PromptImageResponseDto } from '@lourd-game/shared';
import { Edit, Eye, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export function PromptsPage() {
    const [selectedBasePromptId, setSelectedBasePromptId] = useState<number | null>(null);
    const [selectedCharacterPromptId, setSelectedCharacterPromptId] = useState<number | null>(null);
    const [basePromptFormOpen, setBasePromptFormOpen] = useState(false);
    const [editingBasePrompt, setEditingBasePrompt] = useState<BasePromptResponseDto | null>(null);
    const [characterPromptFormOpen, setCharacterPromptFormOpen] = useState(false);
    const [editingCharacterPrompt, setEditingCharacterPrompt] = useState<CharacterPromptResponseDto | null>(null);
    const [imageUploadOpen, setImageUploadOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'base' | 'character' | 'image' | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name?: string } | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const { toast } = useToast();
    const { data: basePrompts = [], isLoading: isLoadingBasePrompts, refetch: refetchBasePrompts } = useBasePrompts();
    const {
        data: characterPrompts = [],
        isLoading: isLoadingCharacterPrompts,
        refetch: refetchCharacterPrompts,
    } = useCharacterPrompts(selectedBasePromptId || 0);
    const {
        data: characterPromptImages = [],
        isLoading: isLoadingCharacterImages,
        refetch: refetchCharacterImages,
    } = usePromptImages(selectedCharacterPromptId || 0);
    const {
        data: basePromptImages = [],
        isLoading: isLoadingBaseImages,
        refetch: refetchBaseImages,
    } = useBasePromptImages(selectedBasePromptId || 0);

    // 根据是否选中 CharacterPrompt 决定显示哪个图片集合
    const promptImages = selectedCharacterPromptId ? characterPromptImages : basePromptImages;
    const isLoadingImages = selectedCharacterPromptId ? isLoadingCharacterImages : isLoadingBaseImages;
    const refetchImages = selectedCharacterPromptId ? refetchCharacterImages : refetchBaseImages;

    const deleteBasePrompt = useDeleteBasePrompt();
    const deleteCharacterPrompt = useDeleteCharacterPrompt();
    const deleteImage = useDeletePromptImage();

    // 默认选中第一个 Base Prompt
    useEffect(() => {
        if (!selectedBasePromptId && basePrompts.length > 0) {
            setSelectedBasePromptId(basePrompts[0].id);
            setSelectedCharacterPromptId(null);
        }
    }, [basePrompts, selectedBasePromptId]);

    // 当 Base Prompt 改变时，重置 Character Prompt 选择
    useEffect(() => {
        setSelectedCharacterPromptId(null);
    }, [selectedBasePromptId]);

    const handleCreateBasePrompt = () => {
        setEditingBasePrompt(null);
        setBasePromptFormOpen(true);
    };

    const handleEditBasePrompt = (basePrompt: BasePromptResponseDto) => {
        setEditingBasePrompt(basePrompt);
        setBasePromptFormOpen(true);
    };

    const handleDeleteBasePrompt = (basePrompt: BasePromptResponseDto) => {
        setDeleteType('base');
        setItemToDelete({ id: basePrompt.id, name: basePrompt.name });
        setDeleteConfirmOpen(true);
    };

    const handleCreateCharacterPrompt = () => {
        if (!selectedBasePromptId) {
            toast({
                title: '错误',
                description: '请先选择一个 Base Prompt',
                variant: 'destructive',
            });
            return;
        }
        setEditingCharacterPrompt(null);
        setCharacterPromptFormOpen(true);
    };

    const handleEditCharacterPrompt = (characterPrompt: CharacterPromptResponseDto) => {
        setEditingCharacterPrompt(characterPrompt);
        setCharacterPromptFormOpen(true);
    };

    const handleDeleteCharacterPrompt = (characterPrompt: CharacterPromptResponseDto) => {
        setDeleteType('character');
        setItemToDelete({ id: characterPrompt.id, name: characterPrompt.name });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteImage = (image: PromptImageResponseDto) => {
        setDeleteType('image');
        setItemToDelete({ id: image.id });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete || !deleteType) return;

        try {
            if (deleteType === 'base') {
                await deleteBasePrompt.mutateAsync(itemToDelete.id);
                toast({ title: '成功', description: 'Base Prompt 已删除' });
                if (selectedBasePromptId === itemToDelete.id) {
                    setSelectedBasePromptId(null);
                }
            } else if (deleteType === 'character') {
                await deleteCharacterPrompt.mutateAsync(itemToDelete.id);
                toast({ title: '成功', description: 'Character Prompt 已删除' });
                if (selectedCharacterPromptId === itemToDelete.id) {
                    setSelectedCharacterPromptId(null);
                }
            } else if (deleteType === 'image') {
                await deleteImage.mutateAsync(itemToDelete.id);
                toast({ title: '成功', description: '图片已删除' });
            }
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
            setDeleteType(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除失败',
                variant: 'destructive',
            });
        }
    };

    const selectedBasePrompt = basePrompts.find(bp => bp.id === selectedBasePromptId);
    const selectedCharacterPrompt = characterPrompts.find(cp => cp.id === selectedCharacterPromptId);

    // 准备 lightbox 的图片数据
    const lightboxSlides = promptImages.map(image => ({
        src: image.imageUrl,
        alt: `Prompt Image ${image.id}`,
        title: `Prompt Image #${image.id}`,
        description: image.generatedPrompt,
    }));

    return (
        <div className='flex flex-col h-full space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Prompt 管理</h1>
                    <p className='text-sm text-muted-foreground'>管理 Base Prompt、Character Prompt 和生成的图片</p>
                </div>
                <Button onClick={handleCreateBasePrompt}>
                    <Plus className='mr-2 h-4 w-4' />
                    新建 Base Prompt
                </Button>
            </div>

            <div className='grid grid-cols-12 gap-4 flex-1 min-h-0'>
                {/* 左侧：Base Prompt 列表 */}
                <div className='col-span-3 border rounded-lg p-4 flex flex-col min-h-0'>
                    <div className='font-semibold mb-3'>Base Prompts</div>
                    {isLoadingBasePrompts ? (
                        <div className='flex items-center justify-center flex-1'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                    ) : basePrompts.length === 0 ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            暂无 Base Prompt
                        </div>
                    ) : (
                        <div className='space-y-2 overflow-auto flex-1'>
                            {basePrompts.map(bp => (
                                <div
                                    key={bp.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedBasePromptId === bp.id
                                            ? 'bg-primary/10 border-primary'
                                            : 'hover:bg-muted'
                                    }`}
                                    onClick={() => setSelectedBasePromptId(bp.id)}
                                >
                                    <div className='flex items-start justify-between'>
                                        <div className='flex-1 min-w-0'>
                                            <div className='font-medium truncate'>{bp.name}</div>
                                            <div className='text-xs text-muted-foreground mt-1'>
                                                {bp.characterPrompts?.length || 0} 个 Character Prompts
                                                {bp.imageCount !== undefined && bp.imageCount > 0 && (
                                                    <> · {bp.imageCount} 张图片</>
                                                )}
                                            </div>
                                        </div>
                                        <div className='flex gap-1 ml-2' onClick={e => e.stopPropagation()}>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6'
                                                onClick={() => handleEditBasePrompt(bp)}
                                            >
                                                <Edit className='h-3 w-3' />
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6 text-destructive'
                                                onClick={() => handleDeleteBasePrompt(bp)}
                                            >
                                                <Trash2 className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 中间：Character Prompt 列表 */}
                <div className='col-span-4 border rounded-lg p-4 flex flex-col min-h-0'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='font-semibold'>
                            Character Prompts
                            {selectedBasePrompt && ` - ${selectedBasePrompt.name}`}
                        </div>
                        {selectedBasePromptId && (
                            <Button size='sm' onClick={handleCreateCharacterPrompt}>
                                <Plus className='mr-2 h-4 w-4' />
                                新建
                            </Button>
                        )}
                    </div>
                    {!selectedBasePromptId ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            请先选择一个 Base Prompt
                        </div>
                    ) : isLoadingCharacterPrompts ? (
                        <div className='flex items-center justify-center flex-1'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                    ) : characterPrompts.length === 0 ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            暂无 Character Prompt
                        </div>
                    ) : (
                        <div className='space-y-2 overflow-auto flex-1'>
                            {characterPrompts.map(cp => (
                                <div
                                    key={cp.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedCharacterPromptId === cp.id
                                            ? 'bg-primary/10 border-primary'
                                            : 'hover:bg-muted'
                                    }`}
                                    onClick={() => setSelectedCharacterPromptId(cp.id)}
                                >
                                    <div className='flex items-start justify-between'>
                                        <div className='flex-1 min-w-0'>
                                            <div className='font-medium truncate'>{cp.name}</div>
                                            <div className='text-xs text-muted-foreground mt-1'>
                                                {cp.imageCount || 0} 张图片
                                            </div>
                                        </div>
                                        <div className='flex gap-1 ml-2' onClick={e => e.stopPropagation()}>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6'
                                                onClick={() => handleEditCharacterPrompt(cp)}
                                            >
                                                <Edit className='h-3 w-3' />
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6 text-destructive'
                                                onClick={() => handleDeleteCharacterPrompt(cp)}
                                            >
                                                <Trash2 className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 右侧：图片集合 */}
                <div className='col-span-5 border rounded-lg p-4 flex flex-col min-h-0'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='font-semibold'>
                            图片集合
                            {selectedCharacterPrompt
                                ? ` - ${selectedCharacterPrompt.name}`
                                : selectedBasePrompt
                                ? ` - ${selectedBasePrompt.name} (Base Prompt)`
                                : ''}
                        </div>
                        <div className='flex items-center gap-2'>
                            {promptImages.length > 0 && (
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => {
                                        setLightboxIndex(0);
                                        setLightboxOpen(true);
                                    }}
                                    title='快速预览所有图片（Lightbox）'
                                >
                                    <Eye className='mr-2 h-4 w-4' />
                                    快速预览
                                </Button>
                            )}
                            {(selectedCharacterPromptId || selectedBasePromptId) && (
                                <Button size='sm' onClick={() => setImageUploadOpen(true)}>
                                    <Upload className='mr-2 h-4 w-4' />
                                    上传图片
                                </Button>
                            )}
                        </div>
                    </div>
                    {!selectedBasePromptId ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            请先选择一个 Base Prompt
                        </div>
                    ) : isLoadingImages ? (
                        <div className='flex items-center justify-center flex-1'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                    ) : promptImages.length === 0 ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            暂无图片
                        </div>
                    ) : (
                        <div className='overflow-auto flex-1'>
                            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-2'>
                                {promptImages.map(image => (
                                    <div
                                        key={image.id}
                                        className='relative group aspect-square rounded-lg overflow-hidden border-2 border-border bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:scale-[1.02]'
                                    >
                                        {/* 原来的预览功能（点击图片） */}
                                        <PromptImagePreview
                                            image={image}
                                            size='thumbnail'
                                            onDelete={() => handleDeleteImage(image)}
                                        />
                                        {/* 图片信息提示 */}
                                        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            <p className='text-xs text-white truncate'>
                                                {new Date(image.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Base Prompt 表单对话框 */}
            <BasePromptForm
                open={basePromptFormOpen}
                onOpenChange={setBasePromptFormOpen}
                basePrompt={editingBasePrompt}
                onSuccess={() => {
                    refetchBasePrompts();
                }}
            />

            {/* Character Prompt 表单对话框 */}
            {selectedBasePromptId && (
                <CharacterPromptForm
                    open={characterPromptFormOpen}
                    onOpenChange={setCharacterPromptFormOpen}
                    basePromptId={selectedBasePromptId}
                    characterPrompt={editingCharacterPrompt}
                    onSuccess={() => {
                        refetchCharacterPrompts();
                        refetchBasePrompts();
                    }}
                />
            )}

            {/* 图片上传对话框 */}
            {(selectedCharacterPromptId || selectedBasePromptId) && (
                <PromptImageUpload
                    open={imageUploadOpen}
                    onOpenChange={setImageUploadOpen}
                    characterPromptId={selectedCharacterPromptId || 0}
                    basePromptId={selectedBasePromptId || undefined}
                    onSuccess={() => {
                        refetchImages();
                        refetchCharacterPrompts();
                        refetchBasePrompts();
                    }}
                />
            )}

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除{' '}
                            {deleteType === 'base'
                                ? 'Base Prompt'
                                : deleteType === 'character'
                                ? 'Character Prompt'
                                : '图片'}{' '}
                            {itemToDelete?.name ? `"${itemToDelete.name}"` : ''} 吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>确认删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 图片画廊 Lightbox */}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={lightboxSlides}
            />
        </div>
    );
}
