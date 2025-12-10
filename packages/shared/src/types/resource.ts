import { AssetsManifest } from '@drincs/pixi-vn';

/**
 * 资源实体类型
 */
export interface Resource {
    id: number;
    alias: string;
    src: string;
    bundle: string;
    bundleType?: string; // "common" | "chapter"
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
    bundleType?: string; // "common" | "chapter"
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
    bundleType?: string; // "common" | "chapter"
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
    bundleType?: string; // "common" | "chapter"
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
    bundleType?: string; // "common" | "chapter"
    search?: string;
    usedByProjectId?: number; // 查询指定项目使用的资源
    usedByChapterId?: number; // 查询指定章节使用的资源
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
 * Manifest 生成响应
 */
export interface ManifestResponse {
    manifest: AssetsManifest;
}
