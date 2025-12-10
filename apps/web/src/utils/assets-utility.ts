import { Assets, AssetsManifest } from "@drincs/pixi-vn";
import { MAIN_MENU_ROUTE } from "../constans";
import { apiClient } from "./api-client";
import { getProjectId } from "./project-config";
import { processManifest } from "./manifest-manager";

/**
 * Define all the assets that will be used in the game.
 * This function will be called before the game starts.
 * You can read more about assets management in the documentation: https://pixi-vn.web.app/start/assets-management.html
 */
export async function defineAssets() {
    // 获取项目 ID
    const projectId = await getProjectId();
    
    if (!projectId) {
        console.error('Project ID not found. Please set VITE_PROJECT_ID environment variable.');
        throw new Error('Project ID is required to load assets');
    }

    try {
        // 从 API 获取 manifest
        const manifestResponse = await apiClient.getProjectManifest(projectId);
        let manifest: AssetsManifest = manifestResponse.manifest;

        // 处理 manifest，将 COS URL 转换为代理 URL 以避免 CORS 问题
        manifest = processManifest(manifest);

        // 初始化 Assets
        Assets.init({ manifest });

        // The game will not start until these asserts are loaded.
        await Assets.loadBundle(MAIN_MENU_ROUTE);

        // The game will start immediately, but these asserts will be loaded in the background.
        // Assets.backgroundLoadBundle("main_menu");
        // Assets.backgroundLoad("background_main_menu");
    } catch (error) {
        console.error('Failed to load assets from API:', error);
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
