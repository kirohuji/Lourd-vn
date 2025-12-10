import { IStorageAdapter, ListOptions } from '../types';

/**
 * localStorage 存储适配器
 * 使用浏览器 localStorage 作为存储后端
 */
export class LocalStorageAdapter implements IStorageAdapter {
    private prefix: string;

    constructor(prefix: string = 'game_storage_') {
        this.prefix = prefix;
    }

    async initialize(): Promise<void> {
        // localStorage 不需要初始化
        return Promise.resolve();
    }

    /**
     * 生成存储 key
     */
    private getKey(tableName: string, id?: any): string {
        if (id !== undefined) {
            return `${this.prefix}${tableName}_${id}`;
        }
        return `${this.prefix}${tableName}_list`;
    }

    /**
     * 获取表的所有数据
     */
    private getAllItems<T extends {}>(tableName: string): T[] {
        try {
            const listKey = this.getKey(tableName);
            const listJson = localStorage.getItem(listKey);
            if (!listJson) {
                return [];
            }
            const ids: any[] = JSON.parse(listJson);
            const items: T[] = [];
            for (const id of ids) {
                const itemKey = this.getKey(tableName, id);
                const itemJson = localStorage.getItem(itemKey);
                if (itemJson) {
                    items.push(JSON.parse(itemJson));
                }
            }
            return items;
        } catch (error) {
            console.error('Error getting all items from localStorage', error);
            return [];
        }
    }

    /**
     * 保存 ID 列表
     */
    private saveIdList(tableName: string, ids: any[]): void {
        const listKey = this.getKey(tableName);
        localStorage.setItem(listKey, JSON.stringify(ids));
    }

    async put<T extends {}>(tableName: string, data: T): Promise<T> {
        try {
            const item = data as T & { id?: any };
            const id = item.id;

            if (id === undefined) {
                throw new Error('Data must have an id field');
            }

            // 保存数据
            const itemKey = this.getKey(tableName, id);
            localStorage.setItem(itemKey, JSON.stringify(data));

            // 更新 ID 列表
            const allItems = this.getAllItems<T>(tableName);
            const existingIds = allItems.map(item => (item as any).id);
            if (!existingIds.includes(id)) {
                existingIds.push(id);
                this.saveIdList(tableName, existingIds);
            }

            return data;
        } catch (error) {
            console.error('Error putting data to localStorage', error);
            throw error;
        }
    }

    async get<T extends {}>(tableName: string, id: any): Promise<T | null> {
        try {
            const itemKey = this.getKey(tableName, id);
            const itemJson = localStorage.getItem(itemKey);
            if (!itemJson) {
                return null;
            }
            return JSON.parse(itemJson) as T;
        } catch (error) {
            console.error('Error getting data from localStorage', error);
            return null;
        }
    }

    async getLast<T extends {}>(tableName: string): Promise<T | null> {
        try {
            const allItems = this.getAllItems<T>(tableName);
            if (allItems.length === 0) {
                return null;
            }

            // 按 ID 降序排序，返回第一个
            allItems.sort((a, b) => {
                const aId = (a as any).id;
                const bId = (b as any).id;
                if (typeof aId === 'number' && typeof bId === 'number') {
                    return bId - aId;
                }
                return String(bId).localeCompare(String(aId));
            });

            return allItems[0];
        } catch (error) {
            console.error('Error getting last data from localStorage', error);
            return null;
        }
    }

    async getList<T extends {}>(tableName: string, options?: ListOptions<T>): Promise<T[]> {
        try {
            let allItems = this.getAllItems<T>(tableName);

            // 排序
            if (options?.order) {
                const { field, direction } = options.order;
                allItems.sort((a, b) => {
                    const aValue = (a as any)[field];
                    const bValue = (b as any)[field];

                    let comparison = 0;
                    if (aValue === bValue) {
                        comparison = 0;
                    } else if (aValue < bValue) {
                        comparison = -1;
                    } else {
                        comparison = 1;
                    }

                    // 根据方向调整
                    if (direction === 'prev' || direction === 'prevunique') {
                        comparison = -comparison;
                    }

                    return comparison;
                });
            }

            // 分页
            if (options?.pagination) {
                const { offset, limit } = options.pagination;
                allItems = allItems.slice(offset, offset + limit);
            }

            return allItems;
        } catch (error) {
            console.error('Error getting list from localStorage', error);
            return [];
        }
    }

    async delete(tableName: string, id: any): Promise<void> {
        try {
            // 删除数据
            const itemKey = this.getKey(tableName, id);
            localStorage.removeItem(itemKey);

            // 更新 ID 列表
            const allItems = this.getAllItems(tableName);
            const filteredIds = allItems
                .map(item => (item as any).id)
                .filter(itemId => itemId !== id);
            this.saveIdList(tableName, filteredIds);
        } catch (error) {
            console.error('Error deleting data from localStorage', error);
            throw error;
        }
    }
}

