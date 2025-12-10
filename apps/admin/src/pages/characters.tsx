import { CharacterForm } from '@/components/features/character-form';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCharacters, useDeleteCharacter, useUpsertCharacter } from '@/lib/hooks/use-characters';
import { CharacterConfig, UpdateCharacterDto } from '@lourd-game/shared';
import { Edit, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function CharactersPage() {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [characterToDelete, setCharacterToDelete] = useState<CharacterConfig | null>(null);
    const [editCharacter, setEditCharacter] = useState<CharacterConfig | null>(null);
    const [characterId, setCharacterId] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [order, setOrder] = useState('0');

    const { toast } = useToast();
    const { data, isLoading, refetch } = useCharacters();
    const upsertCharacter = useUpsertCharacter();
    const deleteCharacter = useDeleteCharacter();

    const characters = data?.data || [];

    const openEdit = (c?: CharacterConfig) => {
        if (c) {
            // 编辑模式
            setEditCharacter(c);
            setCharacterId(c.id);
            setName(c.name);
            setAge(c.age != null ? String(c.age) : '');
            setIcon(c.icon || '');
            setColor(c.color || '');
            setEnabled(c.enabled);
            setOrder(String(c.order ?? 0));
        } else {
            // 新增模式
            setEditCharacter(null);
            setCharacterId('');
            setName('');
            setAge('');
            setIcon('');
            setColor('');
            setEnabled(true);
            setOrder('0');
        }
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        // 验证必填字段
        if (!characterId.trim()) {
            toast({
                title: '错误',
                description: '请输入角色 ID',
                variant: 'destructive',
            });
            return;
        }

        if (!name.trim()) {
            toast({
                title: '错误',
                description: '请输入角色名称',
                variant: 'destructive',
            });
            return;
        }

        try {
            const dto: UpdateCharacterDto = {
                name,
                age: age ? Number(age) : null,
                icon: icon || null,
                color: color || null,
                enabled,
                order: order ? Number(order) : 0,
            };
            await upsertCharacter.mutateAsync({ id: characterId.trim(), dto });
            toast({
                title: '成功',
                description: editCharacter ? '角色已更新' : '角色已创建',
            });
            setEditCharacter(null);
            setEditDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast({
                title: '保存失败',
                description: error.message || '保存角色失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!characterToDelete) return;

        try {
            await deleteCharacter.mutateAsync(characterToDelete.id);
            toast({
                title: '成功',
                description: `已删除角色: ${characterToDelete.name}`,
            });
            setDeleteConfirmOpen(false);
            setCharacterToDelete(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除角色失败',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>角色编辑</h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        这里可以查看和编辑角色的名称、头像、颜色、排序等基础信息。当前版本同样要求 ID
                        由后端或数据库预先创建。
                    </p>
                </div>
                <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => refetch()}>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        刷新
                    </Button>
                    <Button onClick={() => openEdit()}>
                        <Plus className='mr-2 h-4 w-4' />
                        新增角色
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : (
                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>年龄</TableHead>
                                <TableHead>启用</TableHead>
                                <TableHead>排序</TableHead>
                                <TableHead>颜色</TableHead>
                                <TableHead className='text-right'>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {characters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                                        暂无角色
                                    </TableCell>
                                </TableRow>
                            ) : (
                                characters.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.id}</TableCell>
                                        <TableCell className='font-medium'>{c.name}</TableCell>
                                        <TableCell>{c.age ?? '-'}</TableCell>
                                        <TableCell>{c.enabled ? '是' : '否'}</TableCell>
                                        <TableCell>{c.order}</TableCell>
                                        <TableCell>
                                            <div
                                                className='inline-block h-4 w-4 rounded-full border'
                                                style={{ backgroundColor: c.color || '#ccc' }}
                                            />
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <Button variant='ghost' size='icon' onClick={() => openEdit(c)}>
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => {
                                                        setCharacterToDelete(c);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className='h-4 w-4 text-destructive' />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>{editCharacter ? '编辑角色' : '新增角色'}</DialogTitle>
                        <DialogDescription>
                            {editCharacter ? '修改角色信息' : '创建新角色，请填写角色 ID 和名称'}
                        </DialogDescription>
                    </DialogHeader>
                    <CharacterForm
                        characterId={characterId}
                        name={name}
                        age={age}
                        icon={icon}
                        color={color}
                        enabled={enabled}
                        order={order}
                        onCharacterIdChange={setCharacterId}
                        onNameChange={setName}
                        onAgeChange={setAge}
                        onIconChange={setIcon}
                        onColorChange={setColor}
                        onEnabledChange={setEnabled}
                        onOrderChange={setOrder}
                    />
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除角色 "{characterToDelete?.name}" 吗？此操作不可恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
