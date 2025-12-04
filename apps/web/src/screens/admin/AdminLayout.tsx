import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Sheet,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemContent,
    Button,
} from '@mui/joy';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuthStore } from '../../stores/auth-store';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
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
                        <ListItemButton
                            selected={location.pathname.startsWith('/admin/resources')}
                            onClick={() => navigate('/admin/resources')}
                        >
                            <StorageIcon fontSize="small" />
                            <ListItemContent>资源管理</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton
                            selected={location.pathname.startsWith('/admin/maps')}
                            onClick={() => navigate('/admin/maps')}
                        >
                            <MapIcon fontSize="small" />
                            <ListItemContent>地图编辑</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton
                            selected={location.pathname.startsWith('/admin/characters')}
                            onClick={() => navigate('/admin/characters')}
                        >
                            <PersonOutlineIcon fontSize="small" />
                            <ListItemContent>角色编辑</ListItemContent>
                        </ListItemButton>
                    </ListItem>
                    <ListItem>
                        <ListItemButton
                            selected={location.pathname.startsWith('/admin/users')}
                            onClick={() => navigate('/admin/users')}
                        >
                            <PeopleIcon fontSize="small" />
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

