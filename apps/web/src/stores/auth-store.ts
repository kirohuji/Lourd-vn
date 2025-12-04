import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { UserRole, LoginResponseDto } from '@nqtr-game/shared';
import { apiClient } from '../utils/api-client';

interface AuthState {
  user: {
    id: number;
    email?: string;
    role: UserRole;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (code: string, type: 'web' | 'miniprogram') => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (code: string, type: 'web' | 'miniprogram') => {
    try {
      const response = await apiClient.wechatLogin({ code, type });
      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: () => {
    Taro.removeStorageSync('accessToken');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const token = Taro.getStorageSync('accessToken');
    if (token) {
      // TODO: 验证 token 有效性，获取用户信息
      set({
        token,
        isAuthenticated: true,
      });
    } else {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },
}));

