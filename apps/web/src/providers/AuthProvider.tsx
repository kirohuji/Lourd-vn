import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '../stores/auth-store';
import { useAuthStore } from '../stores/auth-store';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
    status: AuthStatus;
    isAuthenticated: boolean;
    user: User | null;
    checkAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { isAuthenticated, user, checkAuth } = useAuthStore();
    // 使用 ref 追踪是否已经初始化过状态
    const statusInitializedRef = useRef(false);

    // 初始化时立即确定状态（因为 zustand store 已经在创建时读取了 localStorage）
    const [status, setStatus] = useState<AuthStatus>(() => {
        // 由于 store 在创建时就初始化了，可以直接读取当前状态
        statusInitializedRef.current = true;
        return isAuthenticated ? 'authenticated' : 'unauthenticated';
    });

    // 根据认证状态更新 status（但只在状态已经初始化后更新，避免初始状态闪烁）
    useEffect(() => {
        if (!statusInitializedRef.current) {
            return;
        }

        if (isAuthenticated) {
            setStatus('authenticated');
        } else {
            setStatus('unauthenticated');
        }
    }, [isAuthenticated]);

    const value: AuthContextValue = {
        status,
        isAuthenticated,
        user,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
