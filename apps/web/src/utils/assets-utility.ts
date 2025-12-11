import { Assets } from '@drincs/pixi-vn';
import manifest from '../assets/manifest';
import { MAIN_MENU_ROUTE } from '../constans';
import { generateManifestFromAPI } from './manifest-manager';
import { resourceCache } from './resource-cache';

/**
 * Define all the assets that will be used in the game.
 * This function will be called before the game starts.
 * You can read more about assets management in the documentation: https://pixi-vn.web.app/start/assets-management.html
 */
export async function defineAssets() {
    // 检查是否已初始化
    if (resourceCache.isAssetsInitialized()) {
        console.log('Assets already initialized, updating manifest...');
        // Assets 已初始化，只需要更新 manifest
        try {
            const dynamicManifest = await generateManifestFromAPI(manifest);
            if (Assets.resolver) {
                Assets.resolver.addManifest(dynamicManifest);
            }
            // 确保 bundle 已加载
            if (!resourceCache.isBundleLoaded(MAIN_MENU_ROUTE)) {
                await Assets.loadBundle(MAIN_MENU_ROUTE);
                resourceCache.markBundleLoaded(MAIN_MENU_ROUTE);
            }
        } catch (error) {
            console.error('Failed to update manifest:', error);
        }
        return;
    }

    try {
        // 从后端 API 获取 manifest 并合并基础 manifest
        const dynamicManifest = await generateManifestFromAPI(manifest);

        // 初始化 Assets
        try {
            Assets.init({ manifest: dynamicManifest });
            resourceCache.markAssetsInitialized();
        } catch (initError: any) {
            // 如果初始化失败（可能已经初始化），尝试只更新 manifest
            if (initError?.message?.includes('already initialized')) {
                console.warn('Assets already initialized, updating manifest only');
                resourceCache.markAssetsInitialized();
                if (Assets.resolver) {
                    Assets.resolver.addManifest(dynamicManifest);
                }
            } else {
                throw initError;
            }
        }
        console.log('dynamicManifest', dynamicManifest);
        // The game will not start until these asserts are loaded.
        // 检查 bundle 是否已加载
        if (!resourceCache.isBundleLoaded(MAIN_MENU_ROUTE)) {
            await Assets.loadBundle(MAIN_MENU_ROUTE);
            resourceCache.markBundleLoaded(MAIN_MENU_ROUTE);
        } else {
            console.log(`Bundle ${MAIN_MENU_ROUTE} already loaded, skipping`);
        }

        // The game will start immediately, but these asserts will be loaded in the background.
        // Assets.backgroundLoadBundle("main_menu");
        // Assets.backgroundLoad("background_main_menu");
    } catch (error) {
        console.error('Failed to initialize assets with API resources:', error);

        // 如果 API 调用失败，回退到原始 manifest
        try {
            Assets.init({ manifest });
            resourceCache.markAssetsInitialized();
        } catch (initError: any) {
            // 如果初始化失败（可能已经初始化），尝试只更新 manifest
            if (initError?.message?.includes('already initialized')) {
                console.warn('Assets already initialized, updating manifest only');
                resourceCache.markAssetsInitialized();
                if (Assets.resolver) {
                    Assets.resolver.addManifest(manifest);
                }
            } else {
                throw initError;
            }
        }

        // 检查 bundle 是否已加载
        if (!resourceCache.isBundleLoaded(MAIN_MENU_ROUTE)) {
            await Assets.loadBundle(MAIN_MENU_ROUTE);
            resourceCache.markBundleLoaded(MAIN_MENU_ROUTE);
        } else {
            console.log(`Bundle ${MAIN_MENU_ROUTE} already loaded, skipping`);
        }
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
