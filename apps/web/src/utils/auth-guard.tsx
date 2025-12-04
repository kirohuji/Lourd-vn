import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { UserRole } from '@lourd-game/shared';

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
    const { isAuthenticated, isAdmin, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (requireAuth && !isAuthenticated) {
            navigate(redirectTo);
            return;
        }

        if (requireAdmin && (!isAuthenticated || !isAdmin())) {
            navigate(redirectTo);
            return;
        }
    }, [isAuthenticated, isAdmin, requireAuth, requireAdmin, navigate, redirectTo]);

    if (requireAuth && !isAuthenticated) {
        return null;
    }

    if (requireAdmin && (!isAuthenticated || !isAdmin())) {
        return null;
    }

    return <>{children}</>;
}

