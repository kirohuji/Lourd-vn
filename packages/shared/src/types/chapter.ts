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

