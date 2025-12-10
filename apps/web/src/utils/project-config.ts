/**
 * 项目配置工具
 * 从环境变量获取项目 ID 或名称
 */

/**
 * 获取项目 ID
 * 优先从 VITE_PROJECT_ID 获取，如果没有则尝试通过项目名称查找
 */
export async function getProjectId(): Promise<number | null> {
    // 优先使用项目 ID
    const projectId = import.meta.env.VITE_PROJECT_ID;
    if (projectId) {
        const id = Number(projectId);
        if (!isNaN(id) && id > 0) {
            return id;
        }
    }

    // 如果没有项目 ID，尝试使用项目名称
    const projectName = import.meta.env.VITE_PROJECT_NAME;
    if (projectName) {
        // 如果只有名称，需要从 API 查找项目 ID
        // 这里暂时返回 null，由调用方处理
        // 或者可以在这里调用 API 查找项目
        console.warn('VITE_PROJECT_NAME is set but project lookup not implemented. Please use VITE_PROJECT_ID instead.');
        return null;
    }

    return null;
}

/**
 * 获取项目名称
 */
export function getProjectName(): string | null {
    return import.meta.env.VITE_PROJECT_NAME || null;
}

