import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
}

export function AuthGuard({
    children,
    requireAuth = false,
    requireAdmin = false,
    redirectTo = '/admin/login',
}: AuthGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, checkAuth, user } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // 如果当前在登录页面，不执行重定向
        const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';
        if (isLoginPage) {
            return;
        }

        // 检查是否需要认证
        if (requireAuth && !isAuthenticated) {
            // 如果当前路径是 admin 相关路径，应该重定向到 admin/login
            const shouldRedirectToAdminLogin = location.pathname.startsWith('/admin');
            const finalRedirectTo = shouldRedirectToAdminLogin ? '/admin/login' : redirectTo;
            navigate(finalRedirectTo, { replace: true });
            return;
        }

        // 检查是否需要管理员权限
        if (requireAdmin) {
            const adminStatus = isAdmin();
            if (!isAuthenticated || !adminStatus) {
                navigate(redirectTo, { replace: true });
            return;
        }
        }
    }, [isAuthenticated, user, requireAuth, requireAdmin, navigate, redirectTo, location.pathname]);

    // 如果当前在登录页面，直接渲染子组件（让登录页面自己处理重定向）
    // 这个检查必须在所有其他检查之前，确保登录页面不会被拦截
    const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';
    if (isLoginPage) {
        return <>{children}</>;
    }

    // 检查是否需要认证
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    // 检查是否需要管理员权限
    if (requireAdmin) {
        const adminStatus = isAdmin();
        if (!isAuthenticated || !adminStatus) {
        return null;
        }
    }

    return <>{children}</>;
}
