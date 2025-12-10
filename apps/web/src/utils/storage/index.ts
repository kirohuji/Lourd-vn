/**
 * 存储适配器模块
 * 导出所有存储相关的类型和工厂函数
 */

export { FileSystemAdapter } from './adapters/filesystem-adapter';
export { IndexedDBAdapter } from './adapters/indexeddb-adapter';
export { LocalStorageAdapter } from './adapters/localstorage-adapter';
export { WeChatStorageAdapter } from './adapters/wechat-adapter';
export * from './factory';
export * from './types';
