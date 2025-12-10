import { EmailLoginDto, LoginResponseDto, UserRole } from '@lourd-game/shared';
import { create } from 'zustand';
import { apiClient } from '../utils/api-client';

export interface User {
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

// 初始化函数，从 localStorage 读取认证信息
function getInitialAuthState() {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr) as User;
            return {
                user,
                accessToken: token,
                isAuthenticated: true,
            };
        } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
            // 如果解析失败，清除无效数据
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
        }
    } else {
        // 如果 token 或 user 不存在，清除所有认证信息
        if (!token) {
            localStorage.removeItem('user');
        }
        if (!userStr) {
            localStorage.removeItem('accessToken');
        }
    }

    return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
    };
}

export const useAuthStore = create<AuthState>((set, get) => {
    // 在创建 store 时立即初始化认证状态
    const initialState = getInitialAuthState();

    return {
        ...initialState,

        emailLogin: async (dto: EmailLoginDto) => {
            try {
                const response = await apiClient.emailLogin(dto);
                // 保存用户信息和 token 到 localStorage
                if (response.user) {
                    localStorage.setItem('user', JSON.stringify(response.user));
                }
                if (response.accessToken) {
                    localStorage.setItem('accessToken', response.accessToken);
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
            localStorage.removeItem('accessToken');
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
    };
});
