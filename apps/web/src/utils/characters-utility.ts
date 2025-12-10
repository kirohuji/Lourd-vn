import { RegisteredCharacters } from "@drincs/pixi-vn";
import Character from "../models/Character";
import { apiClient } from "./api-client";
import { getProjectId } from "./project-config";

/**
 * 从 API 加载角色并注册到 RegisteredCharacters
 */
export async function loadCharactersFromAPI() {
    const projectId = await getProjectId();
    
    if (!projectId) {
        console.warn('Project ID not found. Characters will not be loaded from API.');
        return;
    }

    try {
        const response = await apiClient.getProjectCharacters(projectId);
        const characters = response.data;

        // 收集要注册的角色
        const charactersToAdd: Character[] = [];

        // 创建每个角色
        for (const charConfig of characters) {
            if (!charConfig.enabled) {
                continue; // 跳过未启用的角色
            }

            // 检查角色是否已注册
            if (RegisteredCharacters.has(charConfig.id)) {
                continue; // 已存在，跳过
            }

            // 创建角色
            const character = new Character(charConfig.id, {
                name: charConfig.name,
                age: charConfig.age ?? undefined,
                icon: charConfig.icon ?? undefined,
                color: charConfig.color ?? undefined,
            });

            charactersToAdd.push(character);
        }

        // 批量注册角色
        if (charactersToAdd.length > 0) {
            RegisteredCharacters.add(charactersToAdd);
            console.log(`Loaded ${charactersToAdd.length} characters from API`);
        }
    } catch (error) {
        console.error('Failed to load characters from API:', error);
        // 不抛出错误，允许游戏继续运行
    }
}

