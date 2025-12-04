import { useState } from 'react';
import { View, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../../stores/auth-store';
import './index.scss';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      // 小程序登录
      if (process.env.TARO_ENV === 'weapp') {
        const res = await Taro.login();
        await login(res.code, 'miniprogram');
      } else {
        // Web 端：需要跳转到微信授权页面或使用二维码
        // 这里提供一个示例，实际需要根据微信网页授权流程实现
        Taro.showToast({
          title: 'Web 端登录需要微信扫码',
          icon: 'none',
        });
        // TODO: 实现微信网页登录流程
      }
      
      // 登录成功后跳转
      Taro.switchTab({ url: '/pages/index/index' });
    } catch (error) {
      Taro.showToast({
        title: '登录失败',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login'>
      <Text className='title'>NQTR Game</Text>
      <Button
        className='login-button'
        type='primary'
        loading={loading}
        onClick={handleWechatLogin}
      >
        微信登录
      </Button>
    </View>
  );
}

