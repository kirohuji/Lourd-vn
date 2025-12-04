import { create } from 'zustand';
import { UserRole, LoginResponseDto, WechatLoginDto } from '@lourd-game/shared';
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
    login: (dto: WechatLoginDto) => Promise<LoginResponseDto>;
    logout: () => void;
    checkAuth: () => void;
    isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    login: async (dto: WechatLoginDto) => {
        try {
            const response = await apiClient.wechatLogin(dto);
            set({
                user: response.user,
                accessToken: response.accessToken,
                isAuthenticated: true,
            });
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    logout: () => {
        apiClient.logout();
        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
        });
    },

    checkAuth: () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // 这里可以添加 token 验证逻辑
            // 暂时只检查 token 是否存在
            set({
                accessToken: token,
                isAuthenticated: true,
            });
        } else {
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
