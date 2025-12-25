/**
 * Prompt Tag（标签 Prompt）实体类型
 */
export interface PromptTag {
    id: number;
    name: string;
    tagType: 'action' | 'status' | 'style' | 'appearance' | 'personality';
    content: string;
    description?: string;
    order: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 变体标签项
 */
export interface VariantTagItem {
    tagId: number;
    order: number;
}

/**
 * Prompt Variant（变体）实体类型
 */
export interface PromptVariant {
    id: number;
    name: string;
    description?: string;
    isDefault: boolean;
    basePromptId?: number;
    characterPromptId?: number;
    parentVariantId?: number; // 基于其他变体
    tagIds: VariantTagItem[]; // JSON 解析后的数组
    mergedPrompt: string;
    mergeConfig?: {
        separator?: string;
        prefix?: string;
        suffix?: string;
    };
    order: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Base Prompt 实体类型
 */
export interface BasePrompt {
    id: number;
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Character Prompt 实体类型
 */
export interface CharacterPrompt {
    id: number;
    basePromptId: number;
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Prompt Image 实体类型
 */
export interface PromptImage {
    id: number;
    basePromptId?: number; // 可选：直接关联到 BasePrompt
    characterPromptId?: number; // 可选：关联到 CharacterPrompt
    imageUrl: string;
    generatedPrompt: string;
    status: 'uploaded' | 'generated';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建 Prompt Tag DTO
 */
export interface CreatePromptTagDto {
    name: string;
    tagType: string;
    content: string;
    description?: string;
    order?: number;
}

/**
 * 更新 Prompt Tag DTO
 */
export interface UpdatePromptTagDto {
    name?: string;
    tagType?: string;
    content?: string;
    description?: string;
    order?: number;
    enabled?: boolean;
}

/**
 * 创建 Prompt Variant DTO
 */
export interface CreatePromptVariantDto {
    name: string;
    description?: string;
    basePromptId?: number;
    characterPromptId?: number;
    parentVariantId?: number; // 基于其他变体
    tagIds: VariantTagItem[];
    mergeConfig?: {
        separator?: string;
        prefix?: string;
        suffix?: string;
    };
    order?: number;
}

/**
 * 更新 Prompt Variant DTO
 */
export interface UpdatePromptVariantDto {
    name?: string;
    description?: string;
    parentVariantId?: number; // 基于其他变体
    tagIds?: VariantTagItem[];
    mergeConfig?: {
        separator?: string;
        prefix?: string;
        suffix?: string;
    };
    order?: number;
    enabled?: boolean;
}

/**
 * Prompt Tag 响应 DTO
 */
export interface PromptTagResponseDto {
    id: number;
    name: string;
    tagType: string;
    content: string;
    description?: string;
    order: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Prompt Variant 响应 DTO
 */
export interface PromptVariantResponseDto {
    id: number;
    name: string;
    description?: string;
    isDefault: boolean;
    basePromptId?: number;
    characterPromptId?: number;
    parentVariantId?: number; // 基于其他变体
    tagIds: VariantTagItem[];
    mergedPrompt: string;
    mergeConfig?: {
        separator?: string;
        prefix?: string;
        suffix?: string;
    };
    order: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建 Base Prompt DTO
 */
export interface CreateBasePromptDto {
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
}

/**
 * 更新 Base Prompt DTO
 */
export interface UpdateBasePromptDto {
    name?: string;
    basicPrompt?: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string | null; // null 表示清空
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string | null; // 参考图 URL，null 表示删除
}

/**
 * 创建 Character Prompt DTO
 */
export interface CreateCharacterPromptDto {
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
}

/**
 * 更新 Character Prompt DTO
 */
export interface UpdateCharacterPromptDto {
    name?: string;
    basicPrompt?: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string | null; // null 表示清空
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string | null; // 参考图 URL，null 表示删除
}

/**
 * Base Prompt 响应 DTO（包含关联的 Character Prompts）
 */
export interface BasePromptResponseDto {
    id: number;
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
    createdAt: Date;
    updatedAt: Date;
    characterPrompts?: CharacterPromptResponseDto[];
    imageCount?: number; // Base Prompt 直接关联的图片数量
}

/**
 * Character Prompt 响应 DTO（包含关联的图片数量）
 */
export interface CharacterPromptResponseDto {
    id: number;
    basePromptId: number;
    name: string;
    basicPrompt: string; // 原 prompt 字段，重命名为 basicPrompt
    undesiredContent?: string;
    // Vibe Transfer 参数
    normalizeReferenceStrength?: boolean;
    referenceStrength?: number; // 0-1
    informationExtracted?: number; // 0-1
    referenceImageUrl?: string; // 参考图 URL
    createdAt: Date;
    updatedAt: Date;
    imageCount?: number;
}

/**
 * Prompt Image 响应 DTO
 */
export interface PromptImageResponseDto {
    id: number;
    basePromptId?: number; // 可选：直接关联到 BasePrompt（保留用于兼容）
    characterPromptId?: number; // 可选：关联到 CharacterPrompt（保留用于兼容）
    variantId?: number; // 新增：关联到变体
    imageUrl: string;
    generatedPrompt: string;
    status: 'uploaded' | 'generated';
    createdAt: Date;
    updatedAt: Date;
    // 新增：关联的 Prompt 详细信息
    basePrompt?: {
        basicPrompt: string;
        undesiredContent?: string;
    };
    characterPrompt?: {
        basicPrompt: string;
        undesiredContent?: string;
    };
    // 新增：关联的变体信息（如果图片属于某个变体）
    variant?: {
        id: number;
        name: string;
        mergedPrompt: string; // 合并后的最终 Prompt
    };
}

/**
 * 图片按变体分组响应 DTO
 */
export interface PromptImagesGroupedResponseDto {
    variants: Array<{
        id: number;
        name: string;
        isDefault: boolean;
        imageCount: number;
        images: PromptImageResponseDto[];
    }>;
    uncategorized: {
        imageCount: number;
        images: PromptImageResponseDto[];
    };
}
