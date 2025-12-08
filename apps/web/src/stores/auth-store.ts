import { create } from 'zustand';
import { UserRole, LoginResponseDto, EmailLoginDto } from '@lourd-game/shared';
import { apiClient } from '../utils/api-client';

interface User {
    id: number;
    email?: string;
    role: UserRole;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    emailLogin: (dto: EmailLoginDto) => Promise<LoginResponseDto>;
    logout: () => void;
    checkAuth: () => void;
    isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    emailLogin: async (dto: EmailLoginDto) => {
        try {
            const response = await apiClient.emailLogin(dto);
            // 保存用户信息到 localStorage
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            set({
                user: response.user,
                accessToken: response.accessToken,
                isAuthenticated: true,
            });
            return response;
        } catch (error) {
            console.error('Email login failed:', error);
            throw error;
        }
    },

    logout: () => {
        apiClient.logout();
        localStorage.removeItem('user');
        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
        });
    },

    checkAuth: () => {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as User;
                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                });
            } catch (error) {
                console.error('Failed to parse user from localStorage:', error);
                // 如果解析失败，清除无效数据
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                });
            }
        } else {
            // 如果 token 或 user 不存在，清除所有认证信息
            if (!token) {
                localStorage.removeItem('user');
            }
            if (!userStr) {
                localStorage.removeItem('accessToken');
            }
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });
        }
    },

    isAdmin: () => {
        const { user } = get();
        return user?.role === UserRole.ADMIN;
    },
}));

