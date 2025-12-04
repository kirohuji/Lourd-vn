import { WechatLoginDto } from '@lourd-game/shared';
import { Box, Button, Card, FormControl, FormLabel, Input, Sheet, Typography } from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import {
    getWeChatMiniProgramCode,
    getWeChatWebCode,
    isWeChatMiniProgram,
    isWeChatWeb,
} from '../../utils/wechat-utility';

// 声明全局类型，用于 Taro 和微信小程序 API
declare const Taro: any;
declare const wx: any;

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { enqueueSnackbar } = useSnackbar();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMiniProgram, setIsMiniProgram] = useState(false);

    // 检测环境并自动登录
    useEffect(() => {
        const autoLogin = async () => {
            try {
                // 检测是否在微信小程序环境
                if (isWeChatMiniProgram()) {
                    setIsMiniProgram(true);
                    setLoading(true);

                    // 自动获取微信小程序 code 并登录
                    const miniProgramCode = await getWeChatMiniProgramCode();
                    const dto: WechatLoginDto = {
                        code: miniProgramCode,
                        type: 'miniprogram',
                    };

                    await login(dto);
                    enqueueSnackbar('登录成功', { variant: 'success' });
                    navigate('/admin/resources');
                    return;
                }

                // 检测是否在微信网页环境
                if (isWeChatWeb()) {
                    const webCode = getWeChatWebCode();
                    if (webCode) {
                        setLoading(true);
                        const dto: WechatLoginDto = {
                            code: webCode,
                            type: 'web',
                        };

                        await login(dto);
                        enqueueSnackbar('登录成功', { variant: 'success' });
                        navigate('/admin/resources');
                        return;
                    }
                }
            } catch (error: any) {
                console.error('自动登录失败:', error);
                setLoading(false);
                // 自动登录失败时，显示手动登录界面
            }
        };

        autoLogin();
    }, [login, navigate, enqueueSnackbar]);

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

    // 如果是微信小程序环境且正在自动登录，显示加载中
    if (isMiniProgram && loading) {
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
                        正在登录...
                    </Typography>
                </Card>
            </Box>
        );
    }

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
                <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm', mb: 2 }}>
                    <Typography level='body-sm' color='neutral'>
                        {isWeChatMiniProgram()
                            ? '正在使用微信小程序自动登录...'
                            : isWeChatWeb()
                            ? '请使用微信扫码登录，获取授权码后输入下方'
                            : '请使用微信扫码登录，获取授权码后输入下方'}
                    </Typography>
                </Sheet>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                        <FormLabel>微信授权码</FormLabel>
                        <Input
                            placeholder='请输入微信授权码'
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            disabled={isWeChatMiniProgram()}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleLogin();
                                }
                            }}
                        />
                    </FormControl>
                    <Button
                        variant='solid'
                        color='primary'
                        onClick={handleLogin}
                        loading={loading}
                        disabled={isWeChatMiniProgram()}
                        fullWidth
                    >
                        {isWeChatMiniProgram() ? '自动登录中...' : '登录'}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
