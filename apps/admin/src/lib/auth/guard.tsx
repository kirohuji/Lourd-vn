import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect, useState } from 'react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, isAdmin, checkAuth } = useAuthStore();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 立即检查认证状态
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  // 如果当前在登录页面，直接渲染子组件（让登录页面自己处理重定向）
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  // 等待认证检查完成
  if (!authChecked) {
    return null;
  }

  // 如果未认证或不是管理员，重定向到登录页
  if (!isAuthenticated || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

