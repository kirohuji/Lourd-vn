import { IStorageAdapter, ListOptions } from '../types';
declare const wx: any;
/**
 * 微信小程序存储适配器
 * 使用微信小程序的 wx.getStorage/wx.setStorage API
 */
export class WeChatStorageAdapter implements IStorageAdapter {
    private prefix: string;
    private wx: any;

    constructor(prefix: string = 'game_storage_') {
        this.prefix = prefix;
        // 检测是否在微信小程序环境
        if (typeof wx !== 'undefined') {
            this.wx = wx;
        } else {
            console.warn('WeChat adapter initialized but wx is not available, falling back to localStorage');
            this.wx = null;
        }
    }

    async initialize(): Promise<void> {
        // 微信小程序存储不需要初始化
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
    private async getAllItems<T extends {}>(tableName: string): Promise<T[]> {
        try {
            const listKey = this.getKey(tableName);
            const idsResult = await this.getStorage<any[]>(listKey, null);
            const ids: any[] = idsResult || [];

            const items: T[] = [];
            for (const id of ids) {
                const itemKey = this.getKey(tableName, id);
                const item = await this.getStorage<T>(itemKey, null);
                if (item) {
                    items.push(item);
                }
            }
            return items;
        } catch (error) {
            console.error('Error getting all items from WeChat storage', error);
            return [];
        }
    }

    /**
     * 保存 ID 列表
     */
    private async saveIdList(tableName: string, ids: any[]): Promise<void> {
        const listKey = this.getKey(tableName);
        await this.setStorage(listKey, ids);
    }

    /**
     * 微信小程序 getStorage 封装
     */
    private getStorage<T>(key: string, defaultValue: T | null): Promise<T | null> {
        return new Promise(resolve => {
            if (!this.wx) {
                // 降级到 localStorage
                try {
                    const value = localStorage.getItem(key);
                    resolve(value ? JSON.parse(value) : defaultValue);
                } catch {
                    resolve(defaultValue);
                }
                return;
            }

            this.wx.getStorage({
                key,
                success: (res: any) => {
                    try {
                        resolve(JSON.parse(res.data));
                    } catch {
                        resolve(res.data);
                    }
                },
                fail: () => {
                    resolve(defaultValue);
                },
            });
        });
    }

    /**
     * 微信小程序 setStorage 封装
     */
    private setStorage(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.wx) {
                // 降级到 localStorage
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    resolve();
                } catch (error) {
                    reject(error);
                }
                return;
            }

            this.wx.setStorage({
                key,
                data: JSON.stringify(value),
                success: () => resolve(),
                fail: (error: any) => reject(error),
            });
        });
    }

    /**
     * 微信小程序 removeStorage 封装
     */
    private removeStorage(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.wx) {
                // 降级到 localStorage
                localStorage.removeItem(key);
                resolve();
                return;
            }

            this.wx.removeStorage({
                key,
                success: () => resolve(),
                fail: (error: any) => reject(error),
            });
        });
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
            await this.setStorage(itemKey, data);

            // 更新 ID 列表
            const allItems = await this.getAllItems<T>(tableName);
            const existingIds = allItems.map(item => (item as any).id);
            if (!existingIds.includes(id)) {
                existingIds.push(id);
                await this.saveIdList(tableName, existingIds);
            }

            return data;
        } catch (error) {
            console.error('Error putting data to WeChat storage', error);
            throw error;
        }
    }

    async get<T extends {}>(tableName: string, id: any): Promise<T | null> {
        try {
            const itemKey = this.getKey(tableName, id);
            const item = await this.getStorage<T>(itemKey, null);
            return item;
        } catch (error) {
            console.error('Error getting data from WeChat storage', error);
            return null;
        }
    }

    async getLast<T extends {}>(tableName: string): Promise<T | null> {
        try {
            const allItems = await this.getAllItems<T>(tableName);
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
            console.error('Error getting last data from WeChat storage', error);
            return null;
        }
    }

    async getList<T extends {}>(tableName: string, options?: ListOptions<T>): Promise<T[]> {
        try {
            let allItems = await this.getAllItems<T>(tableName);

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
            console.error('Error getting list from WeChat storage', error);
            return [];
        }
    }

    async delete(tableName: string, id: any): Promise<void> {
        try {
            // 删除数据
            const itemKey = this.getKey(tableName, id);
            await this.removeStorage(itemKey);

            // 更新 ID 列表
            const allItems = await this.getAllItems(tableName);
            const filteredIds = allItems.map(item => (item as any).id).filter(itemId => itemId !== id);
            await this.saveIdList(tableName, filteredIds);
        } catch (error) {
            console.error('Error deleting data from WeChat storage', error);
            throw error;
        }
    }
}
