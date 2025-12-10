import { IStorageAdapter, ListOptions } from '../types';

/**
 * 文件系统存储适配器
 * 支持 Tauri 和 Capacitor 的文件系统 API
 */
export class FileSystemAdapter implements IStorageAdapter {
    private basePath: string;
    private fs: any; // Tauri 或 Capacitor 的文件系统 API

    constructor(basePath: string = 'game_saves/') {
        this.basePath = basePath;
        this.detectFileSystem();
    }

    /**
     * 检测可用的文件系统 API
     */
    private detectFileSystem(): void {
        // 检测 Tauri
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            this.fs = (window as any).__TAURI__.fs;
            return;
        }

        // 检测 Capacitor
        if (typeof window !== 'undefined' && (window as any).Capacitor) {
            const { Filesystem } = (window as any).Capacitor.Plugins;
            if (Filesystem) {
                this.fs = Filesystem;
                return;
            }
        }

        // 降级到 localStorage
        console.warn('FileSystem adapter initialized but no file system API available, falling back to localStorage');
        this.fs = null;
    }

    /**
     * 获取文件路径
     */
    private getFilePath(tableName: string, id?: any): string {
        if (id !== undefined) {
            return `${this.basePath}${tableName}/${id}.json`;
        }
        return `${this.basePath}${tableName}/list.json`;
    }

    /**
     * 确保目录存在
     */
    private async ensureDirectory(tableName: string): Promise<void> {
        if (!this.fs) {
            return;
        }

        try {
            const dirPath = `${this.basePath}${tableName}`;

            // Tauri
            if (this.fs.exists) {
                const exists = await this.fs.exists(dirPath);
                if (!exists) {
                    await this.fs.createDir(dirPath, { recursive: true });
                }
                return;
            }

            // Capacitor
            if (this.fs.mkdir) {
                try {
                    await this.fs.mkdir({
                        path: dirPath,
                        recursive: true,
                    });
                } catch (error: any) {
                    // 目录可能已存在，忽略错误
                    if (!error.message?.includes('already exists')) {
                        throw error;
                    }
                }
            }
        } catch (error) {
            console.error('Error ensuring directory exists', error);
        }
    }

    /**
     * 读取文件（降级到 localStorage）
     */
    private async readFile<T>(filePath: string, defaultValue: T | null): Promise<T | null> {
        if (!this.fs) {
            // 降级到 localStorage
            try {
                const value = localStorage.getItem(filePath);
                return value ? JSON.parse(value) : defaultValue;
            } catch {
                return defaultValue;
            }
        }

        try {
            // Tauri
            if (this.fs.readTextFile) {
                const content = await this.fs.readTextFile(filePath);
                return JSON.parse(content);
            }

            // Capacitor
            if (this.fs.readFile) {
                const result = await this.fs.readFile({
                    path: filePath,
                });
                return JSON.parse(result.data);
            }
        } catch (error: any) {
            // 文件不存在，返回默认值
            if (error.message?.includes('not found') || error.message?.includes('No such file')) {
                return defaultValue;
            }
            console.error('Error reading file', error);
        }

        return defaultValue;
    }

    /**
     * 写入文件（降级到 localStorage）
     */
    private async writeFile(filePath: string, data: any): Promise<void> {
        if (!this.fs) {
            // 降级到 localStorage
            localStorage.setItem(filePath, JSON.stringify(data));
            return;
        }

        try {
            const content = JSON.stringify(data);

            // Tauri
            if (this.fs.writeTextFile) {
                await this.fs.writeTextFile(filePath, content);
                return;
            }

            // Capacitor
            if (this.fs.writeFile) {
                await this.fs.writeFile({
                    path: filePath,
                    data: content,
                });
                return;
            }
        } catch (error) {
            console.error('Error writing file', error);
            throw error;
        }
    }

    /**
     * 删除文件（降级到 localStorage）
     */
    private async deleteFile(filePath: string): Promise<void> {
        if (!this.fs) {
            // 降级到 localStorage
            localStorage.removeItem(filePath);
            return;
        }

        try {
            // Tauri
            if (this.fs.remove) {
                await this.fs.remove(filePath);
                return;
            }

            // Capacitor
            if (this.fs.deleteFile) {
                await this.fs.deleteFile({
                    path: filePath,
                });
                return;
            }
        } catch (error: any) {
            // 文件不存在，忽略错误
            if (!error.message?.includes('not found') && !error.message?.includes('No such file')) {
                console.error('Error deleting file', error);
                throw error;
            }
        }
    }

    async initialize(): Promise<void> {
        // 确保基础目录存在
        if (this.fs) {
            try {
                // Tauri
                if (this.fs.createDir) {
                    const exists = await this.fs.exists(this.basePath);
                    if (!exists) {
                        await this.fs.createDir(this.basePath, { recursive: true });
                    }
                }
                // Capacitor
                else if (this.fs.mkdir) {
                    try {
                        await this.fs.mkdir({
                            path: this.basePath,
                            recursive: true,
                        });
                    } catch (error: any) {
                        if (!error.message?.includes('already exists')) {
                            throw error;
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing file system', error);
            }
        }
    }

    async put<T extends {}>(tableName: string, data: T): Promise<T> {
        try {
            await this.ensureDirectory(tableName);

            const item = data as T & { id?: any };
            const id = item.id;

            if (id === undefined) {
                throw new Error('Data must have an id field');
            }

            // 保存数据
            const filePath = this.getFilePath(tableName, id);
            await this.writeFile(filePath, data);

            // 更新 ID 列表
            const listPath = this.getFilePath(tableName);
            const idsResult = await this.readFile<any[]>(listPath, []);
            const ids: any[] = idsResult || [];
            if (!ids.includes(id)) {
                ids.push(id);
                await this.writeFile(listPath, ids);
            }

            return data;
        } catch (error) {
            console.error('Error putting data to file system', error);
            throw error;
        }
    }

    async get<T extends {}>(tableName: string, id: any): Promise<T | null> {
        try {
            const filePath = this.getFilePath(tableName, id);
            const item = await this.readFile<T>(filePath, null);
            return item;
        } catch (error) {
            console.error('Error getting data from file system', error);
            return null;
        }
    }

    async getLast<T extends {}>(tableName: string): Promise<T | null> {
        try {
            const listPath = this.getFilePath(tableName);
            const idsResult = await this.readFile<any[]>(listPath, []);
            const ids: any[] = idsResult || [];

            if (ids.length === 0) {
                return null;
            }

            // 按 ID 降序排序，获取最后一个
            ids.sort((a, b) => {
                if (typeof a === 'number' && typeof b === 'number') {
                    return b - a;
                }
                return String(b).localeCompare(String(a));
            });

            const lastId = ids[0];
            return await this.get<T>(tableName, lastId);
        } catch (error) {
            console.error('Error getting last data from file system', error);
            return null;
        }
    }

    async getList<T extends {}>(tableName: string, options?: ListOptions<T>): Promise<T[]> {
        try {
            const listPath = this.getFilePath(tableName);
            const idsResult = await this.readFile<any[]>(listPath, []);
            const ids: any[] = idsResult || [];

            // 获取所有数据
            const allItems: T[] = [];
            for (const id of ids) {
                const item = await this.get<T>(tableName, id);
                if (item) {
                    allItems.push(item);
                }
            }

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
                return allItems.slice(offset, offset + limit);
            }

            return allItems;
        } catch (error) {
            console.error('Error getting list from file system', error);
            return [];
        }
    }

    async delete(tableName: string, id: any): Promise<void> {
        try {
            // 删除文件
            const filePath = this.getFilePath(tableName, id);
            await this.deleteFile(filePath);

            // 更新 ID 列表
            const listPath = this.getFilePath(tableName);
            const idsResult = await this.readFile<any[]>(listPath, []);
            const ids: any[] = idsResult || [];
            const filteredIds = ids.filter(itemId => itemId !== id);
            await this.writeFile(listPath, filteredIds);
        } catch (error) {
            console.error('Error deleting data from file system', error);
            throw error;
        }
    }
}
