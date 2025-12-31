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

export interface ProjectChapterSummary {
    id: number;
    name: string;
    description?: string;
    order: number;
    enabled: boolean;
    requireAd: boolean;
    startInkId?: number;
    chapterBundleZipUrl?: string;
    chapterBundleVersion?: number;
    chapterBundleUrl?: string;
    resourceCount: number;
    inkFileCount: number;
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
    /**
     * 项目下的章节概览（仅在获取单个项目详情时返回）
     */
    chapters?: ProjectChapterSummary[];
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

/**
 * 项目策划 DTO
 */
export interface ProjectPlanningDto {
    id: number;
    projectId: number;
    theme?: string;
    concept?: string;
    type?: string;
    style?: string;
    targetAudience?: string;
    storyOutline?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建项目策划 DTO
 */
export interface CreateProjectPlanningDto {
    theme?: string;
    concept?: string;
    type?: string;
    style?: string;
    targetAudience?: string;
    storyOutline?: string;
}

/**
 * 更新项目策划 DTO
 */
export interface UpdateProjectPlanningDto {
    theme?: string;
    concept?: string;
    type?: string;
    style?: string;
    targetAudience?: string;
    storyOutline?: string;
}
