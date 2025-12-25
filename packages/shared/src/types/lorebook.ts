/**
 * LoreBook 相关类型定义
 */

// Context Config 接口
export interface ContextConfig {
  prefix: string;
  suffix: string;
  tokenBudget: number;
  reservedTokens: number;
  budgetPriority: number;
  trimDirection: 'trimBottom' | 'trimTop';
  insertionType: 'newline' | 'sentence' | 'token';
  maximumTrimType: 'sentence' | 'token' | 'word';
  insertionPosition: number;
}

// Lore Bias Group 接口
export interface LoreBiasGroup {
  phrases: string[];
  ensureSequenceFinish: boolean;
  generateOnce: boolean;
  bias: number;
  enabled: boolean;
  whenInactive: boolean;
}

// LoreBook Entry 完整结构
export interface LoreBookEntry {
  id: string;
  text: string;
  displayName: string;
  keys: string[];
  searchRange: number;
  enabled: boolean;
  forceActivation: boolean;
  keyRelative: boolean;
  nonStoryActivatable: boolean;
  hidden: boolean;
  category?: string; // categoryId
  contextConfig: ContextConfig;
  loreBiasGroups: LoreBiasGroup[];
  advancedConditions: any[]; // 根据实际需求定义
  lastUpdatedAt: number; // 时间戳
}

// LoreBook Category 完整结构
export interface LoreBookCategory {
  id: string;
  name: string;
  enabled: boolean;
  createSubcontext: boolean;
  useCategoryDefaults: boolean;
  open: boolean;
  subcontextSettings?: LoreBookEntry; // 完整的 entry 结构
  categoryDefaults?: LoreBookEntry; // 完整的 entry 结构
  categoryBiasGroups: LoreBiasGroup[];
  settings: Record<string, any>;
  order: string[]; // entry IDs 数组
}

// LoreBook Settings 结构
export interface LoreBookSettings {
  id: number;
  lorebookVersion: number;
  orderByKeyLocations: boolean;
  order: string[];
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 创建 Entry DTO
export interface CreateLoreBookEntryDto {
  text: string;
  displayName: string;
  keys?: string[];
  searchRange?: number;
  enabled?: boolean;
  forceActivation?: boolean;
  keyRelative?: boolean;
  nonStoryActivatable?: boolean;
  hidden?: boolean;
  categoryId?: string;
  contextConfig?: Partial<ContextConfig>;
  loreBiasGroups?: LoreBiasGroup[];
  advancedConditions?: any[];
  lastUpdatedAt?: number;
}

// 更新 Entry DTO
export interface UpdateLoreBookEntryDto {
  text?: string;
  displayName?: string;
  keys?: string[];
  searchRange?: number;
  enabled?: boolean;
  forceActivation?: boolean;
  keyRelative?: boolean;
  nonStoryActivatable?: boolean;
  hidden?: boolean;
  categoryId?: string | null;
  contextConfig?: Partial<ContextConfig>;
  loreBiasGroups?: LoreBiasGroup[];
  advancedConditions?: any[];
  lastUpdatedAt?: number;
}

// 创建 Category DTO
export interface CreateLoreBookCategoryDto {
  name: string;
  enabled?: boolean;
  createSubcontext?: boolean;
  useCategoryDefaults?: boolean;
  open?: boolean;
  subcontextSettings?: Partial<LoreBookEntry>;
  categoryDefaults?: Partial<LoreBookEntry>;
  categoryBiasGroups?: LoreBiasGroup[];
  settings?: Record<string, any>;
  order?: string[];
}

// 更新 Category DTO
export interface UpdateLoreBookCategoryDto {
  name?: string;
  enabled?: boolean;
  createSubcontext?: boolean;
  useCategoryDefaults?: boolean;
  open?: boolean;
  subcontextSettings?: Partial<LoreBookEntry> | null;
  categoryDefaults?: Partial<LoreBookEntry> | null;
  categoryBiasGroups?: LoreBiasGroup[];
  settings?: Record<string, any>;
  order?: string[];
}

// 更新 Settings DTO
export interface UpdateLoreBookSettingsDto {
  lorebookVersion?: number;
  orderByKeyLocations?: boolean;
  order?: string[];
  settings?: Record<string, any>;
}

// Response DTOs
export interface LoreBookEntryResponseDto {
  id: string;
  text: string;
  displayName: string;
  keys: string[];
  searchRange: number;
  enabled: boolean;
  forceActivation: boolean;
  keyRelative: boolean;
  nonStoryActivatable: boolean;
  hidden: boolean;
  categoryId?: string | null;
  contextConfig: ContextConfig;
  loreBiasGroups: LoreBiasGroup[];
  advancedConditions: any[];
  lastUpdatedAt: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoreBookCategoryResponseDto {
  id: string;
  name: string;
  enabled: boolean;
  createSubcontext: boolean;
  useCategoryDefaults: boolean;
  open: boolean;
  subcontextSettings?: LoreBookEntry | null;
  categoryDefaults?: LoreBookEntry | null;
  categoryBiasGroups: LoreBiasGroup[];
  settings: Record<string, any>;
  order: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoreBookSettingsResponseDto {
  id: number;
  lorebookVersion: number;
  orderByKeyLocations: boolean;
  order: string[];
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

