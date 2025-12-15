// 导出所有类型
export * from './types/auth.js';
export * from './types/chapter.js';
export * from './types/game-config.js';
export * from './types/ink.js';
export * from './types/project.js';
export * from './types/resource.js';
export * from './types/user.js';

// 导出常量
export * from './constants.js';

// Explicit re-exports for better TypeScript resolution with nodenext
export type { EmailLoginDto, JwtPayload, LoginResponseDto, RefreshTokenDto, WechatLoginDto } from './types/auth.js';

// UserRole is an enum, so it needs to be exported as a value, not just a type
export { UserRole } from './types/user.js';
export type { CreateUserDto, UpdateUserDto, User, UserQueryDto, UserResponseDto } from './types/user.js';

export type {
    CharacterConfig,
    CreateCharacterDto,
    CreateLocationDto,
    CreateMapDto,
    CreateRoomDto,
    LocationConfig,
    MapConfig,
    RoomConfig,
    UpdateCharacterDto,
    UpdateLocationDto,
    UpdateMapDto,
    UpdateRoomDto,
} from './types/game-config.js';

export type {
    BundleInfo,
    BundleListResponse,
    BundleZipInfo,
    CreateResourceDto,
    ManifestResponse,
    PaginatedResponse,
    Resource,
    ResourceQueryDto,
    ResourceResponseDto,
    UpdateResourceDto,
} from './types/resource.js';

export type {
    Chapter,
    ChapterQueryDto,
    ChapterResponseDto,
    CreateChapterDto,
    InkFileSummary,
    UpdateChapterDto,
} from './types/chapter.js';

export type { CompileInkResponse, CreateInkFileDto, InkFile, UpdateInkFileDto } from './types/ink.js';

export type {
    CreateProjectDto,
    Project,
    ProjectQueryDto,
    ProjectResponseDto,
    UpdateProjectDto,
} from './types/project.js';
