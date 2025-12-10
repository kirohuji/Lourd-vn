import { Box } from '@mui/joy';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import Routes from './AppRoutes';
import useClosePageDetector from './hooks/useClosePageDetector';
import useInkInitialization from './hooks/useInkInitialization';
import useKeyboardDetector from './hooks/useKeyboardDetector';
import useEventListener from './hooks/useKeyDetector';
import { useAuth } from './providers/AuthProvider';
import RootProvider from './providers/RootProvider';
import GameSaveScreen from './screens/GameSaveScreen';
import LoadingScreen from './screens/LoadingScreen';
import SaveLoadAlert from './screens/modals/SaveLoadAlert';
import OfflineScreen from './screens/OfflineScreen';
import Settings from './screens/Settings';

/**
 * 应用启动引导组件
 * 根据认证状态决定显示加载屏幕还是路由系统
 */
function AppBootstrap() {
    const { status } = useAuth();
    const [gameInitialized, setGameInitialized] = useState(false);

    // 当认证状态变化时，重置游戏初始化状态
    useEffect(() => {
        if (status === 'unauthenticated') {
            setGameInitialized(false);
        }
    }, [status]);

    // 如果正在检查认证状态，显示加载屏幕
    if (status === 'checking') {
        return (
            <Box
                sx={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Box>检查认证状态...</Box>
            </Box>
        );
    }

    // 如果已认证但游戏未初始化，显示加载屏幕并初始化游戏
    if (status === 'authenticated' && !gameInitialized) {
        return (
            <LoadingScreen
                onComplete={() => {
                    setGameInitialized(true);
                }}
                onError={error => {
                    console.error('Game initialization failed:', error);
                    // 初始化失败时，可以选择清除认证状态或显示错误
                }}
            />
        );
    }

    // 其他情况（未认证或已初始化），显示路由系统
    return <GameRoutes />;
}

/**
 * 游戏路由组件
 * 包含所有游戏相关的组件和路由
 */
function GameRoutes() {
    useKeyboardDetector();
    useClosePageDetector();
    useInkInitialization();
    // Prevent the user from going back to the previous page
    useEventListener({
        type: 'popstate',
        listener: () => {
            window.history.forward();
        },
    });

    return (
        <>
            <Routes />
            <Settings />
            <GameSaveScreen />
            <SaveLoadAlert />
            <OfflineScreen />
            <Box
                sx={{
                    pointerEvents: 'auto',
                }}
            >
                <ReactQueryDevtools initialIsOpen={false} />
            </Box>
        </>
    );
}
export default function Home() {
    return (
        <RootProvider>
            <AppBootstrap />
        </RootProvider>
    );
}
