import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect } from 'react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAuthenticated, isAdmin, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

