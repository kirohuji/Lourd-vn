import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export function AuthGuard({
    children,
    requireAuth = false,
    redirectTo = '/login',
}: AuthGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // 如果当前在登录页面，不执行重定向
        const isLoginPage = location.pathname === '/login';
        if (isLoginPage) {
            return;
        }

        // 检查是否需要认证
        if (requireAuth && !isAuthenticated) {
            navigate(redirectTo, { replace: true });
            return;
        }
    }, [isAuthenticated, requireAuth, navigate, redirectTo, location.pathname]);

    // 如果当前在登录页面，直接渲染子组件（让登录页面自己处理重定向）
    const isLoginPage = location.pathname === '/login';
    if (isLoginPage) {
        return <>{children}</>;
    }

    // 检查是否需要认证
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

