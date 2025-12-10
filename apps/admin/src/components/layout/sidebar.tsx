import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, ChevronRight, Folder, HardDrive, Map, Settings, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: NavItem[];
    badge?: string;
}

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ projectId?: string }>();
    const { logout, user } = useAuthStore();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['项目管理']));

    // 获取所有项目用于选择器
    const { data: projectsData } = useProjects({ page: 1, limit: 100 });
    const projects = projectsData?.data || [];
    const currentProjectId = params.projectId ? Number(params.projectId) : null;
    const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);

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

    const handleProjectChange = (projectId: string) => {
        const id = Number(projectId);
        if (id && !isNaN(id)) {
            // 如果当前在项目相关页面，导航到新项目的对应页面
            if (location.pathname.includes('/projects/') && location.pathname.includes('/resources')) {
                navigate(`/admin/projects/${id}/resources`);
            } else if (location.pathname.includes('/projects/') && location.pathname.includes('/maps')) {
                navigate(`/admin/projects/${id}/maps`);
            } else if (location.pathname.includes('/projects/') && location.pathname.includes('/characters')) {
                navigate(`/admin/projects/${id}/characters`);
            } else {
                // 默认导航到项目资源视图
                navigate(`/admin/projects/${id}/resources`);
            }
        }
    };

    // 基础菜单项（全局资源管理）
    const globalNavItems: NavItem[] = [
        { title: '资源管理', href: '/admin/resources', icon: HardDrive },
        { title: '地图编辑', href: '/admin/maps', icon: Map },
        { title: '角色编辑', href: '/admin/characters', icon: User },
    ];

    // 项目菜单项
    const projectNavItems: NavItem[] = [
        {
            title: '项目管理',
            href: '/admin/projects',
            icon: Folder,
            children: currentProjectId
                ? [
                      { title: '资源视图', href: `/admin/projects/${currentProjectId}/resources`, icon: HardDrive },
                      { title: '地图视图', href: `/admin/projects/${currentProjectId}/maps`, icon: Map },
                      { title: '角色视图', href: `/admin/projects/${currentProjectId}/characters`, icon: User },
                      { title: '章节管理', href: `/admin/projects/${currentProjectId}/chapters`, icon: BookOpen },
                  ]
                : undefined,
        },
    ];

    // 系统菜单项
    const systemNavItems: NavItem[] = [{ title: '用户管理', href: '/admin/users', icon: Users }];

    const renderNavItem = (item: NavItem, level = 0) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.title);
        const isActive =
            location.pathname === item.href ||
            (hasChildren && item.children?.some(child => location.pathname === child.href));

        return (
            <div key={item.href}>
                <button
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpanded(item.title);
                        } else {
                            navigate(item.href);
                        }
                    }}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        level > 0 && 'ml-4',
                        isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    {hasChildren && (
                        <span className='flex h-4 w-4 items-center justify-center'>
                            {isExpanded ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                        </span>
                    )}
                    <Icon className='h-4 w-4' />
                    <span className='flex-1 text-left'>{item.title}</span>
                    {item.badge && (
                        <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium'>{item.badge}</span>
                    )}
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
            {/* Header */}
            <div className='flex h-16 items-center border-b px-6'>
                <h2 className='text-lg font-semibold'>管理后台</h2>
            </div>

            {/* Project Selector */}
            {projects.length > 0 && (
                <div className='border-b p-4'>
                    <div className='space-y-2'>
                        <label className='text-xs font-medium text-muted-foreground'>当前项目</label>
                        <Select
                            value={currentProjectId?.toString() || 'list'}
                            onValueChange={value => {
                                if (value === 'list') {
                                    navigate('/admin/projects');
                                } else {
                                    handleProjectChange(value);
                                }
                            }}
                        >
                            <SelectTrigger className='h-9'>
                                <div className='flex items-center gap-2'>
                                    <Folder className='h-4 w-4 shrink-0' />
                                    <SelectValue placeholder='选择项目'>
                                        {currentProject ? currentProject.name : '项目列表'}
                                    </SelectValue>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='list'>
                                    <div className='flex items-center gap-2'>
                                        <Settings className='h-4 w-4' />
                                        <span>项目列表</span>
                                    </div>
                                </SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                        <div className='flex items-center gap-2'>
                                            <Folder className='h-4 w-4' />
                                            <span className='truncate'>{project.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
                {/* 全局资源管理 */}
                <div className='space-y-1'>
                    <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        全局资源
                    </div>
                    {globalNavItems.map(item => renderNavItem(item))}
                </div>

                <Separator className='my-4' />

                {/* 项目管理 */}
                <div className='space-y-1'>
                    <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        项目管理
                    </div>
                    {projectNavItems.map(item => renderNavItem(item))}
                </div>

                <Separator className='my-4' />

                {/* 系统管理 */}
                <div className='space-y-1'>
                    <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        系统管理
                    </div>
                    {systemNavItems.map(item => renderNavItem(item))}
                </div>
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
