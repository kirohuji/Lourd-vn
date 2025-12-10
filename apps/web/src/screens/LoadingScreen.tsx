import { Box, CircularProgress, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { initializeGame } from '../utils/game-initialization';

interface LoadingScreenProps {
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export default function LoadingScreen({ onComplete, onError }: LoadingScreenProps = {}) {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [loadingStatus, setLoadingStatus] = useState<string>('正在初始化游戏...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 检查认证状态
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // 如果未认证，不进行初始化
        if (!isAuthenticated) {
            return;
        }

        // 开始游戏初始化
        const init = async () => {
            try {
                setLoadingStatus('正在加载角色...');
                await initializeGame();
                setLoadingStatus('初始化完成');

                // 初始化完成后调用回调
                if (onComplete) {
                    setTimeout(() => {
                        onComplete();
                    }, 500);
                }
            } catch (err: any) {
                console.error('Game initialization error:', err);
                const errorMessage = err.message || '游戏初始化失败，请重试';
                setError(errorMessage);
                setLoadingStatus('初始化失败');

                // 调用错误回调
                if (onError) {
                    onError(err);
                }
            }
        };

        init();
    }, [isAuthenticated, onComplete, onError]);

    // 如果未认证，不渲染内容
    if (!isAuthenticated) {
        return null;
    }

    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
            }}
        >
            <CircularProgress size='lg' />
            <Typography level='body-lg' color={error ? 'danger' : 'neutral'}>
                {error || loadingStatus}
            </Typography>
            {error && (
                <Typography level='body-sm' color='neutral'>
                    如果问题持续存在，请尝试重新登录
                </Typography>
            )}
        </Box>
    );
}
