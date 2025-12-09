import { EmailLoginDto } from '@lourd-game/shared';
import { Box, Button, Card, FormControl, FormLabel, Input, Typography } from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOADING_ROUTE } from '../../constans';
import { useAuthStore } from '../../stores/auth-store';

export default function UserLogin() {
    const navigate = useNavigate();
    const { emailLogin, isAuthenticated, checkAuth } = useAuthStore();
    const { enqueueSnackbar } = useSnackbar();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 检查是否已登录，如果已登录则跳转到主菜单
    useEffect(() => {
        checkAuth();
        if (isAuthenticated) {
            navigate(LOADING_ROUTE);
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
            // 登录成功后先进入 Loading 场景，在那里完成游戏数据初始化
            navigate(LOADING_ROUTE);
        } catch (error: any) {
            console.error('登录失败:', error);
            enqueueSnackbar(`登录失败: ${error.message}`, { variant: 'error' });
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
                    用户登录
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                        <FormLabel>邮箱</FormLabel>
                        <Input
                            placeholder='请输入邮箱'
                            type='email'
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
                            placeholder='请输入密码'
                            type='password'
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

