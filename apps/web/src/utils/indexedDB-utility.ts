import { getStorageAdapter } from './storage/factory';

export const INDEXED_DB_SAVE_TABLE = 'saves';

/**
 * 初始化存储
 * 使用适配器模式，根据环境变量选择对应的存储后端
 */
export async function initializeIndexedDB(): Promise<void> {
    const adapter = getStorageAdapter();
    return adapter.initialize();
}

export async function putRowIntoIndexDB<T extends {}>(tableName: string, data: T): Promise<T> {
    const adapter = getStorageAdapter();
    return adapter.put(tableName, data);
}

export async function getRowFromIndexDB<T extends {}>(tableName: string, id: any): Promise<T | null> {
    const adapter = getStorageAdapter();
    return adapter.get<T>(tableName, id);
}

export async function getLastRowFromIndexDB<T extends {}>(tableName: string): Promise<T | null> {
    const adapter = getStorageAdapter();
    return adapter.getLast<T>(tableName);
}

export async function deleteRowFromIndexDB(tableName: string, id: any): Promise<void> {
    const adapter = getStorageAdapter();
    return adapter.delete(tableName, id);
}

/**
 * 将 IDBCursorDirection 转换为适配器的 direction 格式
 */
function convertDirection(direction: IDBCursorDirection): 'next' | 'prev' | 'nextunique' | 'prevunique' {
    switch (direction) {
        case 'next':
            return 'next';
        case 'prev':
            return 'prev';
        case 'nextunique':
            return 'nextunique';
        case 'prevunique':
            return 'prevunique';
        default:
            return 'next';
    }
}

export async function getListFromIndexDB<T extends {}>(
    tableName: string,
    options: {
        order?: { field: keyof T; direction: IDBCursorDirection };
        pagination?: { offset: number; limit: number };
    } = {},
): Promise<T[]> {
    const adapter = getStorageAdapter();

    // 转换选项格式
    const adapterOptions = {
        order: options.order
            ? {
                  field: options.order.field,
                  direction: convertDirection(options.order.direction),
              }
            : undefined,
        pagination: options.pagination,
    };

    return adapter.getList<T>(tableName, adapterOptions);
}
