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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { useCreateBasePrompt, useUpdateBasePrompt } from '@/lib/hooks/use-prompts';
import { BasePromptResponseDto, CreateBasePromptDto, UpdateBasePromptDto } from '@lourd-game/shared';
import { Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PromptVariantManager } from './prompt-variant-manager';

interface BasePromptFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    basePrompt?: BasePromptResponseDto | null;
    onSuccess?: () => void;
}

export function BasePromptForm({ open, onOpenChange, basePrompt, onSuccess }: BasePromptFormProps) {
    const isEditMode = !!basePrompt;
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
    const createMutation = useCreateBasePrompt();
    const updateMutation = useUpdateBasePrompt();

    useEffect(() => {
        if (isEditMode && basePrompt) {
            setName(basePrompt.name);
            setPrompt(basePrompt.basicPrompt);
            setUndesiredContent(basePrompt.undesiredContent || '');
            setNormalizeReferenceStrength(basePrompt.normalizeReferenceStrength || false);
            setReferenceStrength(basePrompt.referenceStrength ?? 0.5);
            setInformationExtracted(basePrompt.informationExtracted ?? 0.5);
            setReferenceImageUrl(basePrompt.referenceImageUrl || '');
        } else {
            setName('');
            setPrompt('');
            setUndesiredContent('');
            setNormalizeReferenceStrength(false);
            setReferenceStrength(0.5);
            setInformationExtracted(0.5);
            setReferenceImageUrl('');
        }
    }, [isEditMode, basePrompt, open]);

    const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isEditMode && !basePrompt) {
            toast({
                title: '错误',
                description: '请先保存 Base Prompt 再上传参考图',
                variant: 'destructive',
            });
            return;
        }

        const basePromptId = basePrompt?.id;
        if (!basePromptId) return;

        setUploadingReferenceImage(true);
        try {
            const result = await apiClient.uploadBasePromptReferenceImage(basePromptId, file);
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
        // 删除参考图时，重置相关参数
        setNormalizeReferenceStrength(false);
        setReferenceStrength(0.5);
        setInformationExtracted(0.5);
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
            if (isEditMode && basePrompt) {
                const dto: UpdateBasePromptDto = {
                    name: name.trim(),
                    basicPrompt: prompt.trim(),
                    // 如果 undesiredContent 为空字符串，传递 null 来清空；如果有值，传递值；如果未定义，不包含此字段
                    undesiredContent: undesiredContent.trim() === '' ? null : undesiredContent.trim() || undefined,
                    // 只有当有参考图时才保存 Vibe Transfer 参数
                    normalizeReferenceStrength: referenceImageUrl ? normalizeReferenceStrength : undefined,
                    referenceStrength: referenceImageUrl ? referenceStrength : undefined,
                    informationExtracted: referenceImageUrl ? informationExtracted : undefined,
                    // 如果 referenceImageUrl 为空字符串，传递 null 来删除；如果有值，传递值；如果未定义，不包含此字段
                    referenceImageUrl: referenceImageUrl === '' ? null : referenceImageUrl || undefined,
                };
                await updateMutation.mutateAsync({ id: basePrompt.id, dto });
                toast({
                    title: '成功',
                    description: 'Base Prompt 更新成功',
                });
            } else {
                const dto: CreateBasePromptDto = {
                    name: name.trim(),
                    basicPrompt: prompt.trim(),
                    undesiredContent: undesiredContent.trim() || undefined,
                    // 只有当有参考图时才保存 Vibe Transfer 参数
                    normalizeReferenceStrength: referenceImageUrl ? normalizeReferenceStrength : undefined,
                    referenceStrength: referenceImageUrl ? referenceStrength : undefined,
                    informationExtracted: referenceImageUrl ? informationExtracted : undefined,
                    referenceImageUrl: referenceImageUrl || undefined,
                };
                const result = await createMutation.mutateAsync(dto);
                // 如果创建成功且有参考图，上传参考图
                if (result.id && fileInputRef.current?.files?.[0]) {
                    const file = fileInputRef.current.files[0];
                    try {
                        const uploadResult = await apiClient.uploadBasePromptReferenceImage(result.id, file);
                        setReferenceImageUrl(uploadResult.imageUrl);
                    } catch (error: any) {
                        console.error('上传参考图失败:', error);
                    }
                }
                toast({
                    title: '成功',
                    description: 'Base Prompt 创建成功',
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
                    <DialogTitle>{isEditMode ? '编辑 Base Prompt' : '创建 Base Prompt'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? '修改 Base Prompt 信息' : '创建一个新的 Base Prompt'}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue='basic' className='w-full'>
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='basic'>基础 Prompt</TabsTrigger>
                        <TabsTrigger value='variants' disabled={!isEditMode || !basePrompt?.id}>
                            变体管理
                        </TabsTrigger>
                        <TabsTrigger value='settings'>设置</TabsTrigger>
                    </TabsList>

                    {/* 基础 Prompt 标签页 */}
                    <TabsContent value='basic' className='space-y-4'>
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='name'>名称 *</Label>
                                <Input
                                    id='name'
                                    placeholder='Base Prompt 名称'
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='prompt'>基础 Prompt *</Label>
                                <Textarea
                                    id='prompt'
                                    placeholder='输入基础 Prompt'
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    rows={10}
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
                    </TabsContent>

                    {/* 变体管理标签页 */}
                    <TabsContent value='variants' className='space-y-4'>
                        {isEditMode && basePrompt?.id && (
                            <PromptVariantManager
                                basePromptId={basePrompt.id}
                                basicPrompt={prompt}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            />
                        )}
                    </TabsContent>

                    {/* 设置标签页 */}
                    <TabsContent value='settings' className='space-y-4'>
                        <div className='space-y-4'>
                            <div className='font-semibold text-lg'>
                                Vibe Transfer (Change the image, keep the vision.)
                            </div>

                            <div className='space-y-4 p-4 border rounded-lg'>
                                {/* 参考图上传 - 放在最前面 */}
                                <div className='space-y-2'>
                                    <Label>参考图 *</Label>
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
                                                disabled={
                                                    uploadingReferenceImage ||
                                                    createMutation.isPending ||
                                                    updateMutation.isPending
                                                }
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
                                    {!isEditMode && !referenceImageUrl && (
                                        <p className='text-xs text-muted-foreground'>
                                            提示：上传参考图后，Vibe Transfer 功能将自动启用
                                        </p>
                                    )}
                                </div>

                                {/* 只有当有参考图时才显示其他参数 */}
                                {referenceImageUrl && (
                                    <>
                                        <Separator />

                                        <div className='flex items-center justify-between'>
                                            <Label htmlFor='normalizeReferenceStrength'>
                                                Normalize Reference Strength Values
                                            </Label>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
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
                            createMutation.isPending || updateMutation.isPending || !name.trim() || !prompt.trim()
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
