/**
 * Base Prompt 实体类型
 */
export interface BasePrompt {
    id: number;
    name: string;
    prompt: string;
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
    prompt: string;
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
 * 创建 Base Prompt DTO
 */
export interface CreateBasePromptDto {
    name: string;
    prompt: string;
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
    prompt?: string;
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
    prompt: string;
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
    prompt?: string;
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
    prompt: string;
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
    prompt: string;
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
    basePromptId?: number; // 可选：直接关联到 BasePrompt
    characterPromptId?: number; // 可选：关联到 CharacterPrompt
    imageUrl: string;
    generatedPrompt: string;
    status: 'uploaded' | 'generated';
    createdAt: Date;
    updatedAt: Date;
}

