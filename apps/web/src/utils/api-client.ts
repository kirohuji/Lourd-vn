import {
    LoginResponseDto,
    ManifestResponse,
    PaginatedResponse,
    ResourceQueryDto,
    ResourceResponseDto,
    UpdateUserDto,
    UserQueryDto,
    UserResponseDto,
    WechatLoginDto,
} from '@lourd-game/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
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

    logout(): void {
        this.removeToken();
    }

    // Resource APIs
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
        return this.request<PaginatedResponse<ResourceResponseDto>>(`/resources${queryString}`, {
            method: 'GET',
        });
    }

    async getResource(id: number): Promise<ResourceResponseDto> {
        return this.request<ResourceResponseDto>(`/resources/${id}`, {
            method: 'GET',
        });
    }

    async uploadResource(file: File, alias: string, bundle: string): Promise<ResourceResponseDto> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alias', alias);
        formData.append('bundle', bundle);

        return this.request<ResourceResponseDto>('/resources', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
        });
    }

    async deleteResource(id: number): Promise<void> {
        return this.request<void>(`/resources/${id}`, {
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
}

export const apiClient = new ApiClient();
