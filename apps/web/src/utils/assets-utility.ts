import { Assets } from '@drincs/pixi-vn';
import manifest from '../assets/manifest';
import { MAIN_MENU_ROUTE } from '../constans';
import { manifestManager } from './manifest-manager';

/**
 * Define all the assets that will be used in the game.
 * This function will be called before the game starts.
 * You can read more about assets management in the documentation: https://pixi-vn.web.app/start/assets-management.html
 */
export async function defineAssets() {
    try {
        // 从后端 API 获取 manifest 并合并基础 manifest
        const dynamicManifest = await manifestManager.generateManifestFromAPI(manifest);

        // 初始化 Assets 系统
        Assets.init({ manifest: dynamicManifest });

        // The game will not start until these asserts are loaded.
        await Assets.loadBundle(MAIN_MENU_ROUTE);

        // The game will start immediately, but these asserts will be loaded in the background.
        // 预加载导航图标
        Assets.backgroundLoadBundle('navigation_icons');

        console.log('Assets initialized with manifest from API');
    } catch (error) {
        console.error('Failed to initialize assets with API resources:', error);

        // 如果 API 调用失败，回退到原始 manifest
        console.log('Falling back to original manifest');
        Assets.init({ manifest });

        await Assets.loadBundle(MAIN_MENU_ROUTE);
        Assets.backgroundLoadBundle('navigation_icons');
    }
}

/**
 * 动态添加资源到 Assets 系统
 * @param assets 资源数组
 */
export async function addDynamicAssets(assets: Array<{ alias: string; src: string }>): Promise<void> {
    try {
        // 使用 Assets.add 方法添加资源
        const assetPromises = assets.map(asset => Assets.add({ alias: asset.alias, src: asset.src }));

        await Promise.all(assetPromises);

        // 后台加载新添加的资源
        Assets.backgroundLoad([...assets.map(asset => asset.alias)]);

        console.log(`Dynamic assets added:`, assets);
    } catch (error) {
        console.error(`Failed to add dynamic assets:`, error);
        throw error;
    }
}

/**
 * 重新加载所有资源（从后端 API 获取最新 manifest）
 */
export async function reloadAllAssets(): Promise<void> {
    try {
        // 卸载所有已加载的资源
        Assets.unload([]);

        // 重新初始化 Assets 系统
        await defineAssets();

        console.log('All assets reloaded successfully');
    } catch (error) {
        console.error('Failed to reload assets:', error);
        throw error;
    }
}

/**
 * Get the PixiJS asset from the given asset string.
 * If the asset is not a PixiAsset, it will return the asset as is.
 * @param asset - The asset string to resolve.
 * @returns The resolved PixiJS asset or the original asset string.
 */
export function getPixiJSAsset(asset: string) {
    // check if the asset is a PixiAsset
    return Assets.resolver.resolve(asset).src || asset;
}
