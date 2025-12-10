import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

/**
 * 简化的路由守卫组件
 * 只负责检查认证状态并重定向，不管理任何状态
 */
export function ProtectedRoute({
    children,
    requireAuth = false,
    redirectTo = '/login',
}: ProtectedRouteProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { status, isAuthenticated } = useAuth();

    useEffect(() => {
        // 如果正在检查认证状态，等待完成
        if (status === 'checking') {
            return;
        }

        // 如果当前在登录页面，不执行重定向
        if (location.pathname === redirectTo) {
            return;
        }

        // 如果需要认证但未认证，重定向到登录页
        if (requireAuth && !isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [status, isAuthenticated, requireAuth, navigate, redirectTo, location.pathname]);

    // 如果正在检查认证状态，显示加载状态（避免闪烁）
    if (status === 'checking') {
        return null;
    }

    // 如果当前在登录页面，直接渲染子组件（登录页面自己处理逻辑）
    if (location.pathname === redirectTo) {
        return <>{children}</>;
    }

    // 如果需要认证但未认证，等待重定向完成
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    // 其他情况，直接渲染子组件
    return <>{children}</>;
}

