import { UpdateUserDto, UserResponseDto, UserRole } from '@lourd-game/shared';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    FormLabel,
    IconButton,
    Input,
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Sheet,
    Table,
    Typography,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import ModalConfirmation from '../../components/ModalConfirmation';
import { apiClient } from '../../utils/api-client';

export default function UsersManagement() {
    const { enqueueSnackbar } = useSnackbar();

    // 状态管理
    const [users, setUsers] = useState<UserResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserResponseDto | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserResponseDto | null>(null);
    const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);

    // 加载用户列表
    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getUsers({
                page,
                limit: 20,
                role: roleFilter || undefined,
                search: searchQuery || undefined,
            });
            setUsers(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error: any) {
            console.error('加载用户失败:', error);
            enqueueSnackbar(`加载失败: ${error.message}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 初始化加载
    useEffect(() => {
        loadUsers();
    }, [page, roleFilter, searchQuery]);

    // 处理删除用户
    const handleDeleteUser = async (user: UserResponseDto) => {
        try {
            await apiClient.deleteUser(user.id);
            enqueueSnackbar(`已删除用户: ${user.email || `ID: ${user.id}`}`, { variant: 'success' });
            loadUsers();
        } catch (error: any) {
            console.error('删除用户失败:', error);
            enqueueSnackbar(`删除失败: ${error.message}`, { variant: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    // 处理编辑用户
    const handleEditUser = (user: UserResponseDto) => {
        setUserToEdit(user);
        setEditRole(user.role);
        setEditModalOpen(true);
    };

    // 保存用户编辑
    const handleSaveEdit = async () => {
        if (!userToEdit) return;

        try {
            const dto: UpdateUserDto = {
                role: editRole,
            };
            await apiClient.updateUser(userToEdit.id, dto);
            enqueueSnackbar('用户更新成功', { variant: 'success' });
            setEditModalOpen(false);
            setUserToEdit(null);
            loadUsers();
        } catch (error: any) {
            console.error('更新用户失败:', error);
            enqueueSnackbar(`更新失败: ${error.message}`, { variant: 'error' });
        }
    };

    // 格式化日期
    const formatDate = (date: Date | string): string => {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography level='h3'>用户管理</Typography>

                {/* 用户列表区域 */}
                <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography level='title-lg'>用户列表 ({total})</Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Input
                                placeholder='搜索用户'
                                startDecorator={<SearchIcon />}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                sx={{ width: 200 }}
                            />
                            <Select
                                value={roleFilter}
                                onChange={(_, value) => {
                                    setRoleFilter((value as UserRole | '') || '');
                                    setPage(1);
                                }}
                                sx={{ minWidth: 150 }}
                                placeholder='筛选角色'
                            >
                                <Option value=''>全部</Option>
                                <Option value={UserRole.USER}>普通用户</Option>
                                <Option value={UserRole.ADMIN}>管理员</Option>
                            </Select>
                            <IconButton variant='outlined' onClick={loadUsers} loading={loading} title='刷新'>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : users.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography level='body-lg' color='neutral'>
                                暂无用户
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Table hoverRow sx={{ '& thead th': { fontWeight: 'lg' } }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>邮箱</th>
                                        <th>角色</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <Typography level='body-sm' fontWeight='lg'>
                                                    {user.id}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>{user.email || 'N/A'}</Typography>
                                            </td>
                                            <td>
                                                <Chip
                                                    size='sm'
                                                    variant='outlined'
                                                    color={user.role === UserRole.ADMIN ? 'danger' : 'primary'}
                                                >
                                                    {user.role === UserRole.ADMIN ? '管理员' : '普通用户'}
                                                </Chip>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>{formatDate(user.createdAt)}</Typography>
                                            </td>
                                            <td>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        size='sm'
                                                        variant='outlined'
                                                        color='primary'
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size='sm'
                                                        variant='outlined'
                                                        color='danger'
                                                        onClick={() => {
                                                            setUserToDelete(user);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                                    <Button variant='outlined' disabled={page === 1} onClick={() => setPage(page - 1)}>
                                        上一页
                                    </Button>
                                    <Typography level='body-sm' sx={{ alignSelf: 'center' }}>
                                        第 {page} / {totalPages} 页
                                    </Typography>
                                    <Button
                                        variant='outlined'
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        下一页
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Sheet>
            </Box>

            {/* 编辑用户对话框 */}
            <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        编辑用户
                    </Typography>
                    {userToEdit && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography level='body-sm'>用户 ID: {userToEdit.id}</Typography>
                            <Typography level='body-sm'>邮箱: {userToEdit.email || 'N/A'}</Typography>
                            <FormControl>
                                <FormLabel>角色</FormLabel>
                                <Select value={editRole} onChange={(_, value) => setEditRole(value as UserRole)}>
                                    <Option value={UserRole.USER}>普通用户</Option>
                                    <Option value={UserRole.ADMIN}>管理员</Option>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                                <Button variant='outlined' onClick={() => setEditModalOpen(false)}>
                                    取消
                                </Button>
                                <Button variant='solid' color='primary' onClick={handleSaveEdit}>
                                    保存
                                </Button>
                            </Box>
                        </Box>
                    )}
                </ModalDialog>
            </Modal>

            {/* 删除确认对话框 */}
            <ModalConfirmation
                open={deleteConfirmOpen}
                setOpen={setDeleteConfirmOpen}
                color='danger'
                head={
                    <Typography level='h4' startDecorator={<DeleteIcon />}>
                        确认删除
                    </Typography>
                }
                onConfirm={() => {
                    if (userToDelete) {
                        handleDeleteUser(userToDelete);
                    }
                    return true;
                }}
                disabledConfirm={false}
                startDecorator={<DeleteIcon />}
            >
                {userToDelete && (
                    <Typography>
                        确定要删除用户 "{userToDelete.email || `ID: ${userToDelete.id}`}" 吗？
                        <br />
                        <Typography level='body-sm' color='neutral'>
                            此操作不可恢复。
                        </Typography>
                    </Typography>
                )}
            </ModalConfirmation>
        </>
    );
}
