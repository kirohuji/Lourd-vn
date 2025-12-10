import { AdminLayout } from '@/components/layout/admin-layout';
import { AdminAuthGuard } from '@/lib/auth/guard';
import { ComponentType, lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

// 懒加载页面组件
const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })));
const ProjectsPage = lazy(() => import('@/pages/projects').then(m => ({ default: m.ProjectsPage })));
const ResourcesPage = lazy(() => import('@/pages/resources').then(m => ({ default: m.ResourcesPage })));
const MapsPage = lazy(() => import('@/pages/maps').then(m => ({ default: m.MapsPage })));
const CharactersPage = lazy(() => import('@/pages/characters').then(m => ({ default: m.CharactersPage })));
const ProjectResourcesPage = lazy(() =>
    import('@/pages/project-resources').then(m => ({ default: m.ProjectResourcesPage })),
);
const ProjectMapsPage = lazy(() => import('@/pages/project-maps').then(m => ({ default: m.ProjectMapsPage })));
const ProjectCharactersPage = lazy(() =>
    import('@/pages/project-characters').then(m => ({ default: m.ProjectCharactersPage })),
);
const ProjectChaptersPage = lazy(() =>
    import('@/pages/project-chapters').then(m => ({ default: m.ProjectChaptersPage })),
);
const ChapterResourcesPage = lazy(() =>
    import('@/pages/chapter-resources').then(m => ({ default: m.ChapterResourcesPage })),
);
const UsersPage = lazy(() => import('@/pages/users').then(m => ({ default: m.UsersPage })));

// 路由配置类型
type RouteConfigItem =
    | {
          path: string;
          redirect: string;
          index?: boolean;
      }
    | {
          path: string;
          component: ComponentType;
          public?: boolean;
      }
    | {
          path: string;
          layout: ComponentType<{ children?: React.ReactNode }>;
          guard?: ComponentType<{ children: React.ReactNode }>;
          children?: RouteConfigItem[];
      };

// 路由配置（JSON 风格）
export const routeConfig: RouteConfigItem[] = [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        component: LoginPage,
        public: true,
    },
    {
        path: '/admin',
        layout: AdminLayout,
        guard: AdminAuthGuard,
        children: [
            {
                path: '',
                redirect: '/admin/projects',
                index: true,
            },
            // 全局资源管理
            {
                path: 'resources',
                component: ResourcesPage,
            },
            {
                path: 'maps',
                component: MapsPage,
            },
            {
                path: 'characters',
                component: CharactersPage,
            },
            // 项目管理
            {
                path: 'projects',
                component: ProjectsPage,
            },
            // 项目资源视图
            {
                path: 'projects/:projectId/resources',
                component: ProjectResourcesPage,
            },
            {
                path: 'projects/:projectId/maps',
                component: ProjectMapsPage,
            },
            {
                path: 'projects/:projectId/characters',
                component: ProjectCharactersPage,
            },
            // 项目章节管理
            {
                path: 'projects/:projectId/chapters',
                component: ProjectChaptersPage,
            },
            // 章节资源视图
            {
                path: 'chapters/:chapterId/resources',
                component: ChapterResourcesPage,
            },
            {
                path: 'users',
                component: UsersPage,
            },
        ],
    },
];

// 将配置转换为 React Router 的 RouteObject
export function createRoutes(config: RouteConfigItem[]): RouteObject[] {
    return config.map(route => {
        if ('redirect' in route) {
            const routeObject: RouteObject = {
                path: route.path,
                element: <Navigate to={route.redirect} replace />,
                ...(route.index && { index: true }),
            };
            return routeObject;
        }

        if ('component' in route) {
            return {
                path: route.path,
                element: <route.component />,
            };
        }

        if ('layout' in route && 'children' in route) {
            const Layout = route.layout;
            const Guard = route.guard || (({ children }: { children: React.ReactNode }) => <>{children}</>);

            return {
                path: route.path,
                element: (
                    <Guard>
                        <Layout />
                    </Guard>
                ),
                children: createRoutes(route.children || []),
            };
        }

        return {};
    });
}

export const routes = createRoutes(routeConfig);
