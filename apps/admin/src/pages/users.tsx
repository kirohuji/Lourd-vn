import { Pagination } from '@/components/features/pagination';
import { SearchBar } from '@/components/features/search-bar';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDeleteUser, useUpdateUser, useUsers } from '@/lib/hooks/use-users';
import { UpdateUserDto, UserResponseDto, UserRole } from '@lourd-game/shared';
import { Edit, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        email?: string;
        wechatNickname?: string;
    } | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<{ id: number; email?: string; role: UserRole } | null>(null);
    const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);

    const { toast } = useToast();
    const { data, isLoading, refetch } = useUsers({
        page,
        limit: 20,
        role: roleFilter === 'all' ? undefined : (roleFilter as UserRole),
        search: searchQuery || undefined,
    });
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const users: UserResponseDto[] = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handleEdit = (user: (typeof users)[0]) => {
        setUserToEdit({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        setEditRole(user.role);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!userToEdit) return;

        try {
            const dto: UpdateUserDto = {
                role: editRole,
            };
            await updateUser.mutateAsync({ id: userToEdit.id, dto });
            toast({
                title: '成功',
                description: '用户更新成功',
            });
            setEditDialogOpen(false);
            setUserToEdit(null);
        } catch (error: any) {
            toast({
                title: '更新失败',
                description: error.message || '更新用户失败',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await deleteUser.mutateAsync(userToDelete.id);
            const userDisplayName = userToDelete.wechatNickname || userToDelete.email || `ID: ${userToDelete.id}`;
            toast({
                title: '成功',
                description: `已删除用户: ${userDisplayName}`,
            });
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除用户失败',
                variant: 'destructive',
            });
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN:
                return '管理员';
            case UserRole.USER:
                return '用户';
            default:
                return role;
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>用户管理</h1>
                <Button variant='outline' onClick={() => refetch()}>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    刷新
                </Button>
            </div>

            <div className='flex gap-2'>
                <SearchBar
                    placeholder='搜索用户邮箱或微信昵称...'
                    value={searchQuery}
                    onChange={value => {
                        setSearchQuery(value);
                        setPage(1);
                    }}
                    className='flex-1'
                />
                <Select
                    value={roleFilter}
                    onValueChange={value => {
                        setRoleFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className='w-[150px]'>
                        <SelectValue placeholder='筛选角色' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>全部</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>管理员</SelectItem>
                        <SelectItem value={UserRole.USER}>用户</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : (
                <>
                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>头像</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>微信昵称</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead className='text-right'>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                                            暂无用户
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.id}</TableCell>
                                            <TableCell>
                                                {user.wechatAvatar ? (
                                                    <img
                                                        src={user.wechatAvatar}
                                                        alt={user.wechatNickname || '用户头像'}
                                                        className='h-8 w-8 rounded-full object-cover'
                                                    />
                                                ) : (
                                                    <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground'>
                                                        无
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className='font-medium'>{user.email || '-'}</TableCell>
                                            <TableCell>{user.wechatNickname || '-'}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        user.role === UserRole.ADMIN
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleString('zh-CN')}</TableCell>
                                            <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => {
                                                            setUserToDelete({
                                                                id: user.id,
                                                                email: user.email,
                                                                wechatNickname: user.wechatNickname,
                                                            });
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

                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </>
            )}

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除用户 "
                            {userToDelete?.wechatNickname || userToDelete?.email || `ID: ${userToDelete?.id}`}"
                            吗？此操作不可恢复。
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

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑用户</DialogTitle>
                        <DialogDescription>修改用户角色</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-role'>角色</Label>
                            <Select value={editRole} onValueChange={value => setEditRole(value as UserRole)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UserRole.ADMIN}>管理员</SelectItem>
                                    <SelectItem value={UserRole.USER}>用户</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveEdit}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
