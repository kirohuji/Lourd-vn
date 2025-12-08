import { setupPixivnViteData } from '@drincs/pixi-vn/vite-listener';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import AdminApp from './AdminApp';
import { useI18n } from './i18n';
import LoadingScreen from './screens/LoadingScreen';
import { initGameConfigFromBackend } from './services/gameConfigFactory';
import { defineAssets } from './utils/assets-utility';
import { initializeIndexedDB } from './utils/indexedDB-utility';
import { importAllInkLabels } from './utils/ink-utility';
import { initializeNQTR } from './utils/nqtr-utility';

const Home = lazy(async () => {
    await initGameConfigFromBackend(); // 从后端加载地图/地点/房间/角色配置
    await import('./labels');
    await import('./values');
    // 初始化 IndexedDB 仅用于游戏存档
    await Promise.all([initializeIndexedDB(), defineAssets(), useI18n(), importAllInkLabels(), initializeNQTR()]);
    setupPixivnViteData();
    return import('./Home');
});

function ErrorFallback({ error }: { error: Error }) {
    return (
        <div
            role='alert'
            style={{
                pointerEvents: 'auto',
                backgroundColor: 'black',
            }}
        >
            <h2
                style={{
                    color: 'red',
                    fontSize: '2rem',
                    textAlign: 'center',
                    marginTop: '1rem',
                }}
            >
                Something went wrong
            </h2>
            <p
                style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    marginTop: '1rem',
                }}
            >
                {error.message}
            </p>
        </div>
    );
}

export default function App() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    // 如果是 admin 路由，加载 AdminApp（不包含游戏相关代码）
    if (isAdminRoute) {
        return <AdminApp />;
    }

    // 游戏路由：加载 Home（包含所有游戏初始化逻辑）
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingScreen />}>
                <Home />
            </Suspense>
        </ErrorBoundary>
    );
}
