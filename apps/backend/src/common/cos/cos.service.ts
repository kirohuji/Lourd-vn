import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import COS from 'cos-nodejs-sdk-v5';

@Injectable()
export class CosService {
  private cos: COS;
  private config: {
    secretId: string;
    secretKey: string;
    region: string;
    bucket: string;
    domain: string;
  };

  constructor(private configService: ConfigService) {
    this.config = {
      secretId: this.configService.get<string>('COS_SECRET_ID') || '',
      secretKey: this.configService.get<string>('COS_SECRET_KEY') || '',
      region: this.configService.get<string>('COS_REGION') || '',
      bucket: this.configService.get<string>('COS_BUCKET') || '',
      domain: this.configService.get<string>('COS_DOMAIN') || '',
    };

    this.cos = new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    });
  }

  /**
   * 上传文件到 COS
   */
  async uploadFile(
    file: Buffer,
    key: string,
    onProgress?: (progress: { percent: number; speed: number }) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
          // 确保资源可被前端直接访问：对象设置为公共读
          ACL: 'public-read',
          Body: file,
          onProgress: (progressData) => {
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
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
        },
        (err) => {
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
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.cos.deleteMultipleObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Objects: keys.map((key) => ({ Key: key })),
        },
        (err) => {
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
   * 检查文件是否存在
   */
  async checkFileExists(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.cos.headObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
        },
        (err) => {
          if (err && err.statusCode === 404) {
            resolve(false);
          } else if (err) {
            console.warn(`检查文件存在时出错: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  /**
   * 获取文件 URL
   */
  getFileUrl(key: string): string {
    return `https://${this.config.domain}/${key}`;
  }
}
