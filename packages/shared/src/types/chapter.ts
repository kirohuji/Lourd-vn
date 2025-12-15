/**
 * 章节实体类型
 */
export interface Chapter {
    id: number;
    projectId: number;
    name: string;
    description?: string;
    order: number;
    enabled: boolean;
    requireAd: boolean;
    startInkId?: number;
    chapterBundleUrl?: string;
    bundleDirTree?: any;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建章节 DTO
 */
export interface CreateChapterDto {
    name: string;
    description?: string;
    order?: number;
    requireAd?: boolean;
    startInkId?: number;
    chapterBundleUrl?: string;
    bundleDirTree?: any;
}

/**
 * 更新章节 DTO
 */
export interface UpdateChapterDto {
    name?: string;
    description?: string;
    order?: number;
    requireAd?: boolean;
    enabled?: boolean;
    startInkId?: number;
    chapterBundleUrl?: string;
    bundleDirTree?: any;
}

/**
 * 章节响应 DTO
 */
export interface ChapterResponseDto {
    id: number;
    projectId: number;
    name: string;
    description?: string;
    order: number;
    enabled: boolean;
    requireAd: boolean;
    chapterBundleZipUrl?: string;
    chapterBundleVersion?: number;
    chapterBundleUrl?: string;
    bundleDirTree?: any;
    startInkId?: number;
    inkFiles?: InkFileSummary[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 章节查询参数
 */
export interface ChapterQueryDto {
    projectId?: number;
    enabled?: boolean;
}

export interface InkFileSummary {
    id: number;
    filename: string;
    displayName?: string;
    isStart?: boolean;
    compiledPath?: string;
}
