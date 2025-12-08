import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

/**
 * 管理员路由守卫
 * 只用于管理员路由，未登录或非管理员重定向到 /admin/login
 * 不依赖任何游戏相关的代码
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, checkAuth, user } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // 如果当前在管理员登录页面，不执行重定向
        if (location.pathname === '/admin/login') {
            return;
        }

        // 检查是否已登录且是管理员
        const adminStatus = isAdmin();
        if (!isAuthenticated || !adminStatus) {
            // 只重定向到管理员登录页面
            navigate('/admin/login', { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.pathname]);

    // 如果当前在管理员登录页面，直接渲染子组件
    if (location.pathname === '/admin/login') {
        return <>{children}</>;
    }

    // 检查是否已登录且是管理员
    const adminStatus = isAdmin();
    if (!isAuthenticated || !adminStatus) {
        return null;
    }

    return <>{children}</>;
}

