import COS from 'cos-js-sdk-v5';

/**
 * 腾讯云 COS 配置接口
 */
interface COSConfig {
    APPID: string;
    SECRET_ID: string;
    SECRET_KEY: string;
    REGION: string;
    BUCKET: string;
    DOMAIN: string;
}

/**
 * 从环境变量获取 COS 配置
 */
function getCOSConfig(): COSConfig {
    const appId = import.meta.env.VITE_COS_APPID;
    const secretId = import.meta.env.VITE_COS_SECRET_ID;
    const secretKey = import.meta.env.VITE_COS_SECRET_KEY;
    const region = import.meta.env.VITE_COS_REGION;
    const bucket = import.meta.env.VITE_COS_BUCKET;
    const domain = import.meta.env.VITE_COS_DOMAIN;

    // 检查配置是否完整
    if (!appId || !secretId || !secretKey || !region || !bucket || !domain) {
        throw new Error('腾讯云 COS 配置不完整，请检查环境变量');
    }

    return {
        APPID: appId,
        SECRET_ID: secretId,
        SECRET_KEY: secretKey,
        REGION: region,
        BUCKET: bucket,
        DOMAIN: domain,
    };
}

/**
 * COS 文件对象接口
 */
interface COSFileObject {
    Key: string;
    Size: number;
    LastModified: string;
    ETag?: string;
    StorageClass?: string;
    Owner?: {
        ID: string;
        DisplayName: string;
    };
}

/**
 * 腾讯云 COS 工具类
 */
export class COSUtility {
    private cos: COS;
    private config: COSConfig;

    constructor() {
        this.config = getCOSConfig();

        // 初始化 COS 客户端
        this.cos = new COS({
            SecretId: this.config.SECRET_ID,
            SecretKey: this.config.SECRET_KEY,
        });
    }

    /**
     * 上传文件到 COS
     * @param file 要上传的文件
     * @param key COS 文件 Key（例如：files/{hash}.{ext}）
     * @param onProgress 上传进度回调
     * @returns Promise<string> 文件 URL
     */
    async uploadFile(
        file: File,
        key: string,
        onProgress?: (progress: { percent: number; speed: number }) => void,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.cos.putObject(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                    Key: key,
                    Body: file,
                    onProgress: progressData => {
                        if (onProgress) {
                            onProgress({
                                percent: Math.round(progressData.percent * 100),
                                speed: progressData.speed || 0,
                            });
                        }
                    },
                },
                (err, data) => {
                    if (err) {
                        reject(new Error(`上传文件失败: ${err.message}`));
                    } else {
                        const url = `https://${data.Location}`;
                        resolve(url);
                    }
                },
            );
        });
    }

    /**
     * 检查文件是否已存在
     * @param key COS 文件 Key
     * @returns Promise<boolean> 文件是否存在
     */
    async checkFileExists(key: string): Promise<boolean> {
        return new Promise(resolve => {
            this.cos.headObject(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                    Key: key,
                },
                err => {
                    if (err && err.statusCode === 404) {
                        resolve(false); // 文件不存在
                    } else if (err) {
                        console.warn(`检查文件存在时出错: ${err.message}`);
                        resolve(false); // 出错时假定文件不存在
                    } else {
                        resolve(true); // 文件存在
                    }
                },
            );
        });
    }

    /**
     * 获取文件 URL
     * @param key COS 文件 Key
     * @returns 文件 URL
     */
    getFileUrl(key: string): string {
        return `https://${this.config.DOMAIN}/${key}`;
    }

    /**
     * 删除文件
     * @param key COS 文件 Key
     * @returns Promise<void>
     */
    async deleteFile(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cos.deleteObject(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                    Key: key,
                },
                err => {
                    if (err) {
                        reject(new Error(`删除文件失败: ${err.message}`));
                    } else {
                        resolve();
                    }
                },
            );
        });
    }

    /**
     * 批量删除文件
     * @param keys COS 文件 Key 数组
     * @returns Promise<void>
     */
    async deleteFiles(keys: string[]): Promise<void> {
        if (keys.length === 0) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.cos.deleteMultipleObject(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                    Objects: keys.map(key => ({ Key: key })),
                },
                err => {
                    if (err) {
                        reject(new Error(`批量删除文件失败: ${err.message}`));
                    } else {
                        resolve();
                    }
                },
            );
        });
    }

    /**
     * 获取文件列表
     * @param prefix 前缀（例如：files/）
     * @param maxKeys 最大返回数量
     * @returns Promise<COSFileObject[]>
     */
    async listFiles(prefix: string = '', maxKeys: number = 1000): Promise<COSFileObject[]> {
        return new Promise((resolve, reject) => {
            this.cos.getBucket(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                    Prefix: prefix,
                    MaxKeys: maxKeys,
                },
                (err, data) => {
                    if (err) {
                        reject(new Error(`获取文件列表失败: ${err.message}`));
                    } else {
                        // 转换数据格式，确保 Size 是数字
                        const contents = (data.Contents || []).map((item: any) => ({
                            Key: item.Key,
                            Size: Number(item.Size) || 0,
                            LastModified: item.LastModified,
                            ETag: item.ETag,
                            StorageClass: item.StorageClass,
                            Owner: item.Owner,
                        }));
                        resolve(contents);
                    }
                },
            );
        });
    }

    /**
     * 获取存储桶信息
     * @returns Promise<{ size: number; count: number }>
     */
    async getBucketInfo(): Promise<{ size: number; count: number }> {
        return new Promise((resolve, reject) => {
            this.cos.getBucket(
                {
                    Bucket: this.config.BUCKET,
                    Region: this.config.REGION,
                },
                (err, data) => {
                    if (err) {
                        reject(new Error(`获取存储桶信息失败: ${err.message}`));
                    } else {
                        const contents = data.Contents || [];
                        // 确保 Size 是数字
                        const totalSize = contents.reduce((sum: number, item: any) => {
                            const size = Number(item.Size) || 0;
                            return sum + size;
                        }, 0);
                        resolve({
                            size: totalSize,
                            count: contents.length,
                        });
                    }
                },
            );
        });
    }
}

// 创建单例实例
export const cosUtility = new COSUtility();
