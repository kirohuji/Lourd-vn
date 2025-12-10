/**
 * 项目实体类型
 */
export interface Project {
    id: number;
    name: string;
    description?: string;
    enabled: boolean;
    commonBundle?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建项目 DTO
 */
export interface CreateProjectDto {
    name: string;
    description?: string;
    enabled?: boolean;
    commonBundle: string;
}

/**
 * 更新项目 DTO
 */
export interface UpdateProjectDto {
    name?: string;
    description?: string;
    enabled?: boolean;
    commonBundle?: string;
}

/**
 * 项目响应 DTO
 */
export interface ProjectResponseDto {
    id: number;
    name: string;
    description?: string;
    enabled: boolean;
    commonBundle?: string;
    commonBundleZipUrl?: string;
    commonBundleVersion?: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 项目查询参数
 */
export interface ProjectQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    enabled?: boolean;
}
