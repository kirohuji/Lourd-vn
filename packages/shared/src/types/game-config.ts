/**
 * 地图配置
 */
export interface MapConfig {
  id: string;
  name: string;
  bundle?: string | null;
  /**
   * 背景类型，目前支持：
   * - timeSlots: 早/中/晚/夜 多张图
   * - single: 单张图
   */
  backgroundType: 'timeSlots' | 'single' | string;
  /**
   * 背景数据，结构由前端解释：
   * - timeSlots: { morning: string; afternoon: string; evening: string; night: string }
   * - single: { src: string }
   */
  backgroundJson?: any;
}

export interface CreateMapDto {
  id: string;
  name: string;
  bundle?: string | null;
  backgroundType?: 'timeSlots' | 'single' | string;
  backgroundJson?: any;
}

export interface UpdateMapDto {
  name?: string;
  bundle?: string | null;
  backgroundType?: 'timeSlots' | 'single' | string;
  backgroundJson?: any;
}

/**
 * Sprite 配置
 */
export interface SpriteConfig {
  xAlign?: number;
  yAlign?: number;
  width?: number;
  height?: number;
}

/**
 * 地点配置
 */
export interface LocationConfig {
  id: string;
  mapId: string;
  name: string;
  iconAlias?: string | null;
  order: number;
  /**
   * Sprite 配置，包含位置和尺寸信息
   */
  spriteJson?: SpriteConfig | null;
}

export interface CreateLocationDto {
  id: string;
  mapId: string;
  name: string;
  iconAlias?: string | null;
  order?: number;
  spriteJson?: SpriteConfig | null;
}

export interface UpdateLocationDto {
  name?: string;
  iconAlias?: string | null;
  order?: number;
  spriteJson?: SpriteConfig | null;
}

/**
 * 房间热点配置
 * 直接复用前端已有结构，使用 any 以保持灵活性
 */
export interface RoomHotspotConfig {
  targetRoomId: string;
  iconType?: string;
  x: any;
  y: any;
  width: number;
  height: number;
}

/**
 * 房间配置
 */
export interface RoomConfig {
  id: string;
  mapId?: string | null;
  locationId: string;
  name: string;
  isEntrance: boolean;
  backgroundType: 'timeSlots' | 'single' | string;
  backgroundJson?: any;
  hotspotsJson?: RoomHotspotConfig[] | null;
}

export interface CreateRoomDto {
  id: string;
  mapId?: string | null;
  locationId: string;
  name: string;
  isEntrance?: boolean;
  backgroundType?: 'timeSlots' | 'single' | string;
  backgroundJson?: any;
  hotspotsJson?: RoomHotspotConfig[] | null;
}

export interface UpdateRoomDto {
  mapId?: string | null;
  locationId?: string;
  name?: string;
  isEntrance?: boolean;
  backgroundType?: 'timeSlots' | 'single' | string;
  backgroundJson?: any;
  hotspotsJson?: RoomHotspotConfig[] | null;
}

/**
 * 角色配置
 */
export interface CharacterConfig {
  id: string;
  name: string;
  age?: number | null;
  icon?: string | null;
  color?: string | null;
  enabled: boolean;
  order: number;
}

export interface CreateCharacterDto {
  id: string;
  name: string;
  age?: number | null;
  icon?: string | null;
  color?: string | null;
  enabled?: boolean;
  order?: number;
}

export interface UpdateCharacterDto {
  name?: string;
  age?: number | null;
  icon?: string | null;
  color?: string | null;
  enabled?: boolean;
  order?: number;
}


