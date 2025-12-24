import { Outlet, useParams } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { ProjectLayout } from './project-layout';

export function AdminLayout() {
    const params = useParams<{ projectId?: string }>();
    const projectId = params.projectId ? Number(params.projectId) : null;

    // 如果选择了项目，使用项目工作视图布局
    if (projectId && !isNaN(projectId)) {
        return <ProjectLayout />;
    }

    // 否则使用项目列表视图布局
    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}
