import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = false, redirectTo = '/login' }: AuthGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [authChecked, setAuthChecked] = useState(false);
    const [hasRedirected, setHasRedirected] = useState(false);

    // 立即检查认证状态
    useEffect(() => {
        checkAuth();
        setAuthChecked(true);
    }, [checkAuth]);

    // 执行重定向逻辑
    useEffect(() => {
        if (!authChecked) {
            return; // 等待认证检查完成
        }

        const isLoginPage = location.pathname === redirectTo;

        // 如果当前在登录页面，不执行重定向
        if (isLoginPage) {
            setHasRedirected(false);
            return;
        }

        // 检查是否需要认证
        if (requireAuth && !isAuthenticated && !hasRedirected) {
            setHasRedirected(true);
            navigate(redirectTo, { replace: true });
            return;
        }

        // 如果已认证，重置重定向标志
        if (isAuthenticated) {
            setHasRedirected(false);
        }
    }, [isAuthenticated, requireAuth, navigate, redirectTo, location.pathname, authChecked, hasRedirected]);

    // 如果认证检查未完成，显示加载状态（避免闪烁）
    if (!authChecked) {
        return null;
    }

    // 如果当前在登录页面，直接渲染子组件
    const isLoginPage = location.pathname === redirectTo;
    if (isLoginPage) {
        return <>{children}</>;
    }

    // 如果已重定向，等待导航完成
    if (hasRedirected) {
        return null;
    }

    // 检查是否需要认证
    if (requireAuth && !isAuthenticated) {
        return null; // 等待重定向
    }

    return <>{children}</>;
}
