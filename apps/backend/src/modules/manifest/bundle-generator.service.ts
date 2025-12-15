import { AssetsManifest } from '@drincs/pixi-vn';
import { Injectable, NotFoundException } from '@nestjs/common';
import JSZip from 'jszip';
import { CosService } from '../../common/cos/cos.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { generateCosKey } from '../../common/utils/file-hash.util';

@Injectable()
export class BundleGeneratorService {
  constructor(
    private prisma: PrismaService,
    private cosService: CosService,
  ) {}

  /**
   * 生成项目共通资源包 ZIP
   */
  async generateCommonBundle(projectId: number): Promise<{
    zipUrl: string;
    version: number;
  }> {
    // 获取项目信息
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (!project.commonBundle) {
      throw new NotFoundException(
        `Project ${projectId} does not have a commonBundle configured`,
      );
    }

    // 查询项目的共通资源
    // 根据项目的 commonBundle 名称查询所有 bundleType='common' 的资源
    const resources = await this.prisma.resource.findMany({
      where: {
        bundle: project.commonBundle,
        bundleType: 'common',
      },
      orderBy: { bundle: 'asc' },
    });

    if (resources.length === 0) {
      throw new NotFoundException(
        `No common resources found for bundle: ${project.commonBundle}`,
      );
    }

    // 生成 manifest
    const manifest = this.generateManifestFromResources(resources);

    // 创建 ZIP 包
    const zipBuffer = await this.createBundleZip(resources, manifest);

    // 生成新的版本号
    const newVersion = (project.commonBundleVersion || 0) + 1;

    // 生成 COS Key
    const cosKey = generateCosKey(
      `project-${projectId}-common-bundle-v${newVersion}`,
      `common-bundle-v${newVersion}.zip`,
    );

    // 上传 ZIP 包到 COS
    const zipUrl = await this.cosService.uploadFile(zipBuffer, cosKey);

    // 更新项目的 ZIP 包信息
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        commonBundleZipUrl: zipUrl,
        commonBundleVersion: newVersion,
      },
    });

    return {
      zipUrl,
      version: newVersion,
    };
  }

  /**
   * 生成章节资源包 ZIP
   */
  async generateChapterBundle(chapterId: number): Promise<{
    zipUrl: string;
    version: number;
  }> {
    // 获取章节信息
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    // 查询章节使用的所有资源
    const resources = await this.prisma.resource.findMany({
      where: {
        usedByChapters: {
          some: {
            chapterId: chapterId,
          },
        },
      },
      orderBy: { bundle: 'asc' },
    });

    if (resources.length === 0) {
      throw new NotFoundException(
        `No resources found for chapter: ${chapterId}`,
      );
    }

    // 查询章节 Ink 文件
    const inkFiles = await this.prisma.inkFile.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'asc' },
    });

    // 生成 manifest（附带 ink 信息）
    const manifest = this.generateManifestFromResources(resources);
    const manifestWithInk: any = {
      ...manifest,
      inkFiles: inkFiles.map((ink) => ({
        id: ink.id,
        filename: ink.filename,
        displayName: ink.displayName ?? undefined,
        path: `ink/${ink.filename}`,
        compiledPath: ink.compiledPath ?? undefined,
        isStart: chapter.startInkId ? chapter.startInkId === ink.id : undefined,
      })),
      startInkId: chapter.startInkId ?? null,
      chapterId: chapter.id,
    };

    // 创建 ZIP 包
    const zipBuffer = await this.createBundleZip(
      resources,
      manifestWithInk,
      inkFiles,
    );

    // 生成新的版本号
    const newVersion = (chapter.chapterBundleVersion || 0) + 1;

    // 生成 COS Key
    const cosKey = generateCosKey(
      `chapter-${chapterId}-bundle-v${newVersion}`,
      `chapter-bundle-v${newVersion}.zip`,
    );

    // 上传 ZIP 包到 COS
    const zipUrl = await this.cosService.uploadFile(zipBuffer, cosKey);

    // 生成目录树（仅记录路径）
    const bundleDirTree = {
      manifest: 'manifest.json',
      assets: resources.map((resource) => {
        const fileName = this.getFileNameFromUrl(resource.src, resource.alias);
        return `assets/${resource.bundle}/${fileName}`;
      }),
      ink: inkFiles.map((ink) => `ink/${ink.filename}`),
    };

    // 更新章节的 ZIP 包信息
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: {
        chapterBundleZipUrl: zipUrl,
        chapterBundleVersion: newVersion,
        chapterBundleUrl: zipUrl,
        bundleDirTree: bundleDirTree as any,
      },
    });

    return {
      zipUrl,
      version: newVersion,
    };
  }

  /**
   * 从资源列表生成 manifest
   */
  private generateManifestFromResources(resources: any[]): AssetsManifest {
    // 按 bundle 分组
    const bundleMap = new Map<string, typeof resources>();
    resources.forEach((resource) => {
      if (!bundleMap.has(resource.bundle)) {
        bundleMap.set(resource.bundle, []);
      }
      bundleMap.get(resource.bundle)!.push(resource);
    });

    // 生成 bundles 数组
    const bundles = Array.from(bundleMap.entries()).map(
      ([name, resources]) => ({
        name,
        assets: resources.map((resource) => ({
          alias: resource.alias,
          src: `assets/${resource.bundle}/${this.getFileNameFromUrl(
            resource.src,
            resource.alias,
          )}`,
        })),
      }),
    );

    return { bundles };
  }

  /**
   * 从 URL 中提取文件名，如果没有则使用 alias
   */
  private getFileNameFromUrl(url: string, alias: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || '';
      if (fileName && fileName.includes('.')) {
        return fileName;
      }
    } catch {
      // 如果 URL 解析失败，使用 alias
    }

    // 如果没有文件名，使用 alias 并尝试从原始 URL 获取扩展名
    const extMatch = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1] : 'webp';
    return `${alias}.${ext}`;
  }

  /**
   * 检查 URL 是否是 COS URL
   */
  private isCosUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // 检测腾讯云 COS 的常见域名格式：
      // 1. bucket.cos.region.myqcloud.com
      // 2. bucket.cos-region.myqcloud.com
      // 3. 自定义域名（通常包含 cos 相关标识）
      return (
        hostname.includes('.cos.') ||
        hostname.includes('.cos-') ||
        hostname.includes('.myqcloud.com') ||
        hostname.includes('qcloud.com')
      );
    } catch {
      // 如果不是有效的 URL，返回 false
      return false;
    }
  }

  /**
   * 通过 HTTP 下载文件
   */
  private async downloadFileByHttp(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 创建 ZIP 包
   */
  private async createBundleZip(
    resources: any[],
    manifest: any,
    inkFiles: any[] = [],
  ): Promise<Buffer> {
    const zip = new JSZip();

    // 添加 manifest.json
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // 下载并添加所有资源文件
    const downloadPromises = resources.map(async (resource) => {
      try {
        let fileBuffer: Buffer;

        // 检查是否是 COS URL
        if (this.isCosUrl(resource.src)) {
          // 从 COS 获取文件
          const key = this.cosService.extractKeyFromUrl(resource.src);
          if (!key) {
            throw new Error(`无法从 URL 中提取 COS Key: ${resource.src}`);
          }
          fileBuffer = await this.cosService.getFile(key);
        } else {
          // 非 COS URL，直接通过 HTTP 下载
          console.log(
            `通过 HTTP 下载资源: ${resource.alias} (${resource.src})`,
          );
          fileBuffer = await this.downloadFileByHttp(resource.src);
        }

        const fileName = this.getFileNameFromUrl(resource.src, resource.alias);
        const zipPath = `assets/${resource.bundle}/${fileName}`;

        zip.file(zipPath, fileBuffer);
      } catch (error) {
        console.error(
          `下载资源失败: ${resource.alias} (${resource.src})`,
          error,
        );
        throw new Error(
          `Failed to download resource: ${resource.alias} - ${error}`,
        );
      }
    });

    await Promise.all(downloadPromises);

    // 添加 Ink 文件
    inkFiles.forEach((ink) => {
      const content = ink.content ?? '';
      const zipPath = `ink/${ink.filename}`;
      zip.file(zipPath, content);
      if (ink.compiledPath && ink.compiledPath !== zipPath) {
        zip.file(ink.compiledPath, content);
      }
    });

    // 生成 ZIP 文件
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // 压缩级别 1-9，6 是平衡点
      },
    });

    return zipBuffer;
  }
}
