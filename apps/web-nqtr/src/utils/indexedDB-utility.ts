/**
 * IndexedDB 工具 - 仅用于游戏存档功能
 * 资源管理已迁移到后端 API
 */

const INDEXED_DB_NAME = 'game-db';
const INDEXED_DB_SAVE_TABLE = 'saves';

/**
 * 初始化 IndexedDB（仅用于游戏存档）
 */
export async function initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME, 1);

        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = function (_event) {
            resolve();
        };

        request.onupgradeneeded = function (event: any) {
            const db = event.target.result;

            // 创建 saves 表（如果不存在）
            if (!db.objectStoreNames.contains(INDEXED_DB_SAVE_TABLE)) {
                const objectStore = db.createObjectStore(INDEXED_DB_SAVE_TABLE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                objectStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

/**
 * 保存数据到 IndexedDB
 */
export async function putRowIntoIndexDB<T extends { id?: number }>(
    tableName: string,
    data: T,
): Promise<T & { id: number }> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            const db = request.result;
            if (!db.objectStoreNames.contains(tableName)) {
                reject(new Error(`Table ${tableName} does not exist`));
                return;
            }
            const transaction = db.transaction([tableName], 'readwrite');
            const objectStore = transaction.objectStore(tableName);
            const putRequest = objectStore.put(data);

            putRequest.onsuccess = function () {
                resolve({ ...data, id: putRequest.result as number });
            };

            putRequest.onerror = function (event) {
                console.error('Error putting data into indexDB', event);
                reject(new Error('Failed to save data'));
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
}

/**
 * 从 IndexedDB 获取数据
 */
export async function getRowFromIndexDB<T>(tableName: string, id: number): Promise<T | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            const db = request.result;
            if (!db.objectStoreNames.contains(tableName)) {
                resolve(null);
                return;
            }
            const transaction = db.transaction([tableName], 'readonly');
            const objectStore = transaction.objectStore(tableName);
            const getRequest = objectStore.get(id);

            getRequest.onsuccess = function () {
                resolve(getRequest.result || null);
            };

            getRequest.onerror = function (event) {
                console.error('Error getting data from indexDB', event);
                reject(new Error('Failed to get data'));
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
}

/**
 * 从 IndexedDB 获取最后一条数据
 */
export async function getLastRowFromIndexDB<T>(
    tableName: string,
    indexName?: string,
): Promise<T | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            const db = request.result;
            if (!db.objectStoreNames.contains(tableName)) {
                resolve(null);
                return;
            }
            const transaction = db.transaction([tableName], 'readonly');
            const objectStore = transaction.objectStore(tableName);
            const index = indexName ? objectStore.index(indexName) : null;
            const cursorRequest = index ? index.openCursor(null, 'prev') : objectStore.openCursor(null, 'prev');

            cursorRequest.onsuccess = function (event: any) {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value);
                } else {
                    resolve(null);
                }
            };

            cursorRequest.onerror = function (event) {
                console.error('Error getting last data from indexDB', event);
                reject(new Error('Failed to get last data'));
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
}

/**
 * 从 IndexedDB 获取列表
 */
export async function getListFromIndexDB<T extends {}>(
    tableName: string,
    options: {
        order?: { field: keyof T; direction: IDBCursorDirection };
        pagination?: { offset: number; limit: number };
    } = {},
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            const db = request.result;
            if (!db.objectStoreNames.contains(tableName)) {
                resolve([]);
                return;
            }
            const transaction = db.transaction([tableName], 'readonly');
            const objectStore = transaction.objectStore(tableName);
            const getRequest = options.order
                ? objectStore.index(options.order.field as string).openCursor(null, options.order.direction)
                : objectStore.openCursor();
            const results: T[] = [];
            let counter = 0;
            const limit = options.pagination?.limit ?? Infinity;
            const offset = options.pagination?.offset ?? 0;
            let advanced = false;

            getRequest.onsuccess = function (_event: any) {
                const cursor = getRequest.result;
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

            getRequest.onerror = function (event) {
                console.error('Error getting list from indexDB', event);
                reject(new Error('Failed to get list'));
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
}

/**
 * 从 IndexedDB 删除数据
 */
export async function deleteRowFromIndexDB(tableName: string, id: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            const db = request.result;
            if (!db.objectStoreNames.contains(tableName)) {
                reject(new Error(`Table ${tableName} does not exist`));
                return;
            }
            const transaction = db.transaction([tableName], 'readwrite');
            const objectStore = transaction.objectStore(tableName);
            const deleteRequest = objectStore.delete(id);

            deleteRequest.onsuccess = function () {
                resolve();
            };

            deleteRequest.onerror = function (event) {
                console.error('Error deleting data from indexDB', event);
                reject(new Error('Failed to delete data'));
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
}

export { INDEXED_DB_SAVE_TABLE };

