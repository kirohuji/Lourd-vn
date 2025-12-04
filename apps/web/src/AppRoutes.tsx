import { Route, Routes, useLocation } from 'react-router-dom';
import MoveButton from './components/MoveButton';
import NextButton from './components/NextButton';
import VisibilityButton from './components/VisibilityButton';
import { LOADING_ROUTE, MAIN_MENU_ROUTE, MAP_ROUTE, NARRATION_ROUTE, NAVIGATION_ROUTE } from './constans';
import useNQTRDetector from './hooks/useNQTRDetector';
import useSkipAutoDetector from './hooks/useSkipAutoDetector';
import AdminLayout from './screens/admin/AdminLayout';
import AdminLogin from './screens/admin/Login';
import ResourcesManagement from './screens/admin/ResourcesManagement';
import UsersManagement from './screens/admin/UsersManagement';
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

export default function AppRoutes() {
    return (
        <Routes>
            {/* 登录路由 - 必须在其他路由之前，特别是 /admin 路由之前 */}
            {/* 注意：/admin/login 必须在 /admin 路由之前定义，确保精确匹配 */}
            {/* 使用独立的组件包装，确保不会被其他路由拦截 */}
            <Route path='/admin/login' element={<AdminLoginWrapper />} />
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

            {/* 管理后台路由 - 需要管理员权限 */}
            <Route
                path='/admin'
                element={
                    <AuthGuard requireAdmin={true} redirectTo='/admin/login'>
                        <AdminLayout />
                    </AuthGuard>
                }
            >
                <Route
                    path='resources'
                    element={
                        <AuthGuard requireAdmin={true} redirectTo='/admin/login'>
                            <ResourcesManagement />
                        </AuthGuard>
                    }
                />
                <Route
                    path='users'
                    element={
                        <AuthGuard requireAdmin={true} redirectTo='/admin/login'>
                            <UsersManagement />
                        </AuthGuard>
                    }
                />
            </Route>

            {/* Catch-all 路由 - 需要登录 */}
            {/* 注意：这个路由不应该匹配 /admin/* 路径，因为 /admin/login 已经在上面定义了 */}
            {/* 使用 index 路由来避免匹配 /admin/* 路径 */}
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

// AdminLogin 包装组件，确保不会被 AuthGuard 拦截
function AdminLoginWrapper() {
    return <AdminLogin />;
}

// Catch-all 路由组件，确保不会拦截登录页面
function CatchAllRoute() {
    const location = useLocation();

    // 如果当前路径是登录页面或 admin 相关路径，不应该被 catch-all 路由处理
    // 这些路径应该由上面的具体路由处理
    // 如果 catch-all 路由被触发，说明路由匹配有问题，直接返回 null
    if (
        location.pathname === '/login' ||
        location.pathname === '/admin/login' ||
        location.pathname.startsWith('/admin')
    ) {
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
