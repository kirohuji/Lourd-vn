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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CharacterPromptResponseDto, CreateCharacterPromptDto, UpdateCharacterPromptDto } from '@lourd-game/shared';
import { useEffect, useState, useRef } from 'react';
import { useCreateCharacterPrompt, useUpdateCharacterPrompt } from '@/lib/hooks/use-prompts';
import { apiClient } from '@/lib/api/client';
import { Upload, X, Loader2 } from 'lucide-react';

interface CharacterPromptFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    basePromptId: number;
    characterPrompt?: CharacterPromptResponseDto | null;
    onSuccess?: () => void;
}

export function CharacterPromptForm({
    open,
    onOpenChange,
    basePromptId,
    characterPrompt,
    onSuccess,
}: CharacterPromptFormProps) {
    const isEditMode = !!characterPrompt;
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [undesiredContent, setUndesiredContent] = useState('');
    const [normalizeReferenceStrength, setNormalizeReferenceStrength] = useState(false);
    const [referenceStrength, setReferenceStrength] = useState<number>(0.5);
    const [informationExtracted, setInformationExtracted] = useState<number>(0.5);
    const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
    const [uploadingReferenceImage, setUploadingReferenceImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const createMutation = useCreateCharacterPrompt();
    const updateMutation = useUpdateCharacterPrompt();

    useEffect(() => {
        if (isEditMode && characterPrompt) {
            setName(characterPrompt.name);
            setPrompt(characterPrompt.prompt);
            setUndesiredContent(characterPrompt.undesiredContent || '');
            setNormalizeReferenceStrength(characterPrompt.normalizeReferenceStrength || false);
            setReferenceStrength(characterPrompt.referenceStrength ?? 0.5);
            setInformationExtracted(characterPrompt.informationExtracted ?? 0.5);
            setReferenceImageUrl(characterPrompt.referenceImageUrl || '');
        } else {
            setName('');
            setPrompt('');
            setUndesiredContent('');
            setNormalizeReferenceStrength(false);
            setReferenceStrength(0.5);
            setInformationExtracted(0.5);
            setReferenceImageUrl('');
        }
    }, [isEditMode, characterPrompt, open]);

    const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isEditMode && !characterPrompt) {
            toast({
                title: '错误',
                description: '请先保存 Character Prompt 再上传参考图',
                variant: 'destructive',
            });
            return;
        }

        const characterPromptId = characterPrompt?.id;
        if (!characterPromptId) return;

        setUploadingReferenceImage(true);
        try {
            const result = await apiClient.uploadReferenceImage(characterPromptId, file);
            setReferenceImageUrl(result.imageUrl);
            toast({
                title: '成功',
                description: '参考图上传成功',
            });
        } catch (error: any) {
            toast({
                title: '上传失败',
                description: error.message || '上传参考图失败',
                variant: 'destructive',
            });
        } finally {
            setUploadingReferenceImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveReferenceImage = () => {
        setReferenceImageUrl('');
    };

    const handleSubmit = async () => {
        if (!name.trim() || !prompt.trim()) {
            toast({
                title: '错误',
                description: '请填写名称和 Prompt',
                variant: 'destructive',
            });
            return;
        }

        try {
            if (isEditMode && characterPrompt) {
                const dto: UpdateCharacterPromptDto = {
                    name: name.trim(),
                    prompt: prompt.trim(),
                    undesiredContent: undesiredContent.trim() || undefined,
                    normalizeReferenceStrength,
                    referenceStrength: referenceStrength,
                    informationExtracted: informationExtracted,
                    referenceImageUrl: referenceImageUrl || undefined,
                };
                await updateMutation.mutateAsync({ id: characterPrompt.id, dto });
                toast({
                    title: '成功',
                    description: 'Character Prompt 更新成功',
                });
            } else {
                const dto: CreateCharacterPromptDto = {
                    name: name.trim(),
                    prompt: prompt.trim(),
                    undesiredContent: undesiredContent.trim() || undefined,
                    normalizeReferenceStrength,
                    referenceStrength: referenceStrength,
                    informationExtracted: informationExtracted,
                    referenceImageUrl: referenceImageUrl || undefined,
                };
                const result = await createMutation.mutateAsync({ basePromptId, dto });
                // 如果创建成功且有参考图，上传参考图
                if (result.id && fileInputRef.current?.files?.[0]) {
                    const file = fileInputRef.current.files[0];
                    try {
                        const uploadResult = await apiClient.uploadReferenceImage(result.id, file);
                        setReferenceImageUrl(uploadResult.imageUrl);
                    } catch (error: any) {
                        console.error('上传参考图失败:', error);
                    }
                }
                toast({
                    title: '成功',
                    description: 'Character Prompt 创建成功',
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
            <DialogContent className='max-w-5xl max-h-[90vh] overflow-auto'>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑 Character Prompt' : '创建 Character Prompt'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? '修改 Character Prompt 信息' : '创建一个新的 Character Prompt'}
                    </DialogDescription>
                </DialogHeader>
                <div className='grid grid-cols-2 gap-6'>
                    {/* 左侧：基础信息 */}
                    <div className='space-y-4'>
                        <div className='font-semibold text-lg'>基础信息</div>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>名称 *</Label>
                            <Input
                                id='name'
                                placeholder='Character Prompt 名称'
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='prompt'>Prompt *</Label>
                            <Textarea
                                id='prompt'
                                placeholder='输入角色 Prompt'
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                rows={8}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='undesiredContent'>Undesired Content（可选）</Label>
                            <Textarea
                                id='undesiredContent'
                                placeholder='输入不希望出现的内容'
                                value={undesiredContent}
                                onChange={e => setUndesiredContent(e.target.value)}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                rows={6}
                            />
                        </div>
                    </div>

                    {/* 右侧：Vibe Transfer 参数 */}
                    <div className='space-y-4'>
                        <div className='font-semibold text-lg'>Vibe Transfer (Change the image, keep the vision.)</div>
                        
                        <div className='space-y-4 p-4 border rounded-lg'>
                            <div className='flex items-center justify-between'>
                                <Label htmlFor='normalizeReferenceStrength'>Normalize Reference Strength Values</Label>
                                <Switch
                                    id='normalizeReferenceStrength'
                                    checked={normalizeReferenceStrength}
                                    onCheckedChange={setNormalizeReferenceStrength}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                />
                            </div>

                            <Separator />

                            <div className='space-y-2'>
                                <Label htmlFor='referenceStrength'>
                                    Reference Strength: {referenceStrength.toFixed(2)}
                                </Label>
                                <Input
                                    id='referenceStrength'
                                    type='range'
                                    min='0'
                                    max='1'
                                    step='0.01'
                                    value={referenceStrength}
                                    onChange={e => setReferenceStrength(parseFloat(e.target.value))}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className='w-full'
                                />
                                <div className='flex justify-between text-xs text-muted-foreground'>
                                    <span>0</span>
                                    <span>1</span>
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='informationExtracted'>
                                    Information Extracted: {informationExtracted.toFixed(2)}
                                </Label>
                                <Input
                                    id='informationExtracted'
                                    type='range'
                                    min='0'
                                    max='1'
                                    step='0.01'
                                    value={informationExtracted}
                                    onChange={e => setInformationExtracted(parseFloat(e.target.value))}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className='w-full'
                                />
                                <div className='flex justify-between text-xs text-muted-foreground'>
                                    <span>0</span>
                                    <span>1</span>
                                </div>
                            </div>

                            <Separator />

                            <div className='space-y-2'>
                                <Label>参考图</Label>
                                {referenceImageUrl ? (
                                    <div className='relative'>
                                        <img
                                            src={referenceImageUrl}
                                            alt='参考图'
                                            className='w-full h-48 object-contain border rounded-lg'
                                        />
                                        <Button
                                            variant='destructive'
                                            size='icon'
                                            className='absolute top-2 right-2'
                                            onClick={handleRemoveReferenceImage}
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            <X className='h-4 w-4' />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='border-2 border-dashed rounded-lg p-8 text-center'>
                                        <Input
                                            ref={fileInputRef}
                                            type='file'
                                            accept='image/*'
                                            onChange={handleReferenceImageUpload}
                                            disabled={uploadingReferenceImage || createMutation.isPending || updateMutation.isPending}
                                            className='hidden'
                                            id='reference-image-input'
                                        />
                                        <Label
                                            htmlFor='reference-image-input'
                                            className='cursor-pointer flex flex-col items-center gap-2'
                                        >
                                            {uploadingReferenceImage ? (
                                                <Loader2 className='h-8 w-8 animate-spin' />
                                            ) : (
                                                <Upload className='h-8 w-8 text-muted-foreground' />
                                            )}
                                            <span className='text-sm text-muted-foreground'>
                                                {uploadingReferenceImage ? '上传中...' : '点击上传参考图'}
                                            </span>
                                        </Label>
                                    </div>
                                )}
                                {!isEditMode && (
                                    <p className='text-xs text-muted-foreground'>
                                        提示：创建后可以上传参考图
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={createMutation.isPending || updateMutation.isPending}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending || !name.trim() || !prompt.trim()}
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
