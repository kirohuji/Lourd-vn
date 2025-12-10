import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes/config';

function LoadingFallback() {
    return (
        <div className='flex h-screen items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
    );
}

export function App() {
    const element = useRoutes(routes);
    return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>;
}
