import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../../../stores/auth-store';
import { apiClient } from '../../../utils/api-client';
import { ResourceResponseDto, UserRole } from '@nqtr-game/shared';
import './index.scss';

export default function ResourcesManagement() {
  const { user, isAuthenticated } = useAuthStore();
  const [resources, setResources] = useState<ResourceResponseDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    if (user?.role !== UserRole.ADMIN) {
      Taro.showToast({
        title: '无权限访问',
        icon: 'error',
      });
      Taro.navigateBack();
      return;
    }

    loadResources();
  }, [isAuthenticated, user]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getResources();
      setResources(response.data);
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个资源吗？',
    });

    if (res.confirm) {
      try {
        await apiClient.deleteResource(id);
        Taro.showToast({
          title: '删除成功',
          icon: 'success',
        });
        loadResources();
      } catch (error) {
        Taro.showToast({
          title: '删除失败',
          icon: 'error',
        });
      }
    }
  };

  return (
    <View className='resources-management'>
      <View className='header'>
        <Text className='title'>资源管理</Text>
        <Button size='mini' onClick={loadResources}>
          刷新
        </Button>
      </View>

      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <View className='resource-list'>
          {resources.map((resource) => (
            <View key={resource.id} className='resource-item'>
              <View className='resource-info'>
                <Text className='alias'>{resource.alias}</Text>
                <Text className='bundle'>{resource.bundle}</Text>
                <Text className='size'>{Math.round(resource.fileSize / 1024)}KB</Text>
              </View>
              <Button
                size='mini'
                type='warn'
                onClick={() => handleDelete(resource.id)}
              >
                删除
              </Button>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

