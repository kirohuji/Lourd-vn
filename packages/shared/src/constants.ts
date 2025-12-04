/**
 * 支持的 Bundle 列表
 */
export const SUPPORTED_BUNDLES = [
  'main_menu',
  'map',
  'map-nightcity',
  'mc_room',
  'alice_room',
  'ann_room',
  'bathroom',
  'lounge',
  'terrace',
  'gym_room',
  'alice',
  'navigation_icons',
  'custom',
] as const;

/**
 * 默认分页大小
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * 最大文件大小（100MB）
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.mp3',
  '.wav',
  '.ogg',
  '.mp4',
  '.webm',
] as const;

