import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Folder, HardDrive, Map, User, Users } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    // 全局资源管理
    { title: '资源管理', href: '/admin/resources', icon: HardDrive },
    { title: '地图编辑', href: '/admin/maps', icon: Map },
    { title: '角色编辑', href: '/admin/characters', icon: User },
    // 项目管理
    {
        title: '项目管理',
        href: '/admin/projects',
        icon: Folder,
        children: [
            { title: '资源视图', href: '/admin/projects/:projectId/resources', icon: HardDrive },
            { title: '地图视图', href: '/admin/projects/:projectId/maps', icon: Map },
            { title: '角色视图', href: '/admin/projects/:projectId/characters', icon: User },
        ],
    },
    { title: '用户管理', href: '/admin/users', icon: Users },
];

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { logout, user } = useAuthStore();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['项目管理']));

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    const renderNavItem = (item: NavItem, level = 0) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.title);
        const projectId = params.projectId || '';

        // 检查是否是项目子菜单项且没有 projectId
        const isProjectSubmenu = item.href.includes(':projectId');
        const hasValidProjectId = !!projectId;

        // 如果没有有效的 projectId，禁用项目子菜单项
        const isDisabled = isProjectSubmenu && !hasValidProjectId;

        const href = isProjectSubmenu
            ? hasValidProjectId
                ? item.href.replace(':projectId', projectId)
                : '/admin/projects' // 如果没有 projectId，导航到项目列表
            : item.href;

        const isActive =
            location.pathname === href ||
            (hasChildren &&
                location.pathname.startsWith('/admin/projects/') &&
                location.pathname.includes('/resources') &&
                item.title === '项目管理') ||
            (hasChildren &&
                location.pathname.startsWith('/admin/projects/') &&
                location.pathname.includes('/maps') &&
                item.title === '项目管理') ||
            (hasChildren &&
                location.pathname.startsWith('/admin/projects/') &&
                location.pathname.includes('/characters') &&
                item.title === '项目管理') ||
            (!hasChildren && location.pathname === href);

        return (
            <div key={item.href}>
                <button
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpanded(item.title);
                        } else if (isProjectSubmenu && !hasValidProjectId) {
                            // 如果没有 projectId，导航到项目列表
                            navigate('/admin/projects');
                        } else {
                            navigate(href);
                        }
                    }}
                    disabled={isDisabled}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        level > 0 && 'ml-4',
                        isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                    )}
                >
                    {hasChildren && (
                        <span className='flex h-4 w-4 items-center justify-center'>
                            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                        </span>
                    )}
                    <Icon className='h-4 w-4' />
                    {item.title}
                </button>
                {hasChildren && isExpanded && (
                    <div className='ml-4 mt-1 space-y-1'>
                        {item.children!.map(child => renderNavItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className='flex h-screen w-64 flex-col border-r bg-card'>
            <div className='flex h-16 items-center border-b px-6'>
                <h2 className='text-lg font-semibold'>管理后台</h2>
            </div>
            <nav className='flex-1 space-y-1 overflow-y-auto p-4'>{navItems.map(item => renderNavItem(item))}</nav>
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
