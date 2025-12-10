import {
    CharacterConfig,
    CreateCharacterDto,
    CreateLocationDto,
    CreateMapDto,
    CreateProjectDto,
    CreateRoomDto,
    EmailLoginDto,
    LocationConfig,
    LoginResponseDto,
    ManifestResponse,
    MapConfig,
    PaginatedResponse,
    ProjectQueryDto,
    ProjectResponseDto,
    ResourceQueryDto,
    ResourceResponseDto,
    RoomConfig,
    UpdateCharacterDto,
    UpdateLocationDto,
    UpdateMapDto,
    UpdateProjectDto,
    UpdateResourceDto,
    UpdateRoomDto,
    UpdateUserDto,
    UserQueryDto,
    UserResponseDto,
    WechatLoginDto,
} from '@lourd-game/shared';

import { API_BASE_URL } from './endpoints';

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
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data as T;
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

    async uploadResource(file: File, alias: string, bundle: string): Promise<ResourceResponseDto> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alias', alias);
        formData.append('bundle', bundle);

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

    async migrateResourceToCos(id: number): Promise<ResourceResponseDto> {
        return this.request<ResourceResponseDto>(`/manifest/${id}/migrate-to-cos`, {
            method: 'POST',
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
}

export const apiClient = new ApiClient();
