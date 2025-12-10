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
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export interface BundleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bundleName?: string;
    bundleType?: 'common' | 'chapter';
    onSave: (name: string, type: 'common' | 'chapter') => Promise<void>;
}

export function BundleDialog({
    open,
    onOpenChange,
    bundleName,
    bundleType,
    onSave,
}: BundleDialogProps) {
    const isEditMode = !!bundleName;
    const [name, setName] = useState('');
    const [type, setType] = useState<'common' | 'chapter'>('chapter');
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // 初始化表单值
    useEffect(() => {
        if (open) {
            setName(bundleName || '');
            setType(bundleType || 'chapter');
        }
    }, [open, bundleName, bundleType]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                title: '错误',
                description: '请输入Bundle名称',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            await onSave(name.trim(), type);
            toast({
                title: '成功',
                description: isEditMode ? 'Bundle更新成功' : 'Bundle创建成功',
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: isEditMode ? '更新失败' : '创建失败',
                description: error.message || `${isEditMode ? '更新' : '创建'}Bundle失败`,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? '编辑Bundle' : '创建Bundle'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? '修改Bundle名称和类型（会影响该Bundle下的所有资源）'
                            : '创建新的Bundle，然后可以上传资源到这个Bundle'}
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='bundle-name'>Bundle名称 *</Label>
                        <Input
                            id='bundle-name'
                            placeholder='输入Bundle名称'
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='bundle-type'>Bundle类型 *</Label>
                        <Select value={type} onValueChange={value => setType(value as 'common' | 'chapter')} disabled={saving}>
                            <SelectTrigger id='bundle-type'>
                                <SelectValue placeholder='选择Bundle类型' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='common'>共通资源包</SelectItem>
                                <SelectItem value='chapter'>章节资源包</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className='text-sm text-muted-foreground'>
                            {type === 'common'
                                ? '共通资源包：一次性加载，所有章节共享'
                                : '章节资源包：按章节加载，每个章节独立'}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim()}>
                        {saving ? '保存中...' : isEditMode ? '保存' : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

