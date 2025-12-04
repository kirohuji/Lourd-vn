import { UserRole } from './user';

/**
 * 微信登录请求 DTO
 */
export interface WechatLoginDto {
  code: string;
  type: 'web' | 'miniprogram';
}

/**
 * 邮箱登录请求 DTO
 */
export interface EmailLoginDto {
  email: string;
  password: string;
}

/**
 * 登录响应 DTO
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    email?: string;
    role: UserRole;
  };
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: number; // user id
  email?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * 刷新 Token 请求
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

