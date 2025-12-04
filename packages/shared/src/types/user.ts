/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * 用户实体类型
 */
export interface User {
  id: number;
  email?: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建用户 DTO
 */
export interface CreateUserDto {
  email?: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
  role?: UserRole;
}

/**
 * 更新用户 DTO
 */
export interface UpdateUserDto {
  email?: string;
  role?: UserRole;
}

/**
 * 用户响应 DTO（不包含敏感信息）
 */
export interface UserResponseDto {
  id: number;
  email?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户查询参数
 */
export interface UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

