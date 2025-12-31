import {
    BasePromptResponseDto,
    BundleZipInfo,
    ChapterQueryDto,
    ChapterResponseDto,
    CharacterConfig,
    CharacterPromptResponseDto,
    CompileInkResponse,
    CreateBasePromptDto,
    CreateChapterDto,
    CreateCharacterDto,
    CreateCharacterPromptDto,
    CreateInkFileDto,
    CreateLocationDto,
    CreateLoreBookCategoryDto,
    CreateLoreBookEntryDto,
    CreateMapDto,
    CreateProjectDto,
    CreatePromptTagDto,
    CreatePromptVariantDto,
    CreateRoomDto,
    EmailLoginDto,
    InkFile,
    LocationConfig,
    LoginResponseDto,
    LoreBookCategoryResponseDto,
    LoreBookEntryResponseDto,
    LoreBookSettingsResponseDto,
    ManifestResponse,
    MapConfig,
    PaginatedResponse,
    ProjectPlanningDto,
    ProjectQueryDto,
    ProjectResponseDto,
    PromptImageResponseDto,
    PromptImagesGroupedResponseDto,
    PromptTagResponseDto,
    PromptVariantResponseDto,
    ResourceQueryDto,
    ResourceResponseDto,
    RoomConfig,
    UpdateBasePromptDto,
    UpdateChapterDto,
    UpdateCharacterDto,
    UpdateCharacterPromptDto,
    UpdateInkFileDto,
    UpdateLocationDto,
    UpdateLoreBookCategoryDto,
    UpdateLoreBookEntryDto,
    UpdateLoreBookSettingsDto,
    UpdateMapDto,
    UpdateProjectDto,
    UpdateProjectPlanningDto,
    UpdatePromptTagDto,
    UpdatePromptVariantDto,
    UpdateResourceDto,
    UpdateRoomDto,
    UpdateUserDto,
    UserQueryDto,
    UserResponseDto,
    WechatLoginDto,
} from '@lourd-game/shared';

import { API_BASE_URL, endpoints } from './endpoints';

class ApiClient {
    private getToken(): string | null {
        return localStorage.getItem('accessToken') || null;
    }

    private setToken(token: string): void {
        localStorage.setItem('accessToken', token);
    }

    private removeToken(): void {
        localStorage.removeItem('accessToken');
    }

    private async request<T>(
        url: string,
        options: {
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
            body?: any;
            headers?: Record<string, string>;
            needAuth?: boolean;
        } = {},
    ): Promise<T> {
        const { method = 'GET', body, headers = {}, needAuth = true } = options;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (needAuth) {
            const token = this.getToken();
            if (token) {
                requestHeaders['Authorization'] = `Bearer ${token}`;
            }
        }

        const config: RequestInit = {
            method,
            headers: requestHeaders,
        };

        if (body && method !== 'GET') {
            if (body instanceof FormData) {
                delete requestHeaders['Content-Type']; // Let browser set it for FormData
                config.body = body;
            } else {
                config.body = JSON.stringify(body);
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);

            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                this.removeToken();
                // 只在非登录页面时跳转，避免循环跳转
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const isLoginPage = currentPath === '/login' || currentPath === '/admin/login';
                    if (!isLoginPage) {
                        // 根据当前路径判断跳转到哪个登录页面
                        // 如果是管理后台相关路径，跳转到管理员登录
                        if (currentPath.startsWith('/admin')) {
                            window.location.href = '/admin/login';
                        } else {
                            // 否则跳转到普通用户登录
                            window.location.href = '/login';
                        }
                    }
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = response.statusText || 'Unknown error';
                }
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            // 处理空响应（204 No Content 或 void 返回）
            if (response.status === 204) {
                return undefined as T;
            }

            // 检查响应是否有内容
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            // 先读取响应文本，避免多次调用 response.text() 或 response.json()
            // 注意：response.text() 只能调用一次，之后响应体就被消费了
            const text = await response.text();

            // 如果响应为空，返回 undefined（对于 void 类型）
            // NestJS 返回 void 时，可能是 200 状态码但响应体为空
            if (!text || text.trim() === '' || contentLength === '0') {
                return undefined as T;
            }

            // 尝试解析 JSON
            try {
                const data = JSON.parse(text);
                return data as T;
            } catch (e) {
                // 如果解析失败，检查是否是预期的空响应
                if (contentType && contentType.includes('application/json')) {
                    // 如果声明是 JSON 但解析失败，可能是格式错误
                    console.warn('Failed to parse JSON response:', text);
                    throw new Error('Invalid JSON response from server');
                }
                // 如果不是 JSON 类型，返回 undefined（可能是 void 返回）
                return undefined as T;
            }
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Auth APIs
    async wechatLogin(dto: WechatLoginDto): Promise<LoginResponseDto> {
        const response = await this.request<LoginResponseDto>('/auth/wechat/login', {
            method: 'POST',
            body: dto,
            needAuth: false,
        });

        // 保存 token
        if (response.accessToken) {
            this.setToken(response.accessToken);
        }

        return response;
    }

    async emailLogin(dto: EmailLoginDto): Promise<LoginResponseDto> {
        const response = await this.request<LoginResponseDto>('/auth/email/login', {
            method: 'POST',
            body: dto,
            needAuth: false,
        });

        // 保存 token
        if (response.accessToken) {
            this.setToken(response.accessToken);
        }

        return response;
    }

    logout(): void {
        this.removeToken();
    }

    // Resource APIs (后台资源管理，对应后端 ManifestController，基础路径为 /manifest)
    async getResources(query?: ResourceQueryDto): Promise<PaginatedResponse<ResourceResponseDto>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        // 后端路由为 GET /manifest
        return this.request<PaginatedResponse<ResourceResponseDto>>(`/manifest${queryString}`, {
            method: 'GET',
        });
    }

    async getResource(id: number): Promise<ResourceResponseDto> {
        // 后端路由为 GET /manifest/:id
        return this.request<ResourceResponseDto>(`/manifest/${id}`, {
            method: 'GET',
        });
    }

    async uploadResource(file: File, alias: string, bundle: string, bundleType?: string): Promise<ResourceResponseDto> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alias', alias);
        formData.append('bundle', bundle);
        if (bundleType) {
            formData.append('bundleType', bundleType);
        }

        // 后端路由为 POST /manifest
        return this.request<ResourceResponseDto>('/manifest', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async deleteResource(id: number): Promise<void> {
        // 后端路由为 DELETE /manifest/:id
        return this.request<void>(`/manifest/${id}`, {
            method: 'DELETE',
        });
    }

    async updateResource(id: number, dto: UpdateResourceDto): Promise<ResourceResponseDto> {
        return this.request<ResourceResponseDto>(`/manifest/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async replaceResourceFile(id: number, file: File, dto: UpdateResourceDto): Promise<ResourceResponseDto> {
        const formData = new FormData();
        formData.append('file', file);
        if (dto.alias !== undefined) {
            formData.append('alias', dto.alias);
        }
        if (dto.bundle !== undefined) {
            formData.append('bundle', dto.bundle);
        }
        if (dto.bundleType !== undefined) {
            formData.append('bundleType', dto.bundleType);
        }

        return this.request<ResourceResponseDto>(`/manifest/${id}/file`, {
            method: 'PUT',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async migrateResourceToCos(id: number): Promise<ResourceResponseDto> {
        return this.request<ResourceResponseDto>(`/manifest/${id}/migrate-to-cos`, {
            method: 'POST',
        });
    }

    async updateBundle(
        bundleName: string,
        newBundleName?: string,
        newBundleType?: 'common' | 'chapter',
    ): Promise<{ updatedCount: number }> {
        return this.request<{ updatedCount: number }>(`/manifest/bundles/${encodeURIComponent(bundleName)}`, {
            method: 'PUT',
            body: {
                newBundleName,
                newBundleType,
            },
        });
    }

    async getBundleList(query?: {
        bundleType?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<any>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<PaginatedResponse<any>>(`/manifest/bundles${queryString}`, {
            method: 'GET',
        });
    }

    // 游戏配置：地图 / 地点 / 房间 / 角色
    async getMaps(): Promise<MapConfig[]> {
        return this.request<MapConfig[]>('/game-config/maps', {
            method: 'GET',
        });
    }

    async upsertMap(id: string, dto: CreateMapDto | UpdateMapDto): Promise<MapConfig> {
        return this.request<MapConfig>(`/game-config/maps/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteMap(id: string): Promise<void> {
        return this.request<void>(`/game-config/maps/${id}`, {
            method: 'DELETE',
        });
    }

    async getLocations(): Promise<LocationConfig[]> {
        return this.request<LocationConfig[]>('/game-config/locations', {
            method: 'GET',
        });
    }

    async upsertLocation(id: string, dto: CreateLocationDto | UpdateLocationDto): Promise<LocationConfig> {
        return this.request<LocationConfig>(`/game-config/locations/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteLocation(id: string): Promise<void> {
        return this.request<void>(`/game-config/locations/${id}`, {
            method: 'DELETE',
        });
    }

    async getRooms(): Promise<RoomConfig[]> {
        return this.request<RoomConfig[]>('/game-config/rooms', {
            method: 'GET',
        });
    }

    async upsertRoom(id: string, dto: CreateRoomDto | UpdateRoomDto): Promise<RoomConfig> {
        return this.request<RoomConfig>(`/game-config/rooms/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteRoom(id: string): Promise<void> {
        return this.request<void>(`/game-config/rooms/${id}`, {
            method: 'DELETE',
        });
    }

    async getCharacters(): Promise<PaginatedResponse<CharacterConfig>> {
        return this.request<PaginatedResponse<CharacterConfig>>('/game-config/characters', {
            method: 'GET',
        });
    }

    async upsertCharacter(id: string, dto: CreateCharacterDto | UpdateCharacterDto): Promise<CharacterConfig> {
        return this.request<CharacterConfig>(`/game-config/characters/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteCharacter(id: string): Promise<void> {
        return this.request<void>(`/game-config/characters/${id}`, {
            method: 'DELETE',
        });
    }

    async getManifest(): Promise<ManifestResponse> {
        return this.request<ManifestResponse>('/manifest/generate', {
            method: 'GET',
            needAuth: false,
        });
    }

    // User APIs
    async getUsers(query?: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<PaginatedResponse<UserResponseDto>>(`/users${queryString}`, {
            method: 'GET',
        });
    }

    async getUser(id: number): Promise<UserResponseDto> {
        return this.request<UserResponseDto>(`/users/${id}`, {
            method: 'GET',
        });
    }

    async updateUser(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
        return this.request<UserResponseDto>(`/users/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteUser(id: number): Promise<void> {
        return this.request<void>(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    // Project APIs
    async getProjects(query?: ProjectQueryDto): Promise<PaginatedResponse<ProjectResponseDto>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<PaginatedResponse<ProjectResponseDto>>(`/projects${queryString}`, {
            method: 'GET',
        });
    }

    async getProject(id: number): Promise<ProjectResponseDto> {
        return this.request<ProjectResponseDto>(`/projects/${id}`, {
            method: 'GET',
        });
    }

    async createProject(dto: CreateProjectDto): Promise<ProjectResponseDto> {
        return this.request<ProjectResponseDto>('/projects', {
            method: 'POST',
            body: dto,
        });
    }

    async updateProject(id: number, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
        return this.request<ProjectResponseDto>(`/projects/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteProject(id: number): Promise<void> {
        return this.request<void>(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    async generateProjectBundle(id: number): Promise<BundleZipInfo> {
        return this.request<BundleZipInfo>(`/projects/${id}/generate-bundle`, {
            method: 'POST',
        });
    }

    // Project Planning Management
    async getProjectPlanning(projectId: number): Promise<ProjectPlanningDto | null> {
        return this.request<ProjectPlanningDto | null>(endpoints.projects.planning.get(projectId), {
            method: 'GET',
        });
    }

    async updateProjectPlanning(
        projectId: number,
        dto: UpdateProjectPlanningDto,
    ): Promise<ProjectPlanningDto> {
        return this.request<ProjectPlanningDto>(endpoints.projects.planning.update(projectId), {
            method: 'PUT',
            body: dto,
        });
    }

    // Project Resource Management
    async getProjectResources(
        projectId: number,
        query?: ResourceQueryDto,
    ): Promise<PaginatedResponse<ResourceResponseDto>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<PaginatedResponse<ResourceResponseDto>>(`/projects/${projectId}/resources${queryString}`, {
            method: 'GET',
        });
    }

    async addResourceToProject(projectId: number, resourceId: number): Promise<void> {
        return this.request<void>(`/projects/${projectId}/resources/${resourceId}`, {
            method: 'POST',
        });
    }

    async removeResourceFromProject(projectId: number, resourceId: number): Promise<void> {
        return this.request<void>(`/projects/${projectId}/resources/${resourceId}`, {
            method: 'DELETE',
        });
    }

    // Project Map Management
    async getProjectMaps(projectId: number): Promise<MapConfig[]> {
        return this.request<MapConfig[]>(`/projects/${projectId}/maps`, {
            method: 'GET',
        });
    }

    async addMapToProject(projectId: number, mapId: string): Promise<void> {
        return this.request<void>(`/projects/${projectId}/maps/${mapId}`, {
            method: 'POST',
        });
    }

    async removeMapFromProject(projectId: number, mapId: string): Promise<void> {
        return this.request<void>(`/projects/${projectId}/maps/${mapId}`, {
            method: 'DELETE',
        });
    }

    // Project Character Management
    async getProjectCharacters(projectId: number): Promise<PaginatedResponse<CharacterConfig>> {
        return this.request<PaginatedResponse<CharacterConfig>>(`/projects/${projectId}/characters`, {
            method: 'GET',
        });
    }

    async addCharacterToProject(projectId: number, characterId: string): Promise<void> {
        return this.request<void>(`/projects/${projectId}/characters/${characterId}`, {
            method: 'POST',
        });
    }

    async removeCharacterFromProject(projectId: number, characterId: string): Promise<void> {
        return this.request<void>(`/projects/${projectId}/characters/${characterId}`, {
            method: 'DELETE',
        });
    }

    // Project Manifest
    async getCommonManifest(projectId: number): Promise<ManifestResponse> {
        return this.request<ManifestResponse>(endpoints.projects.manifest.common(projectId), {
            method: 'GET',
        });
    }

    async getFullManifest(projectId: number): Promise<ManifestResponse> {
        return this.request<ManifestResponse>(endpoints.projects.manifest.full(projectId), {
            method: 'GET',
        });
    }

    // Chapters
    async getChapters(projectId: number, query?: ChapterQueryDto): Promise<ChapterResponseDto[]> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<ChapterResponseDto[]>(`${endpoints.chapters.list(projectId)}${queryString}`, {
            method: 'GET',
        });
    }

    async getChapter(id: number): Promise<ChapterResponseDto> {
        return this.request<ChapterResponseDto>(endpoints.chapters.detail(id), {
            method: 'GET',
        });
    }

    async createChapter(projectId: number, dto: CreateChapterDto): Promise<ChapterResponseDto> {
        return this.request<ChapterResponseDto>(endpoints.chapters.create(projectId), {
            method: 'POST',
            body: dto,
        });
    }

    async updateChapter(id: number, dto: UpdateChapterDto): Promise<ChapterResponseDto> {
        return this.request<ChapterResponseDto>(endpoints.chapters.update(id), {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteChapter(id: number): Promise<void> {
        return this.request<void>(endpoints.chapters.delete(id), {
            method: 'DELETE',
        });
    }

    // Chapter Resources
    async getChapterResources(
        chapterId: number,
        query?: ResourceQueryDto,
    ): Promise<PaginatedResponse<ResourceResponseDto>> {
        const queryString = query
            ? '?' +
              new URLSearchParams(
                  Object.entries(query).reduce((acc, [key, value]) => {
                      if (value !== undefined && value !== null) {
                          acc[key] = String(value);
                      }
                      return acc;
                  }, {} as Record<string, string>),
              ).toString()
            : '';
        return this.request<PaginatedResponse<ResourceResponseDto>>(
            `${endpoints.chapters.resources.list(chapterId)}${queryString}`,
            {
                method: 'GET',
            },
        );
    }

    async addResourceToChapter(chapterId: number, resourceId: number): Promise<void> {
        return this.request<void>(endpoints.chapters.resources.add(chapterId, resourceId), {
            method: 'POST',
        });
    }

    async removeResourceFromChapter(chapterId: number, resourceId: number): Promise<void> {
        return this.request<void>(endpoints.chapters.resources.remove(chapterId, resourceId), {
            method: 'DELETE',
        });
    }

    // Chapter Manifest
    async getChapterManifest(chapterId: number): Promise<ManifestResponse> {
        return this.request<ManifestResponse>(endpoints.chapters.manifest(chapterId), {
            method: 'GET',
        });
    }

    async generateChapterBundle(chapterId: number): Promise<BundleZipInfo> {
        return this.request<BundleZipInfo>(`/chapters/${chapterId}/generate-bundle`, {
            method: 'POST',
        });
    }

    // Chapter Ink Files
    async getInkFiles(chapterId: number): Promise<InkFile[]> {
        return this.request<InkFile[]>(endpoints.chapters.inkFiles.list(chapterId), {
            method: 'GET',
        });
    }

    async getInkFile(chapterId: number, inkId: number): Promise<InkFile> {
        return this.request<InkFile>(endpoints.chapters.inkFiles.detail(chapterId, inkId), {
            method: 'GET',
        });
    }

    async createInkFile(chapterId: number, dto: CreateInkFileDto): Promise<InkFile> {
        return this.request<InkFile>(endpoints.chapters.inkFiles.create(chapterId), {
            method: 'POST',
            body: dto,
        });
    }

    async updateInkFile(chapterId: number, inkId: number, dto: UpdateInkFileDto): Promise<InkFile> {
        return this.request<InkFile>(endpoints.chapters.inkFiles.update(chapterId, inkId), {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteInkFile(chapterId: number, inkId: number): Promise<void> {
        return this.request<void>(endpoints.chapters.inkFiles.delete(chapterId, inkId), {
            method: 'DELETE',
        });
    }

    async compileInkFile(chapterId: number, inkId: number): Promise<CompileInkResponse> {
        return this.request<CompileInkResponse>(endpoints.chapters.inkFiles.compile(chapterId, inkId), {
            method: 'POST',
        });
    }

    // Prompt APIs
    async getBasePrompts(): Promise<BasePromptResponseDto[]> {
        return this.request<BasePromptResponseDto[]>('/prompts/base', {
            method: 'GET',
        });
    }

    async getBasePrompt(id: number): Promise<BasePromptResponseDto> {
        return this.request<BasePromptResponseDto>(`/prompts/base/${id}`, {
            method: 'GET',
        });
    }

    async createBasePrompt(dto: CreateBasePromptDto): Promise<BasePromptResponseDto> {
        return this.request<BasePromptResponseDto>('/prompts/base', {
            method: 'POST',
            body: dto,
        });
    }

    async updateBasePrompt(id: number, dto: UpdateBasePromptDto): Promise<BasePromptResponseDto> {
        return this.request<BasePromptResponseDto>(`/prompts/base/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteBasePrompt(id: number): Promise<void> {
        return this.request<void>(`/prompts/base/${id}`, {
            method: 'DELETE',
        });
    }

    async getCharacterPrompts(basePromptId: number): Promise<CharacterPromptResponseDto[]> {
        return this.request<CharacterPromptResponseDto[]>(`/prompts/base/${basePromptId}/characters`, {
            method: 'GET',
        });
    }

    async createCharacterPrompt(
        basePromptId: number,
        dto: CreateCharacterPromptDto,
    ): Promise<CharacterPromptResponseDto> {
        return this.request<CharacterPromptResponseDto>(`/prompts/base/${basePromptId}/characters`, {
            method: 'POST',
            body: dto,
        });
    }

    async getCharacterPrompt(id: number): Promise<CharacterPromptResponseDto> {
        return this.request<CharacterPromptResponseDto>(`/prompts/characters/${id}`, {
            method: 'GET',
        });
    }

    async updateCharacterPrompt(id: number, dto: UpdateCharacterPromptDto): Promise<CharacterPromptResponseDto> {
        return this.request<CharacterPromptResponseDto>(`/prompts/characters/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteCharacterPrompt(id: number): Promise<void> {
        return this.request<void>(`/prompts/characters/${id}`, {
            method: 'DELETE',
        });
    }

    async getPromptImages(characterPromptId: number): Promise<PromptImageResponseDto[]> {
        return this.request<PromptImageResponseDto[]>(`/prompts/characters/${characterPromptId}/images`, {
            method: 'GET',
        });
    }

    async uploadPromptImages(
        characterPromptId: number,
        files: File[],
        variantId?: number,
    ): Promise<PromptImageResponseDto[]> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const url = variantId
            ? `/prompts/characters/${characterPromptId}/images?variantId=${variantId}`
            : `/prompts/characters/${characterPromptId}/images`;

        return this.request<PromptImageResponseDto[]>(url, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async deletePromptImage(id: number): Promise<void> {
        return this.request<void>(`/prompts/images/${id}`, {
            method: 'DELETE',
        });
    }

    async uploadReferenceImage(characterPromptId: number, file: File): Promise<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<{ imageUrl: string }>(`/prompts/characters/${characterPromptId}/reference-image`, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async uploadBasePromptReferenceImage(basePromptId: number, file: File): Promise<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<{ imageUrl: string }>(`/prompts/base/${basePromptId}/reference-image`, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async getBasePromptImages(basePromptId: number): Promise<PromptImageResponseDto[]> {
        return this.request<PromptImageResponseDto[]>(`/prompts/base/${basePromptId}/images`, {
            method: 'GET',
        });
    }

    async uploadBasePromptImages(
        basePromptId: number,
        files: File[],
        variantId?: number,
    ): Promise<PromptImageResponseDto[]> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const url = variantId
            ? `/prompts/base/${basePromptId}/images?variantId=${variantId}`
            : `/prompts/base/${basePromptId}/images`;

        return this.request<PromptImageResponseDto[]>(url, {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }


    async updateImageVariant(
        imageId: number,
        variantId: number | null,
    ): Promise<PromptImageResponseDto> {
        return this.request<PromptImageResponseDto>(`/prompts/images/${imageId}/variant`, {
            method: 'PUT',
            body: { variantId },
        });
    }

    // LoreBook APIs
    async getLoreBookEntries(categoryId?: string): Promise<LoreBookEntryResponseDto[]> {
        const url = categoryId
            ? `${endpoints.lorebook.entries.list}?categoryId=${categoryId}`
            : endpoints.lorebook.entries.list;
        return this.request<LoreBookEntryResponseDto[]>(url, {
            method: 'GET',
        });
    }

    async getLoreBookEntry(id: string): Promise<LoreBookEntryResponseDto> {
        return this.request<LoreBookEntryResponseDto>(endpoints.lorebook.entries.detail(id), {
            method: 'GET',
        });
    }

    async createLoreBookEntry(dto: CreateLoreBookEntryDto): Promise<LoreBookEntryResponseDto> {
        return this.request<LoreBookEntryResponseDto>(endpoints.lorebook.entries.create, {
            method: 'POST',
            body: dto,
        });
    }

    async updateLoreBookEntry(id: string, dto: UpdateLoreBookEntryDto): Promise<LoreBookEntryResponseDto> {
        return this.request<LoreBookEntryResponseDto>(endpoints.lorebook.entries.update(id), {
            method: 'PUT',
            body: dto,
        });
    }

    async deleteLoreBookEntry(id: string): Promise<void> {
        return this.request<void>(endpoints.lorebook.entries.delete(id), {
            method: 'DELETE',
        });
    }

    async getLoreBookCategories(): Promise<LoreBookCategoryResponseDto[]> {
        return this.request<LoreBookCategoryResponseDto[]>(endpoints.lorebook.categories.list, {
            method: 'GET',
        });
    }

    async getLoreBookCategory(id: string): Promise<LoreBookCategoryResponseDto> {
        return this.request<LoreBookCategoryResponseDto>(endpoints.lorebook.categories.detail(id), {
            method: 'GET',
        });
    }

    async createLoreBookCategory(dto: CreateLoreBookCategoryDto): Promise<LoreBookCategoryResponseDto> {
        return this.request<LoreBookCategoryResponseDto>(endpoints.lorebook.categories.create, {
            method: 'POST',
            body: dto,
        });
    }

    async updateLoreBookCategory(id: string, dto: UpdateLoreBookCategoryDto): Promise<LoreBookCategoryResponseDto> {
        return this.request<LoreBookCategoryResponseDto>(endpoints.lorebook.categories.update(id), {
            method: 'PUT',
            body: dto,
        });
    }

    async updateLoreBookCategoryOrder(id: string, order: string[]): Promise<LoreBookCategoryResponseDto> {
        return this.request<LoreBookCategoryResponseDto>(endpoints.lorebook.categories.updateOrder(id), {
            method: 'PUT',
            body: order,
        });
    }

    async deleteLoreBookCategory(id: string): Promise<void> {
        return this.request<void>(endpoints.lorebook.categories.delete(id), {
            method: 'DELETE',
        });
    }

    async getLoreBookSettings(): Promise<LoreBookSettingsResponseDto> {
        return this.request<LoreBookSettingsResponseDto>(endpoints.lorebook.settings.get, {
            method: 'GET',
        });
    }

    async updateLoreBookSettings(dto: UpdateLoreBookSettingsDto): Promise<LoreBookSettingsResponseDto> {
        return this.request<LoreBookSettingsResponseDto>(endpoints.lorebook.settings.update, {
            method: 'PUT',
            body: dto,
        });
    }

    // Prompt Tag APIs
    async getPromptTags(tagType?: string): Promise<PromptTagResponseDto[]> {
        const url = tagType ? `/prompts/tags?tagType=${tagType}` : '/prompts/tags';
        return this.request<PromptTagResponseDto[]>(url, {
            method: 'GET',
        });
    }

    async getPromptTag(id: number): Promise<PromptTagResponseDto> {
        return this.request<PromptTagResponseDto>(`/prompts/tags/${id}`, {
            method: 'GET',
        });
    }

    async createPromptTag(dto: CreatePromptTagDto): Promise<PromptTagResponseDto> {
        return this.request<PromptTagResponseDto>('/prompts/tags', {
            method: 'POST',
            body: dto,
        });
    }

    async updatePromptTag(id: number, dto: UpdatePromptTagDto): Promise<PromptTagResponseDto> {
        return this.request<PromptTagResponseDto>(`/prompts/tags/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deletePromptTag(id: number): Promise<void> {
        return this.request<void>(`/prompts/tags/${id}`, {
            method: 'DELETE',
        });
    }

    // Prompt Variant APIs
    async getPromptVariants(basePromptId?: number, characterPromptId?: number): Promise<PromptVariantResponseDto[]> {
        const params = new URLSearchParams();
        if (basePromptId) params.append('basePromptId', basePromptId.toString());
        if (characterPromptId) params.append('characterPromptId', characterPromptId.toString());
        const url = `/prompts/variants${params.toString() ? `?${params.toString()}` : ''}`;
        return this.request<PromptVariantResponseDto[]>(url, {
            method: 'GET',
        });
    }

    async getPromptVariant(id: number): Promise<PromptVariantResponseDto> {
        return this.request<PromptVariantResponseDto>(`/prompts/variants/${id}`, {
            method: 'GET',
        });
    }

    async createPromptVariant(dto: CreatePromptVariantDto): Promise<PromptVariantResponseDto> {
        return this.request<PromptVariantResponseDto>('/prompts/variants', {
            method: 'POST',
            body: dto,
        });
    }

    async updatePromptVariant(id: number, dto: UpdatePromptVariantDto): Promise<PromptVariantResponseDto> {
        return this.request<PromptVariantResponseDto>(`/prompts/variants/${id}`, {
            method: 'PUT',
            body: dto,
        });
    }

    async deletePromptVariant(id: number): Promise<void> {
        return this.request<void>(`/prompts/variants/${id}`, {
            method: 'DELETE',
        });
    }

    async setDefaultPromptVariant(id: number): Promise<PromptVariantResponseDto> {
        return this.request<PromptVariantResponseDto>(`/prompts/variants/${id}/set-default`, {
            method: 'POST',
        });
    }

    async mergePromptVariant(id: number): Promise<{ mergedPrompt: string }> {
        return this.request<{ mergedPrompt: string }>(`/prompts/variants/${id}/merge`, {
            method: 'POST',
        });
    }

    // Prompt Images Grouped API
    async getPromptImagesGrouped(
        basePromptId?: number,
        characterPromptId?: number,
    ): Promise<PromptImagesGroupedResponseDto> {
        const params = new URLSearchParams();
        if (basePromptId) params.append('basePromptId', basePromptId.toString());
        if (characterPromptId) params.append('characterPromptId', characterPromptId.toString());
        const url = `/prompts/images/grouped${params.toString() ? `?${params.toString()}` : ''}`;
        return this.request<PromptImagesGroupedResponseDto>(url, {
            method: 'GET',
        });
    }
}

export const apiClient = new ApiClient();
