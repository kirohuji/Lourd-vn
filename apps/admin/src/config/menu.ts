import { Folder, HardDrive, Map, MessageSquare, User, Users } from 'lucide-react';

export interface MenuItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}

/**
 * 获取未选择项目时的菜单（项目列表视图）
 */
export function getProjectListMenu(): MenuItem[] {
    return [
        { title: '项目列表', href: '/admin/projects', icon: Folder },
        { title: '全局资源', href: '/admin/resources', icon: HardDrive },
        { title: '地图编辑', href: '/admin/maps', icon: Map },
        { title: '角色编辑', href: '/admin/characters', icon: User },
        { title: 'Prompt 管理', href: '/admin/prompts', icon: MessageSquare },
        { title: '用户管理', href: '/admin/users', icon: Users },
    ];
}

/**
 * 获取选择项目后的菜单（项目工作视图）
 * 注意：在项目工作视图中，菜单主要是章节列表，由 chapter-sidebar 组件处理
 * 这里返回空数组，因为章节列表是动态的
 */
export function getProjectWorkMenu(): MenuItem[] {
    // 项目工作视图中，左侧菜单是章节列表，由 chapter-sidebar 组件动态生成
    return [];
}
