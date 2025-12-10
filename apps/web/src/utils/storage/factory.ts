import { FileSystemAdapter } from './adapters/filesystem-adapter';
import { IndexedDBAdapter } from './adapters/indexeddb-adapter';
import { LocalStorageAdapter } from './adapters/localstorage-adapter';
import { WeChatStorageAdapter } from './adapters/wechat-adapter';
import { IStorageAdapter, StorageType } from './types';

/**
 * 创建存储适配器实例
 * 根据环境变量 VITE_STORAGE_TYPE 选择对应的适配器
 * @returns 存储适配器实例
 */
export function createStorageAdapter(): IStorageAdapter {
    // 从环境变量获取存储类型，默认为 indexeddb
    const storageType = (import.meta.env.VITE_STORAGE_TYPE as StorageType) || 'indexeddb';

    switch (storageType) {
        case 'indexeddb':
            return new IndexedDBAdapter();

        case 'localstorage':
            return new LocalStorageAdapter();

        case 'wechat':
            return new WeChatStorageAdapter();

        case 'filesystem':
            return new FileSystemAdapter();

        default:
            console.warn(`Unknown storage type: ${storageType}, falling back to indexeddb`);
            return new IndexedDBAdapter();
    }
}

/**
 * 全局存储适配器实例（单例）
 */
let storageAdapterInstance: IStorageAdapter | null = null;

/**
 * 获取存储适配器实例（单例模式）
 * @returns 存储适配器实例
 */
export function getStorageAdapter(): IStorageAdapter {
    if (!storageAdapterInstance) {
        storageAdapterInstance = createStorageAdapter();
    }
    return storageAdapterInstance;
}
