const INDEXED_DB_VERSION = 3; // Increment this version number when you change the database schema
const INDEXED_DB_NAME = 'game_db';
export const INDEXED_DB_SAVE_TABLE = 'saves';
export const INDEXED_DB_RESOURCES_TABLE = 'resources';

// 资源数据结构
export interface ResourceRecord {
    id?: number; // 自增 ID
    alias: string; // 资源别名（在 manifest 中使用）
    src: string; // 资源 URL
    bundle: string; // 所属 bundle 名称
    hash: string; // 文件哈希值（用于去重）
    uploadDate: Date; // 上传日期
    fileSize: number; // 文件大小（字节）
    cosKey?: string; // COS 文件 Key（如果存储在 COS）
    originalName?: string; // 原始文件名
    fileType?: string; // 文件类型
}

export function initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

        request.onupgradeneeded = function (event) {
            let db = (event.target as IDBOpenDBRequest).result;

            // 创建 saves 表（如果不存在）
            if (!db.objectStoreNames.contains(INDEXED_DB_SAVE_TABLE)) {
                let objectStore = db.createObjectStore(INDEXED_DB_SAVE_TABLE, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('id', 'id', { unique: true });
                objectStore.createIndex('date', 'date', { unique: false });
                objectStore.createIndex('name', 'name', { unique: false });
                objectStore.createIndex('gameVersion', 'gameVersion', { unique: false });
            }

            // 创建 resources 表（如果不存在）
            if (!db.objectStoreNames.contains(INDEXED_DB_RESOURCES_TABLE)) {
                let objectStore = db.createObjectStore(INDEXED_DB_RESOURCES_TABLE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                objectStore.createIndex('id', 'id', { unique: true });
                objectStore.createIndex('alias', 'alias', { unique: false });
                objectStore.createIndex('bundle', 'bundle', { unique: false });
                objectStore.createIndex('hash', 'hash', { unique: true }); // 哈希值唯一，用于去重
                objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                objectStore.createIndex('cosKey', 'cosKey', { unique: false });
            }
        };

        request.onsuccess = function (_event) {
            resolve();
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

export async function putRowIntoIndexDB<T extends {}>(tableName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);

        request.onsuccess = function (_event) {
            let db = request.result;
            // run onupgradeneeded before onsuccess
            if (!db.objectStoreNames.contains(tableName)) {
                console.error('Object store rescues does not exist');
                reject();
            }
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let setRequest = objectStore.put(data);
            setRequest.onsuccess = function (_event) {
                resolve(data);
            };
            setRequest.onerror = function (event) {
                console.error('Error adding save data to indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error adding save data to indexDB', event);
        };
    });
}

export async function getRowFromIndexDB<T extends {}>(tableName: string, id: any): Promise<T | null> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            // check if the object store exists
            if (!db.objectStoreNames.contains(tableName)) {
                resolve(null);
                return;
            }
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let getRequest = objectStore.get(id);
            getRequest.onsuccess = function (_event) {
                resolve(getRequest.result);
            };
            getRequest.onerror = function (event) {
                console.error('Error getting save data from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

export async function getLastRowFromIndexDB<T extends {}>(tableName: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            // check if the object store exists
            if (!db.objectStoreNames.contains(tableName)) {
                resolve(null);
                return;
            }
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let getRequest = objectStore.openCursor(null, 'prev');
            getRequest.onsuccess = function (_event) {
                let cursor = getRequest.result;
                if (cursor) {
                    resolve(cursor.value);
                } else {
                    resolve(null);
                }
            };
            getRequest.onerror = function (event) {
                console.error('Error getting save data from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

export async function deleteRowFromIndexDB(tableName: string, id: any): Promise<void> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let deleteRequest = objectStore.delete(id);
            deleteRequest.onsuccess = function (_event) {
                resolve();
            };
            deleteRequest.onerror = function (event) {
                console.error('Error deleting save data from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error deleting save data from indexDB', event);
        };
    });
}

export async function getListFromIndexDB<T extends {}>(
    tableName: string,
    options: {
        order?: { field: keyof T; direction: IDBCursorDirection };
        pagination?: { offset: number; limit: number };
    } = {},
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            // check if the object store exists
            if (!db.objectStoreNames.contains(tableName)) {
                resolve([]);
                return;
            }
            let transaction = db.transaction([tableName], 'readwrite');
            let objectStore = transaction.objectStore(tableName);
            let getRequest = options.order
                ? objectStore.index(options.order.field as string).openCursor(null, options.order.direction)
                : objectStore.openCursor();
            let results: T[] = [];
            let counter = 0;
            let limit = options.pagination?.limit ?? Infinity;
            let offset = options.pagination?.offset ?? 0;
            let advanced = false;
            getRequest.onsuccess = _event => {
                let cursor = getRequest.result;
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
                console.error('Error getting save data from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

// 资源相关方法

/**
 * 添加或更新资源记录
 */
export async function putResource(resource: ResourceRecord): Promise<ResourceRecord> {
    return putRowIntoIndexDB<ResourceRecord>(INDEXED_DB_RESOURCES_TABLE, resource);
}

/**
 * 根据 ID 获取资源记录
 */
export async function getResourceById(id: number): Promise<ResourceRecord | null> {
    return getRowFromIndexDB<ResourceRecord>(INDEXED_DB_RESOURCES_TABLE, id);
}

/**
 * 根据哈希值获取资源记录
 */
export async function getResourceByHash(hash: string): Promise<ResourceRecord | null> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            if (!db.objectStoreNames.contains(INDEXED_DB_RESOURCES_TABLE)) {
                resolve(null);
                return;
            }
            let transaction = db.transaction([INDEXED_DB_RESOURCES_TABLE], 'readonly');
            let objectStore = transaction.objectStore(INDEXED_DB_RESOURCES_TABLE);
            let index = objectStore.index('hash');
            let getRequest = index.get(hash);

            getRequest.onsuccess = function (_event) {
                resolve(getRequest.result);
            };
            getRequest.onerror = function (event) {
                console.error('Error getting resource by hash from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

/**
 * 根据别名获取资源记录
 */
export async function getResourceByAlias(alias: string): Promise<ResourceRecord | null> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            if (!db.objectStoreNames.contains(INDEXED_DB_RESOURCES_TABLE)) {
                resolve(null);
                return;
            }
            let transaction = db.transaction([INDEXED_DB_RESOURCES_TABLE], 'readonly');
            let objectStore = transaction.objectStore(INDEXED_DB_RESOURCES_TABLE);
            let index = objectStore.index('alias');
            let getRequest = index.get(alias);

            getRequest.onsuccess = function (_event) {
                resolve(getRequest.result);
            };
            getRequest.onerror = function (event) {
                console.error('Error getting resource by alias from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

/**
 * 获取所有资源记录
 */
export async function getAllResources(
    options: {
        order?: { field: keyof ResourceRecord; direction: IDBCursorDirection };
        pagination?: { offset: number; limit: number };
    } = {},
): Promise<ResourceRecord[]> {
    return getListFromIndexDB<ResourceRecord>(INDEXED_DB_RESOURCES_TABLE, options);
}

/**
 * 根据 bundle 获取资源记录
 */
export async function getResourcesByBundle(bundle: string): Promise<ResourceRecord[]> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            if (!db.objectStoreNames.contains(INDEXED_DB_RESOURCES_TABLE)) {
                resolve([]);
                return;
            }
            let transaction = db.transaction([INDEXED_DB_RESOURCES_TABLE], 'readonly');
            let objectStore = transaction.objectStore(INDEXED_DB_RESOURCES_TABLE);
            let index = objectStore.index('bundle');
            let getRequest = index.openCursor(IDBKeyRange.only(bundle));
            let results: ResourceRecord[] = [];

            getRequest.onsuccess = function (_event) {
                let cursor = getRequest.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            getRequest.onerror = function (event) {
                console.error('Error getting resources by bundle from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}

/**
 * 删除资源记录
 */
export async function deleteResource(id: number): Promise<void> {
    return deleteRowFromIndexDB(INDEXED_DB_RESOURCES_TABLE, id);
}

/**
 * 清空所有资源记录
 */
export async function clearAllResources(): Promise<void> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXED_DB_NAME);
        request.onsuccess = function (_event) {
            let db = request.result;
            if (!db.objectStoreNames.contains(INDEXED_DB_RESOURCES_TABLE)) {
                resolve();
                return;
            }
            let transaction = db.transaction([INDEXED_DB_RESOURCES_TABLE], 'readwrite');
            let objectStore = transaction.objectStore(INDEXED_DB_RESOURCES_TABLE);
            let clearRequest = objectStore.clear();

            clearRequest.onsuccess = function (_event) {
                resolve();
            };
            clearRequest.onerror = function (event) {
                console.error('Error clearing resources from indexDB', event);
                reject();
            };
        };
        request.onerror = function (event) {
            console.error('Error opening indexDB', event);
            reject();
        };
    });
}
