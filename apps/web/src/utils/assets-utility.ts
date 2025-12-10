import { Assets } from '@drincs/pixi-vn';
import manifest from '../assets/manifest';
import { MAIN_MENU_ROUTE } from '../constans';
import { generateManifestFromAPI } from './manifest-manager';

/**
 * Define all the assets that will be used in the game.
 * This function will be called before the game starts.
 * You can read more about assets management in the documentation: https://pixi-vn.web.app/start/assets-management.html
 */
export async function defineAssets() {
    try {
        // 从后端 API 获取 manifest 并合并基础 manifest
        const dynamicManifest = await generateManifestFromAPI(manifest);

        // 初始化 Assets 系统
        Assets.init({ manifest: dynamicManifest });

        // The game will not start until these asserts are loaded.
        await Assets.loadBundle(MAIN_MENU_ROUTE);

        // The game will start immediately, but these asserts will be loaded in the background.
        // Assets.backgroundLoadBundle("main_menu");
        // Assets.backgroundLoad("background_main_menu");
    } catch (error) {
        console.error('Failed to initialize assets with API resources:', error);

        // 如果 API 调用失败，回退到原始 manifest
        Assets.init({ manifest });

        await Assets.loadBundle(MAIN_MENU_ROUTE);
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
