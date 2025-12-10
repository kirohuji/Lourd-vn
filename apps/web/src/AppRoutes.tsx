import { Route, Routes, useLocation } from 'react-router-dom';
import NextButton from './components/NextButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import VisibilityButton from './components/VisibilityButton';
import { LOGIN_ROUTE, MAIN_MENU_ROUTE, NARRATION_ROUTE } from './constans';
import useSkipAutoDetector from './hooks/useSkipAutoDetector';
import HistoryScreen from './screens/HistoryScreen';
import MainMenu from './screens/MainMenu';
import TextInput from './screens/modals/TextInput';
import NarrationScreen from './screens/NarrationScreen';
import QuickTools from './screens/QuickTools';
import UserLogin from './screens/user/Login';

export default function AppRoutes() {
    return (
        <Routes>
            {/* 普通用户登录页面 */}
            <Route path={LOGIN_ROUTE} element={<UserLogin />} />

            {/* 游戏路由 - 需要登录 */}
            <Route
                key={'main_menu'}
                path={MAIN_MENU_ROUTE}
                element={
                    <ProtectedRoute requireAuth={true} redirectTo={LOGIN_ROUTE}>
                        <MainMenu />
                    </ProtectedRoute>
                }
            />
            <Route
                key={'narration'}
                path={NARRATION_ROUTE}
                element={
                    <ProtectedRoute requireAuth={true} redirectTo={LOGIN_ROUTE}>
                        <NarrationElement />
                    </ProtectedRoute>
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

function NarrationDetectors() {
    useSkipAutoDetector();
    return <></>;
}

// Catch-all 路由组件，确保不会拦截登录页面
function CatchAllRoute() {
    const location = useLocation();

    // 如果当前路径是登录页面，不应该被 catch-all 路由处理
    if (location.pathname === LOGIN_ROUTE) {
        console.warn(`Catch-all route matched ${location.pathname}, this should not happen`);
        return null;
    }

    return (
        <ProtectedRoute requireAuth={true} redirectTo={LOGIN_ROUTE}>
            <MainMenu />
        </ProtectedRoute>
    );
}
