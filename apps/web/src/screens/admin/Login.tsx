import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    FormControl,
    FormLabel,
    Input,
    Typography,
    Sheet,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../../stores/auth-store';
import { WechatLoginDto } from '@lourd-game/shared';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { enqueueSnackbar } = useSnackbar();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!code.trim()) {
            enqueueSnackbar('请输入微信授权码', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const dto: WechatLoginDto = {
                code: code.trim(),
                type: 'web',
            };
            await login(dto);
            enqueueSnackbar('登录成功', { variant: 'success' });
            navigate('/admin/resources');
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
                <Typography level="h3" sx={{ mb: 2, textAlign: 'center' }}>
                    管理后台登录
                </Typography>
                <Sheet variant="outlined" sx={{ p: 2, borderRadius: 'sm', mb: 2 }}>
                    <Typography level="body-sm" color="neutral">
                        请使用微信扫码登录，获取授权码后输入下方
                    </Typography>
                </Sheet>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                        <FormLabel>微信授权码</FormLabel>
                        <Input
                            placeholder="请输入微信授权码"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <Button
                        variant="solid"
                        color="primary"
                        onClick={handleLogin}
                        loading={loading}
                        fullWidth
                    >
                        登录
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}

