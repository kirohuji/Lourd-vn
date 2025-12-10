import { storage } from '@drincs/pixi-vn';

/**
 * 使用 @drincs/pixi-vn 的 storage 进行数据存储
 * storage 基于 localStorage，提供类型安全的数据存储
 */

const SAVE_STORAGE_KEY = 'game_saves';
const LAST_SAVE_ID_KEY = 'last_save_id';

export interface GameSaveItem {
    id: number;
    saveData: any;
    gameVersion: string;
    date: Date;
    name: string;
    image?: string;
}

/**
 * 获取所有存档列表
 */
export function getSaveList(): GameSaveItem[] {
    try {
        const savesJson = storage.get(SAVE_STORAGE_KEY);
        if (!savesJson) {
            return [];
        }
        const saves = JSON.parse(savesJson as string) as GameSaveItem[];
        // 转换 date 字符串为 Date 对象
        return saves.map(save => ({
            ...save,
            date: new Date(save.date),
        }));
    } catch {
        return [];
    }
}

/**
 * 保存存档
 */
export function saveGameSave(item: GameSaveItem): void {
    const saves = getSaveList();
    const existingIndex = saves.findIndex(s => s.id === item.id);

    if (existingIndex >= 0) {
        // 更新现有存档
        saves[existingIndex] = item;
    } else {
        // 添加新存档
        saves.push(item);
    }

    // 按日期排序（最新的在前）
    saves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 保存到 storage
    storage.set(SAVE_STORAGE_KEY, JSON.stringify(saves));

    // 更新最后保存的 ID
    const maxId = Math.max(...saves.map(s => s.id), 0);
    storage.set(LAST_SAVE_ID_KEY, maxId.toString());
}

/**
 * 获取存档
 */
export function getGameSave(id: number): GameSaveItem | null {
    const saves = getSaveList();
    return saves.find(s => s.id === id) || null;
}

/**
 * 获取最后一个存档
 */
export function getLastGameSave(): GameSaveItem | null {
    const saves = getSaveList();
    return saves.length > 0 ? saves[0] : null;
}

/**
 * 删除存档
 */
export function deleteGameSave(id: number): void {
    const saves = getSaveList();
    const filtered = saves.filter(s => s.id !== id);
    storage.set(SAVE_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 获取下一个存档 ID
 */
export function getNextSaveId(): number {
    try {
        const lastIdStr = storage.get(LAST_SAVE_ID_KEY);
        const lastId = lastIdStr ? parseInt(lastIdStr as string, 10) : 0;
        return isNaN(lastId) ? 1 : lastId + 1;
    } catch {
        return 1;
    }
}
