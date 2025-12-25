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
import { BasePromptResponseDto, CreateBasePromptDto, UpdateBasePromptDto } from '@lourd-game/shared';
import { useEffect, useState } from 'react';
import { useCreateBasePrompt, useUpdateBasePrompt } from '@/lib/hooks/use-prompts';

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
    const { toast } = useToast();
    const createMutation = useCreateBasePrompt();
    const updateMutation = useUpdateBasePrompt();

    useEffect(() => {
        if (isEditMode && basePrompt) {
            setName(basePrompt.name);
            setPrompt(basePrompt.prompt);
            setUndesiredContent(basePrompt.undesiredContent || '');
        } else {
            setName('');
            setPrompt('');
            setUndesiredContent('');
        }
    }, [isEditMode, basePrompt, open]);

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
                    prompt: prompt.trim(),
                    undesiredContent: undesiredContent.trim() || undefined,
                };
                await updateMutation.mutateAsync({ id: basePrompt.id, dto });
                toast({
                    title: '成功',
                    description: 'Base Prompt 更新成功',
                });
            } else {
                const dto: CreateBasePromptDto = {
                    name: name.trim(),
                    prompt: prompt.trim(),
                    undesiredContent: undesiredContent.trim() || undefined,
                };
                await createMutation.mutateAsync(dto);
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
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-auto'>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑 Base Prompt' : '创建 Base Prompt'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? '修改 Base Prompt 信息' : '创建一个新的 Base Prompt'}
                    </DialogDescription>
                </DialogHeader>
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
                        <Label htmlFor='prompt'>Prompt *</Label>
                        <Textarea
                            id='prompt'
                            placeholder='输入基础 Prompt'
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            rows={6}
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
                            rows={4}
                        />
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

