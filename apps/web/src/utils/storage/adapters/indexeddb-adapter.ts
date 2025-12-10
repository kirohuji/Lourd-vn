import { IStorageAdapter, ListOptions } from '../types';

const INDEXED_DB_VERSION = 2;
const INDEXED_DB_NAME = 'game_db';
const SAVE_TABLE_NAME = 'saves';

/**
 * IndexedDB 存储适配器
 */
export class IndexedDBAdapter implements IStorageAdapter {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async initialize(): Promise<void> {
        // 如果已经初始化，直接返回
        if (this.db) {
            return;
        }

        // 如果正在初始化，等待初始化完成
        if (this.initPromise) {
            return this.initPromise;
        }

        // 开始初始化
        this.initPromise = new Promise(resolve => {
            // 检查 IndexedDB 是否可用
            if (typeof indexedDB === 'undefined') {
                console.warn('IndexedDB is not available in this environment, continuing without it');
                resolve();
                return;
            }

            const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                // 创建 saves 表（如果不存在）
                if (!db.objectStoreNames.contains(SAVE_TABLE_NAME)) {
                    const objectStore = db.createObjectStore(SAVE_TABLE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    objectStore.createIndex('id', 'id', { unique: true });
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('gameVersion', 'gameVersion', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                console.warn('IndexedDB initialization failed, continuing without it');
                resolve(); // 不 reject，允许继续运行
            };
        });

        return this.initPromise;
    }

    async put<T extends {}>(tableName: string, data: T): Promise<T> {
        await this.ensureInitialized();
        if (!this.db) {
            throw new Error('IndexedDB is not available');
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(tableName)) {
                    console.error(`Object store ${tableName} does not exist`);
                    reject(new Error(`Object store ${tableName} does not exist`));
                    return;
                }

                const transaction = db.transaction([tableName], 'readwrite');
                const objectStore = transaction.objectStore(tableName);
                const putRequest = objectStore.put(data);

                putRequest.onsuccess = () => {
                    resolve(data);
                };

                putRequest.onerror = event => {
                    console.error('Error adding data to IndexedDB', event);
                    reject(event);
                };
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                reject(event);
            };
        });
    }

    async get<T extends {}>(tableName: string, id: any): Promise<T | null> {
        await this.ensureInitialized();
        if (!this.db) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(tableName)) {
                    resolve(null);
                    return;
                }

                const transaction = db.transaction([tableName], 'readonly');
                const objectStore = transaction.objectStore(tableName);
                const getRequest = objectStore.get(id);

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || null);
                };

                getRequest.onerror = event => {
                    console.error('Error getting data from IndexedDB', event);
                    reject(event);
                };
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                reject(event);
            };
        });
    }

    async getLast<T extends {}>(tableName: string): Promise<T | null> {
        await this.ensureInitialized();
        if (!this.db) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(tableName)) {
                    resolve(null);
                    return;
                }

                const transaction = db.transaction([tableName], 'readonly');
                const objectStore = transaction.objectStore(tableName);
                const cursorRequest = objectStore.openCursor(null, 'prev');

                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        resolve(cursor.value);
                    } else {
                        resolve(null);
                    }
                };

                cursorRequest.onerror = event => {
                    console.error('Error getting last data from IndexedDB', event);
                    reject(event);
                };
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                reject(event);
            };
        });
    }

    async getList<T extends {}>(tableName: string, options?: ListOptions<T>): Promise<T[]> {
        await this.ensureInitialized();
        if (!this.db) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(tableName)) {
                    resolve([]);
                    return;
                }

                const transaction = db.transaction([tableName], 'readonly');
                const objectStore = transaction.objectStore(tableName);

                // 根据排序选项选择索引或直接使用 objectStore
                const cursorRequest = options?.order
                    ? objectStore.index(options.order.field as string).openCursor(null, options.order.direction)
                    : objectStore.openCursor();

                const results: T[] = [];
                let counter = 0;
                const limit = options?.pagination?.limit ?? Infinity;
                const offset = options?.pagination?.offset ?? 0;
                let advanced = false;

                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        if (counter >= offset) {
                            results.push(cursor.value);
                            if (results.length >= limit) {
                                resolve(results);
                                advanced = true;
                            }
                        }
                        counter++;
                        cursor.continue();
                    } else {
                        if (!advanced) {
                            resolve(results);
                        }
                    }
                };

                cursorRequest.onerror = event => {
                    console.error('Error getting list from IndexedDB', event);
                    reject(event);
                };
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                reject(event);
            };
        });
    }

    async delete(tableName: string, id: any): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) {
            throw new Error('IndexedDB is not available');
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_NAME);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction([tableName], 'readwrite');
                const objectStore = transaction.objectStore(tableName);
                const deleteRequest = objectStore.delete(id);

                deleteRequest.onsuccess = () => {
                    resolve();
                };

                deleteRequest.onerror = event => {
                    console.error('Error deleting data from IndexedDB', event);
                    reject(event);
                };
            };

            request.onerror = event => {
                console.error('Error opening IndexedDB', event);
                reject(event);
            };
        });
    }

    /**
     * 确保已初始化
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.db && !this.initPromise) {
            await this.initialize();
        } else if (this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * 创建表（如果不存在）
     * 这个方法在 initialize 时会被调用
     */
    createTableIfNotExists(
        tableName: string,
        keyPath: string,
        indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>,
    ): void {
        if (!this.db) {
            return;
        }

        if (!this.db.objectStoreNames.contains(tableName)) {
            const objectStore = this.db.createObjectStore(tableName, { keyPath, autoIncrement: true });

            // 创建索引
            if (indexes) {
                indexes.forEach(index => {
                    objectStore.createIndex(index.name, index.keyPath, { unique: index.unique || false });
                });
            }
        }
    }
}
