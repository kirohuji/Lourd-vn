import { Outlet, useNavigate } from 'react-router-dom';
import {
    Box,
    Sheet,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemContent,
} from '@mui/joy';
import { useAuthStore } from '../../stores/auth-store';
import { Button } from '@mui/joy';

export default function AdminLayout() {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* 侧边栏 */}
            <Sheet
                variant="outlined"
                sx={{
                    width: 250,
                    p: 2,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography level="h4" sx={{ mb: 2 }}>
                    管理后台
                </Typography>
                <List>
                    <ListItem>
                        <ListItemButton onClick={() => navigate('/admin/resources')}>
                            <ListItemContent>资源管理</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton onClick={() => navigate('/admin/users')}>
                            <ListItemContent>用户管理</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                </List>
                <Box sx={{ mt: 'auto', pt: 2 }}>
                    {user && (
                        <Typography level="body-sm" sx={{ mb: 1 }}>
                            用户: {user.email || `ID: ${user.id}`}
                        </Typography>
                    )}
                    <Button variant="outlined" color="danger" onClick={handleLogout} fullWidth>
                        退出登录
                    </Button>
                </Box>
            </Sheet>

            {/* 主内容区 */}
            <Box sx={{ flex: 1, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
}

