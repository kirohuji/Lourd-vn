import { Box, CircularProgress, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { initializeGame } from '../utils/game-initialization';

interface LoadingScreenProps {
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

// 使用模块级别的变量来追踪初始化状态，防止重复初始化
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

export default function LoadingScreen({ onComplete, onError }: LoadingScreenProps = {}) {
    const { isAuthenticated } = useAuthStore();
    const [loadingStatus, setLoadingStatus] = useState<string>('正在初始化游戏...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 如果未认证，不进行初始化
        if (!isAuthenticated) {
            return;
        }

        // 如果正在初始化或已经初始化，等待现有的初始化完成
        if (isInitializing && initializationPromise) {
            initializationPromise
                .then(() => {
                    if (onComplete) {
                        setTimeout(() => {
                            onComplete();
                        }, 500);
                    }
                })
                .catch(err => {
                    if (onError) {
                        onError(err);
                    }
                });
            return;
        }

        // 标记为正在初始化
        isInitializing = true;

        // 开始游戏初始化
        const init = async () => {
            try {
                setLoadingStatus('正在加载角色...');
                await initializeGame();
                setLoadingStatus('初始化完成');

                // 初始化成功，标记为已完成
                isInitializing = false;
                initializationPromise = null;

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

                // 重置初始化标志，允许重试
                isInitializing = false;
                initializationPromise = null;

                // 调用错误回调
                if (onError) {
                    onError(err);
                }
            }
        };

        // 保存初始化 promise，以便其他组件实例可以等待同一个初始化
        initializationPromise = init();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // 移除 onComplete 和 onError 作为依赖

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
