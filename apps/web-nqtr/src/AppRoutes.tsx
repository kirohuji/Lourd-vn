import { Route, Routes, useLocation } from 'react-router-dom';
import MoveButton from './components/MoveButton';
import NextButton from './components/NextButton';
import VisibilityButton from './components/VisibilityButton';
import { LOADING_ROUTE, MAIN_MENU_ROUTE, MAP_ROUTE, NARRATION_ROUTE, NAVIGATION_ROUTE } from './constans';
import useNQTRDetector from './hooks/useNQTRDetector';
import useSkipAutoDetector from './hooks/useSkipAutoDetector';
import HistoryScreen from './screens/HistoryScreen';
import LoadingScreen from './screens/LoadingScreen';
import MainMenu from './screens/MainMenu';
import TextInput from './screens/modals/TextInput';
import NarrationScreen from './screens/NarrationScreen';
import MapScreen from './screens/nqtr/MapScreen';
import MemoScreen from './screens/nqtr/MemoScreen';
import NqtrQuickTools from './screens/nqtr/NqtrQuickTools';
import QuickActivities from './screens/nqtr/QuickActivities';
import QuickRooms from './screens/nqtr/QuickRooms';
import TimeScreen from './screens/nqtr/TimeScreen';
import QuickTools from './screens/QuickTools';
import UserLogin from './screens/user/Login';
import { AuthGuard } from './utils/auth-guard';

/**
 * 游戏路由配置
 * 只包含游戏相关的路由，admin 路由已移到 AdminApp.tsx
 */
export default function AppRoutes() {
    return (
        <Routes>
            {/* 普通用户登录页面 */}
            <Route path='/login' element={<UserLogin />} />

            {/* 游戏路由 - 需要登录 */}
            <Route
                key={'main_menu'}
                path={MAIN_MENU_ROUTE}
                element={
                    <AuthGuard requireAuth={true} redirectTo='/login'>
                        <MainMenu />
                    </AuthGuard>
                }
            />
            <Route
                key={'loading'}
                path={LOADING_ROUTE}
                element={
                    <AuthGuard requireAuth={true} redirectTo='/login'>
                        <LoadingScreen />
                    </AuthGuard>
                }
            />
            <Route
                key={'narration'}
                path={NARRATION_ROUTE}
                element={
                    <AuthGuard requireAuth={true} redirectTo='/login'>
                        <NarrationElement />
                    </AuthGuard>
                }
            />
            <Route
                key={'navigation'}
                path={NAVIGATION_ROUTE}
                element={
                    <AuthGuard requireAuth={true} redirectTo='/login'>
                        <NavigationElement />
                    </AuthGuard>
                }
            />
            <Route
                key={'map'}
                path={MAP_ROUTE}
                element={
                    <AuthGuard requireAuth={true} redirectTo='/login'>
                        <MapScreen />
                    </AuthGuard>
                }
            />

            {/* Catch-all 路由 - 需要登录 */}
            <Route path='*' element={<CatchAllRoute />} />
        </Routes>
    );
}

function NarrationElement() {
    return (
        <>
            <HistoryScreen />
            <NarrationScreen />
            <QuickTools />
            <TextInput />
            <NextButton />
            <NarrationDetectors />
            <VisibilityButton />
        </>
    );
}

function NavigationElement() {
    NavigationDetectors();
    return (
        <>
            <HistoryScreen />
            <MemoScreen />
            <QuickActivities />
            <QuickRooms />
            <TimeScreen />
            <NqtrQuickTools />
            <MoveButton />
            <VisibilityButton />
        </>
    );
}

function NarrationDetectors() {
    useSkipAutoDetector();
    return <></>;
}

function NavigationDetectors() {
    useNQTRDetector();
    return <></>;
}

// Catch-all 路由组件，确保不会拦截登录页面
function CatchAllRoute() {
    const location = useLocation();

    // 如果当前路径是登录页面或 admin 相关路径，不应该被 catch-all 路由处理
    // admin 路由由 AdminApp 处理，这里不应该匹配到
    if (location.pathname === '/login' || location.pathname.startsWith('/admin')) {
        // 如果是 admin 路径，说明路由匹配有问题，不应该被 catch-all 处理
        // 返回 null 让 React Router 显示 404 或者让上面的路由处理
        console.warn(`Catch-all route matched ${location.pathname}, this should not happen`);
        return null;
    }

    return (
        <AuthGuard requireAuth={true} redirectTo='/login'>
            <MainMenu />
        </AuthGuard>
    );
}
