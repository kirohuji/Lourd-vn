import { Route, Routes } from 'react-router-dom';
import AdminLayout from './screens/admin/AdminLayout';
import AdminLogin from './screens/admin/Login';
import ResourcesManagement from './screens/admin/ResourcesManagement';
import UsersManagement from './screens/admin/UsersManagement';
import MapsEditor from './screens/admin/MapsEditor';
import CharactersEditor from './screens/admin/CharactersEditor';
import { AdminAuthGuard } from './utils/admin-auth-guard';

/**
 * 独立的 Admin 应用组件
 * 完全分离 admin 后台和游戏代码
 * 不包含任何游戏相关的 hooks、组件或初始化逻辑
 * 注意：RootProvider 已经在 main.tsx 中提供，这里不需要再次包装
 */
export default function AdminApp() {
    return (
        <Routes>
            {/* 管理员登录页面 */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* 管理员后台路由 - 需要管理员权限 */}
            <Route
                path="/admin"
                element={
                    <AdminAuthGuard>
                        <AdminLayout />
                    </AdminAuthGuard>
                }
            >
                <Route
                    path="resources"
                    element={
                        <ResourcesManagement />
                    }
                />
                <Route
                    path="users"
                    element={
                        <UsersManagement />
                    }
                />
                <Route
                    path="maps"
                    element={
                        <MapsEditor />
                    }
                />
                <Route
                    path="characters"
                    element={
                        <CharactersEditor />
                    }
                />
            </Route>
        </Routes>
    );
}

