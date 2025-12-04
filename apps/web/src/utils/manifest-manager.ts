import { AssetsManifest } from '@drincs/pixi-vn';
import { apiClient } from './api-client';

/**
 * Manifest 管理工具（使用后端 API）
 */
export class ManifestManager {
  /**
   * 从后端获取 manifest
   */
  async getManifest(): Promise<AssetsManifest> {
    try {
      const response = await apiClient.getManifest();
      return response.manifest;
    } catch (error) {
      console.error('获取 manifest 失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有资源
   */
  async getAllResources() {
    try {
      const response = await apiClient.getResources();
      return response.data;
    } catch (error) {
      console.error('获取资源列表失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const manifestManager = new ManifestManager();

