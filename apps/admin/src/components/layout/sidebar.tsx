import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { getProjectListMenu } from '@/config/menu';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ projectId?: string }>();
    const { logout, user } = useAuthStore();
    const currentProjectId = params.projectId ? Number(params.projectId) : null;

    // 如果选择了项目，不显示侧边栏（项目工作视图使用 project-layout）
    if (currentProjectId) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const menuItems = getProjectListMenu();

    const renderNavItem = (item: typeof menuItems[0]) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
            <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
            >
                <Icon className='h-4 w-4' />
                <span className='flex-1 text-left'>{item.title}</span>
                {item.badge && (
                    <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium'>{item.badge}</span>
                )}
            </button>
        );
    };

    return (
        <div className='flex h-screen w-64 flex-col border-r bg-card'>
            {/* Header */}
            <div className='flex h-16 items-center border-b px-6'>
                <h2 className='text-lg font-semibold'>管理后台</h2>
            </div>

            {/* Navigation */}
            <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
                {menuItems.map(item => renderNavItem(item))}
            </nav>

            {/* Footer */}
            <div className='border-t p-4'>
                {user && (
                    <div className='mb-2 text-sm text-muted-foreground'>用户: {user.email || `ID: ${user.id}`}</div>
                )}
                <Button variant='outline' className='w-full' onClick={handleLogout}>
                    退出登录
                </Button>
            </div>
        </div>
    );
}
