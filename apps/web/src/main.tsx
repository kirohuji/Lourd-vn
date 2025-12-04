import { Assets, canvas, Container, Game, storage } from '@drincs/pixi-vn';
import { setupInkHmrListener } from '@drincs/pixi-vn-ink/vite-listener';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App';
import RootProvider from './providers/RootProvider';
import { CANVAS_UI_LAYER_NAME, NAVIGATION_ROUTE } from './constans';
import './index.css';
import { getCanvasDimensions } from './utils/device-utility';

// 检查是否是 admin 路由
const isAdminRoute = window.location.pathname.startsWith('/admin');

// React setup
const root = document.getElementById('root');
if (!root) {
    throw new Error('root element not found');
}

const queryClient = new QueryClient();

if (isAdminRoute) {
    // admin 路由：直接渲染 React，不初始化 Game 引擎
    const reactRoot = createRoot(root);
    reactRoot.render(
        <QueryClientProvider client={queryClient}>
            <RootProvider>
                <App />
            </RootProvider>
        </QueryClientProvider>,
    );
} else {
    // 游戏路由：初始化 Game 引擎
const body = document.body;
if (!body) {
    throw new Error('body element not found');
}

// 获取适合当前设备的画布尺寸
const canvasDimensions = getCanvasDimensions();

Game.init(body, {
    height: canvasDimensions.height,
    width: canvasDimensions.width,
    backgroundColor: '#303030',
}).then(() => {
    // Pixi.JS UI Layer
    canvas.addLayer(CANVAS_UI_LAYER_NAME, new Container());

    const htmlLayout = canvas.addHtmlLayer('ui', root);
    if (!htmlLayout) {
        throw new Error('htmlLayout not found');
    }
    const reactRoot = createRoot(htmlLayout);

    reactRoot.render(
        <QueryClientProvider client={queryClient}>
                <RootProvider>
            <App />
                </RootProvider>
        </QueryClientProvider>,
    );
});

Game.onEnd(async props => {
    let isTheEnd = storage.getFlag('is_the_end');
    if (isTheEnd) {
        Game.clear();
        props.navigate('/');
    } else {
        props.navigate(NAVIGATION_ROUTE);
    }
});

Game.onError((type, error, { notify, t }) => {
    notify(t('allert_error_occurred'), { variant: 'error' });
    console.error(`Error occurred: ${type}`, error);
});

Game.onLoadingLabel((_stepId, { id }) => Assets.backgroundLoadBundle(id));

setupInkHmrListener();
}
