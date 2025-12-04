import { AssetsManifest } from '@drincs/pixi-vn';

/**
 * 资源实体类型
 */
export interface Resource {
    id: number;
    alias: string;
    src: string;
    bundle: string;
    hash: string;
    fileSize: number;
    fileType?: string;
    cosKey?: string;
    originalName?: string;
    uploaderId: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建资源 DTO
 */
export interface CreateResourceDto {
    alias: string;
    bundle: string;
    hash: string;
    fileSize: number;
    fileType?: string;
    cosKey?: string;
    originalName?: string;
}

/**
 * 更新资源 DTO（仅允许修改元数据，不修改文件本身）
 */
export interface UpdateResourceDto {
    alias?: string;
    bundle?: string;
    fileType?: string;
    originalName?: string;
}

/**
 * 资源响应 DTO
 */
export interface ResourceResponseDto {
    id: number;
    alias: string;
    src: string;
    bundle: string;
    hash: string;
    fileSize: number;
    fileType?: string;
    originalName?: string;
    uploaderId: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 资源查询参数
 */
export interface ResourceQueryDto {
    page?: number;
    limit?: number;
    bundle?: string;
    search?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Manifest Bundle 实体类型
 */
export interface ManifestBundle {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建 Bundle DTO
 */
export interface CreateBundleDto {
    name: string;
    description?: string;
}

/**
 * Manifest 生成响应
 */
export interface ManifestResponse {
    manifest: AssetsManifest;
}
