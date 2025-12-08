import { EmailLoginDto } from '@lourd-game/shared';
import { Box, Button, Card, FormControl, FormLabel, Input, Typography } from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { emailLogin, isAuthenticated, isAdmin, checkAuth } = useAuthStore();
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 检查是否已登录且是管理员，如果是则跳转到管理后台
    useEffect(() => {
        checkAuth();
        // 只有在确实已登录且是管理员时才跳转，避免在登录页面时误跳转
        if (isAuthenticated && isAdmin()) {
            navigate('/admin/resources', { replace: true });
        }
    }, [isAuthenticated, navigate, checkAuth]);

    const handleLogin = async () => {
        if (!email.trim()) {
            enqueueSnackbar('请输入邮箱', { variant: 'warning' });
            return;
        }

        if (!password.trim()) {
            enqueueSnackbar('请输入密码', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const dto: EmailLoginDto = {
                email: email.trim(),
                password: password.trim(),
            };
            await emailLogin(dto);
            enqueueSnackbar('登录成功', { variant: 'success' });
            navigate('/admin/resources');
        } catch (error: any) {
            console.error('登录失败:', error);
            enqueueSnackbar(`登录失败: ${error.message || '邮箱或密码错误'}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(to bottom, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Card sx={{ width: 400, p: 3 }}>
                <Typography level='h3' sx={{ mb: 2, textAlign: 'center' }}>
                    管理后台登录
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                        <FormLabel>邮箱</FormLabel>
                        <Input
                            type='email'
                            placeholder='请输入邮箱'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>密码</FormLabel>
                        <Input
                            type='password'
                            placeholder='请输入密码'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <Button variant='solid' color='primary' onClick={handleLogin} loading={loading} fullWidth>
                        登录
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
