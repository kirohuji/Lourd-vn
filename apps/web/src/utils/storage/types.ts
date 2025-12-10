/**
 * 列表查询选项
 */
export interface ListOptions<T = any> {
    /**
     * 排序选项
     */
    order?: {
        field: keyof T;
        direction: 'next' | 'prev' | 'nextunique' | 'prevunique';
    };
    /**
     * 分页选项
     */
    pagination?: {
        offset: number;
        limit: number;
    };
}

/**
 * 存储适配器接口
 * 定义统一的存储操作接口，支持多种存储后端
 */
export interface IStorageAdapter {
    /**
     * 初始化存储
     */
    initialize(): Promise<void>;

    /**
     * 保存数据（插入或更新）
     * @param tableName 表名
     * @param data 要保存的数据
     * @returns 保存后的数据
     */
    put<T extends {}>(tableName: string, data: T): Promise<T>;

    /**
     * 获取单条数据
     * @param tableName 表名
     * @param id 数据 ID
     * @returns 数据或 null
     */
    get<T extends {}>(tableName: string, id: any): Promise<T | null>;

    /**
     * 获取最后一条数据（按 ID 降序）
     * @param tableName 表名
     * @returns 数据或 null
     */
    getLast<T extends {}>(tableName: string): Promise<T | null>;

    /**
     * 获取列表数据
     * @param tableName 表名
     * @param options 查询选项（排序、分页）
     * @returns 数据列表
     */
    getList<T extends {}>(tableName: string, options?: ListOptions<T>): Promise<T[]>;

    /**
     * 删除数据
     * @param tableName 表名
     * @param id 数据 ID
     */
    delete(tableName: string, id: any): Promise<void>;
}

/**
 * 存储类型
 */
export type StorageType = 'indexeddb' | 'localstorage' | 'wechat' | 'filesystem';
