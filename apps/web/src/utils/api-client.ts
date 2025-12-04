import Taro from '@tarojs/taro';
import { LoginResponseDto, WechatLoginDto, ResourceResponseDto, PaginatedResponse, ResourceQueryDto, ManifestResponse } from '@nqtr-game/shared';

const API_BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private getToken(): string | null {
    return Taro.getStorageSync('accessToken') || null;
  }

  private async request<T>(
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      header?: Record<string, string>;
      needAuth?: boolean;
    } = {},
  ): Promise<T> {
    const { method = 'GET', data, header = {}, needAuth = true } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (needAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await Taro.request({
        url: `${API_BASE_URL}${url}`,
        method: method as any,
        data,
        header: headers,
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data as T;
      } else {
        throw new Error(`API Error: ${response.statusCode}`);
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
      data: dto,
      needAuth: false,
    });
    
    // 保存 token
    if (response.accessToken) {
      Taro.setStorageSync('accessToken', response.accessToken);
    }
    
    return response;
  }

  // Resource APIs
  async getResources(query?: ResourceQueryDto): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.request<PaginatedResponse<ResourceResponseDto>>('/resources', {
      method: 'GET',
      data: query,
    });
  }

  async getResource(id: number): Promise<ResourceResponseDto> {
    return this.request<ResourceResponseDto>(`/resources/${id}`, {
      method: 'GET',
    });
  }

  async uploadResource(
    file: File,
    alias: string,
    bundle: string,
  ): Promise<ResourceResponseDto> {
    // 注意：Taro 的文件上传需要使用 Taro.uploadFile
    const token = this.getToken();
    
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: `${API_BASE_URL}/resources`,
        filePath: (file as any).path || (file as any).tempFilePath,
        name: 'file',
        formData: {
          alias,
          bundle,
        },
        header: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        fail: reject,
      });
    });
  }

  async deleteResource(id: number): Promise<void> {
    return this.request<void>(`/resources/${id}`, {
      method: 'DELETE',
    });
  }

  async getManifest(): Promise<ManifestResponse> {
    return this.request<ManifestResponse>('/resources/manifest', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();

