import { setupPixivnViteData } from '@drincs/pixi-vn/vite-listener';
import { Box, CircularProgress } from '@mui/joy';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const Home = lazy(async () => {
    // 只导入必要的代码，不进行资源初始化
    // 资源初始化将在 LoadingScreen 中进行
    // await Promise.all([import('./values'), import('./labels')]);
    setupPixivnViteData();
    return import('./Home');
});

// 简单的加载组件，不依赖 Router
function SimpleLoadingScreen() {
    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <CircularProgress size='lg' />
        </Box>
    );
}

function ErrorFallback({ error }: { error: Error | undefined }) {
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
                {error?.message || 'An unknown error occurred'}
            </p>
        </div>
    );
}

export default function App() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<SimpleLoadingScreen />}>
                <Home />
            </Suspense>
        </ErrorBoundary>
    );
}
