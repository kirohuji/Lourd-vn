import { EmailLoginDto } from '@lourd-game/shared';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { emailLogin, isAuthenticated, isAdmin, checkAuth } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    if (isAuthenticated && isAdmin()) {
      navigate('/admin/projects', { replace: true });
    }
  }, [isAuthenticated, navigate, checkAuth, isAdmin]);

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({
        title: '错误',
        description: '请输入邮箱',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: '错误',
        description: '请输入密码',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dto: EmailLoginDto = {
        email: email.trim(),
        password: password.trim(),
      };
      await emailLogin(dto);
      toast({
        title: '成功',
        description: '登录成功',
      });
      navigate('/admin/projects');
    } catch (error: any) {
      console.error('登录失败:', error);
      toast({
        title: '登录失败',
        description: error.message || '邮箱或密码错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">管理后台登录</CardTitle>
          <CardDescription className="text-center">
            请输入您的邮箱和密码
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

