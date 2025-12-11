import { apiClient } from './api-client';
import { checkBundleUpdate, downloadAndExtractBundle, getLocalBundleVersion } from './bundle-manager';

/**
 * 下载项目共通资源包（如果需要）
 * @param projectId 项目 ID
 * @param onProgress 可选的进度回调
 * @returns 是否成功下载或已是最新版本
 */
export async function downloadCommonBundleIfNeeded(
    projectId: number,
    onProgress?: (status: string, progress: number) => void,
): Promise<boolean> {
    try {
        // 获取项目信息
        onProgress?.('正在获取项目信息…', 0);
        const projectInfo = await apiClient.getProjectInfo(projectId);

        // 检查是否有 ZIP 包
        if (!projectInfo.commonBundleZipUrl || !projectInfo.commonBundleVersion) {
            console.log('项目没有共通资源包 ZIP，跳过下载');
            return false;
        }

        // 检查本地版本
        const localVersion = getLocalBundleVersion('common', projectId);
        const needsUpdate = checkBundleUpdate(projectInfo.commonBundleVersion, localVersion);

        if (!needsUpdate) {
            console.log(`共通资源包已是最新版本: v${projectInfo.commonBundleVersion}`);
            return true;
        }

        // 需要下载或更新
        onProgress?.(`正在下载共通资源包 (v${projectInfo.commonBundleVersion})…`, 10);
        await downloadAndExtractBundle(
            projectInfo.commonBundleZipUrl,
            'common',
            projectId,
            projectInfo.commonBundleVersion,
        );
        onProgress?.('共通资源包下载完成', 100);
        return true;
    } catch (error) {
        console.error('下载共通资源包失败:', error);
        // 下载失败不影响游戏启动，返回 false 以便回退到网络加载
        return false;
    }
}

/**
 * 下载章节资源包（如果需要）
 * @param chapterId 章节 ID
 * @param onProgress 可选的进度回调
 * @returns 是否成功下载或已是最新版本
 */
export async function downloadChapterBundleIfNeeded(
    chapterId: number,
    onProgress?: (status: string, progress: number) => void,
): Promise<boolean> {
    try {
        // 获取章节信息
        onProgress?.('正在获取章节信息…', 0);
        const chapterInfo = await apiClient.getChapterInfo(chapterId);

        // 检查是否有 ZIP 包
        if (!chapterInfo.chapterBundleZipUrl || !chapterInfo.chapterBundleVersion) {
            console.log('章节没有资源包 ZIP，跳过下载');
            return false;
        }

        // 检查本地版本
        const localVersion = getLocalBundleVersion('chapter', chapterId);
        const needsUpdate = checkBundleUpdate(chapterInfo.chapterBundleVersion, localVersion);

        if (!needsUpdate) {
            console.log(`章节资源包已是最新版本: v${chapterInfo.chapterBundleVersion}`);
            return true;
        }

        // 需要下载或更新
        onProgress?.(`正在下载章节资源包 (v${chapterInfo.chapterBundleVersion})…`, 10);
        await downloadAndExtractBundle(
            chapterInfo.chapterBundleZipUrl,
            'chapter',
            chapterId,
            chapterInfo.chapterBundleVersion,
        );
        onProgress?.('章节资源包下载完成', 100);
        return true;
    } catch (error) {
        console.error('下载章节资源包失败:', error);
        // 下载失败不影响游戏启动，返回 false 以便回退到网络加载
        return false;
    }
}
