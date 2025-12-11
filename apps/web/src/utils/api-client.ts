import { 
    ChapterResponseDto,
    EmailLoginDto, 
    LoginResponseDto, 
    ManifestResponse, 
    PaginatedResponse, 
    CharacterConfig,
    ProjectResponseDto
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
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);

            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                this.removeToken();
                // 只在非登录页面时跳转，避免循环跳转
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const isLoginPage = currentPath === '/login';
                    if (!isLoginPage) {
                        window.location.href = '/login';
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

    // Resource APIs
    async getProjectManifest(projectId: number): Promise<ManifestResponse> {
        return this.request<ManifestResponse>(
            `/projects/${projectId}/manifest/full`,
            {
                method: 'GET',
                needAuth: false, // 这是公开端点
            }
        );
    }

    async getProjectCharacters(projectId: number): Promise<PaginatedResponse<CharacterConfig>> {
        return this.request<PaginatedResponse<CharacterConfig>>(
            `/game-config/characters?usedByProjectId=${projectId}`,
            {
                method: 'GET',
                needAuth: true, // 需要认证
            }
        );
    }

    // Project Info APIs
    async getProjectInfo(projectId: number): Promise<ProjectResponseDto> {
        return this.request<ProjectResponseDto>(
            `/projects/${projectId}`,
            {
                method: 'GET',
                needAuth: false, // 公开端点
            }
        );
    }

    // Chapter Info APIs
    async getChapterInfo(chapterId: number): Promise<ChapterResponseDto> {
        return this.request<ChapterResponseDto>(
            `/chapters/${chapterId}`,
            {
                method: 'GET',
                needAuth: false, // 公开端点
            }
        );
    }
}

export const apiClient = new ApiClient();

