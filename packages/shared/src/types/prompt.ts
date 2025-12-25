/**
 * Base Prompt 实体类型
 */
export interface BasePrompt {
    id: number;
    name: string;
    prompt: string;
    undesiredContent?: string;
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
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Prompt Image 实体类型
 */
export interface PromptImage {
    id: number;
    characterPromptId: number;
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
}

/**
 * 更新 Base Prompt DTO
 */
export interface UpdateBasePromptDto {
    name?: string;
    prompt?: string;
    undesiredContent?: string;
}

/**
 * 创建 Character Prompt DTO
 */
export interface CreateCharacterPromptDto {
    name: string;
    prompt: string;
    undesiredContent?: string;
}

/**
 * 更新 Character Prompt DTO
 */
export interface UpdateCharacterPromptDto {
    name?: string;
    prompt?: string;
    undesiredContent?: string;
}

/**
 * Base Prompt 响应 DTO（包含关联的 Character Prompts）
 */
export interface BasePromptResponseDto {
    id: number;
    name: string;
    prompt: string;
    undesiredContent?: string;
    createdAt: Date;
    updatedAt: Date;
    characterPrompts?: CharacterPromptResponseDto[];
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
    createdAt: Date;
    updatedAt: Date;
    imageCount?: number;
}

/**
 * Prompt Image 响应 DTO
 */
export interface PromptImageResponseDto {
    id: number;
    characterPromptId: number;
    imageUrl: string;
    generatedPrompt: string;
    status: 'uploaded' | 'generated';
    createdAt: Date;
    updatedAt: Date;
}

