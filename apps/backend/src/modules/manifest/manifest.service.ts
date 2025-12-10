import { AssetsManifest } from '@drincs/pixi-vn';
import {
  CreateResourceDto,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
  UpdateResourceDto,
  UserRole,
} from '@lourd-game/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CosService } from '../../common/cos/cos.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ALLOWED_FILE_TYPES,
  calculateFileMD5,
  generateCosKey,
  MAX_FILE_SIZE,
  validateFile,
} from '../../common/utils/file-hash.util';

declare const fetch: any;

@Injectable()
export class ManifestService {
  constructor(
    private prisma: PrismaService,
    private cosService: CosService,
  ) {}

  async create(
    file: Express.Multer.File,
    dto: CreateResourceDto,
    userId: number,
  ): Promise<ResourceResponseDto> {
    // 处理 bundleType，默认为 "chapter"
    const bundleType = dto.bundleType || 'chapter';
    // 验证文件
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: [...ALLOWED_FILE_TYPES],
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 计算文件哈希
    const hash = calculateFileMD5(file.buffer);

    // 检查是否已存在相同哈希的文件
    const existingResource = await this.prisma.resource.findUnique({
      where: { hash },
    });

    if (existingResource) {
      throw new BadRequestException(
        `文件已存在: ${existingResource.originalName || existingResource.alias}`,
      );
    }

    // 检查别名是否已存在
    const existingByAlias = await this.prisma.resource.findFirst({
      where: { alias: dto.alias },
    });

    if (existingByAlias) {
      throw new BadRequestException(`别名 "${dto.alias}" 已存在`);
    }

    // 生成 COS Key
    const cosKey = generateCosKey(hash, file.originalname);

    // 上传到 COS
    const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

    // 创建资源记录
    const resource = await this.prisma.resource.create({
      data: {
        alias: dto.alias,
        src: fileUrl,
        bundle: dto.bundle,
        bundleType: bundleType,
        hash,
        fileSize: file.size,
        fileType:
          file.mimetype || file.originalname.split('.').pop()?.toLowerCase(),
        mimeType: file.mimetype || undefined,
        cosKey,
        originalName: file.originalname,
        uploaderId: userId,
      } as any, // 临时使用 any，直到运行 prisma generate
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      id: resource.id,
      alias: resource.alias,
      src: resource.src,
      bundle: resource.bundle,
      hash: resource.hash,
      fileSize: resource.fileSize,
      fileType: resource.fileType || undefined,
      originalName: resource.originalName || undefined,
      uploaderId: resource.uploaderId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  async findAll(
    query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    // 确保分页参数为数字，避免 Prisma 收到字符串导致验证错误
    const page =
      query.page !== undefined && query.page !== null ? Number(query.page) : 1;
    const limit =
      query.limit !== undefined && query.limit !== null
        ? Number(query.limit)
        : 20;

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 20 : limit;
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};

    if (query.bundle) {
      where.bundle = query.bundle;
    }

    if (query.bundleType) {
      where.bundleType = query.bundleType;
    }

    if (query.search) {
      where.OR = [
        { alias: { contains: query.search, mode: 'insensitive' } },
        { originalName: { contains: query.search, mode: 'insensitive' } },
        { bundle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 如果指定了 usedByProjectId，只查询该项目使用的资源
    if (query.usedByProjectId) {
      where.usedByProjects = {
        some: {
          projectId: Number(query.usedByProjectId),
        },
      };
    }

    // 如果指定了 usedByChapterId，只查询该章节使用的资源
    if (query.usedByChapterId) {
      where.usedByChapters = {
        some: {
          chapterId: Number(query.usedByChapterId),
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: data.map((resource) => ({
        id: resource.id,
        alias: resource.alias,
        src: resource.src,
        bundle: resource.bundle,
        bundleType: (resource as any).bundleType || undefined,
        hash: resource.hash,
        fileSize: resource.fileSize,
        fileType: resource.fileType || undefined,
        originalName: resource.originalName || undefined,
        uploaderId: resource.uploaderId,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * 获取 Bundle 列表（包含统计信息）
   */
  async getBundleList(query: {
    bundleType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const page =
      query.page !== undefined && query.page !== null ? Number(query.page) : 1;
    const limit =
      query.limit !== undefined && query.limit !== null
        ? Number(query.limit)
        : 10;

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 10 : limit;
    const where: any = {};

    if (query.bundleType) {
      where.bundleType = query.bundleType;
    }

    if (query.search) {
      where.OR = [{ bundle: { contains: query.search, mode: 'insensitive' } }];
    }

    // 获取所有资源，按 bundle 分组
    const resources = await this.prisma.resource.findMany({
      where,
      select: {
        bundle: true,
        bundleType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按 bundle 分组并计算统计信息
    const bundleMap = new Map<
      string,
      {
        name: string;
        resourceCount: number;
        bundleType: 'common' | 'chapter' | 'mixed';
        createdAt: Date;
      }
    >();

    resources.forEach((resource) => {
      const bundle = resource.bundle || '未分类';
      const bundleType =
        (resource.bundleType as 'common' | 'chapter') || 'chapter';

      if (!bundleMap.has(bundle)) {
        bundleMap.set(bundle, {
          name: bundle,
          resourceCount: 0,
          bundleType: bundleType,
          createdAt: resource.createdAt,
        });
      }

      const info = bundleMap.get(bundle)!;
      info.resourceCount++;

      // 更新最早创建时间
      if (new Date(resource.createdAt) < new Date(info.createdAt)) {
        info.createdAt = resource.createdAt;
      }

      // 检查 Bundle 类型是否混合
      if (info.bundleType !== bundleType && info.resourceCount > 1) {
        info.bundleType = 'mixed';
      }
    });

    const allBundles = Array.from(bundleMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // 分页
    const skip = (safePage - 1) * safeLimit;
    const bundles = allBundles.slice(skip, skip + safeLimit);

    return {
      data: bundles,
      total: allBundles.length,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(allBundles.length / safeLimit),
    };
  }

  async findOne(id: number): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return {
      id: resource.id,
      alias: resource.alias,
      src: resource.src,
      bundle: resource.bundle,
      bundleType: (resource as any).bundleType || undefined,
      hash: resource.hash,
      fileSize: resource.fileSize,
      fileType: resource.fileType || undefined,
      originalName: resource.originalName || undefined,
      uploaderId: resource.uploaderId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  /**
   * 更新资源元数据（不修改文件本身）
   */
  async update(
    id: number,
    dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        ...(dto.alias !== undefined && { alias: dto.alias }),
        ...(dto.bundle !== undefined && { bundle: dto.bundle }),
        ...(dto.bundleType !== undefined && { bundleType: dto.bundleType }),
        ...(dto.fileType !== undefined && { fileType: dto.fileType }),
        ...(dto.originalName !== undefined && {
          originalName: dto.originalName,
        }),
      } as any,
    });

    return {
      id: updated.id,
      alias: updated.alias,
      src: updated.src,
      bundle: updated.bundle,
      hash: updated.hash,
      fileSize: updated.fileSize,
      fileType: updated.fileType || undefined,
      originalName: updated.originalName || undefined,
      uploaderId: updated.uploaderId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * 替换资源文件（更新文件并更新元数据）
   */
  async replaceFile(
    id: number,
    file: Express.Multer.File,
    dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // 验证文件
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: [...ALLOWED_FILE_TYPES],
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 计算新文件哈希
    const newHash = calculateFileMD5(file.buffer);

    // 如果新文件哈希与旧文件相同，检查是否已存在
    if (newHash !== resource.hash) {
      const existingResource = await this.prisma.resource.findUnique({
        where: { hash: newHash },
      });

      if (existingResource && existingResource.id !== id) {
        throw new BadRequestException(
          `文件已存在: ${existingResource.originalName || existingResource.alias}`,
        );
      }
    }

    // 检查别名是否被其他资源使用
    if (dto.alias && dto.alias !== resource.alias) {
      const existingByAlias = await this.prisma.resource.findFirst({
        where: {
          alias: dto.alias,
          id: { not: id },
        },
      });

      if (existingByAlias) {
        throw new BadRequestException(`别名 "${dto.alias}" 已存在`);
      }
    }

    // 生成新的 COS Key
    const cosKey = generateCosKey(newHash, file.originalname);

    // 上传新文件到 COS
    const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

    // 如果旧文件在 COS 上，尝试删除旧文件
    if (resource.cosKey && resource.cosKey !== cosKey) {
      try {
        await this.cosService.deleteFile(resource.cosKey);
      } catch (error) {
        // 忽略删除失败的错误，不影响更新流程
        console.warn(
          `Failed to delete old file from COS: ${resource.cosKey}`,
          error,
        );
      }
    }

    // 更新资源记录
    const bundleType = dto.bundleType || resource.bundleType || 'chapter';
    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        alias: dto.alias !== undefined ? dto.alias : resource.alias,
        src: fileUrl,
        bundle: dto.bundle !== undefined ? dto.bundle : resource.bundle,
        bundleType: bundleType,
        hash: newHash,
        fileSize: file.size,
        fileType:
          file.mimetype || file.originalname.split('.').pop()?.toLowerCase(),
        mimeType: file.mimetype || undefined,
        cosKey,
        originalName: file.originalname,
      } as any,
    });

    return {
      id: updated.id,
      alias: updated.alias,
      src: updated.src,
      bundle: updated.bundle,
      bundleType: (updated as any).bundleType || undefined,
      hash: updated.hash,
      fileSize: updated.fileSize,
      fileType: updated.fileType || undefined,
      originalName: updated.originalName || undefined,
      uploaderId: updated.uploaderId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * 将资源从当前地址迁移到腾讯云 COS，并更新资源地址
   */
  async migrateToCos(id: number): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    const src = resource.src;
    if (!src) {
      throw new BadRequestException('Resource has no src to migrate');
    }

    let buffer: Buffer;
    let mimeType: string | undefined;

    if (src.startsWith('data:')) {
      // data URL: data:[mime];base64,xxxx
      const match = src.match(/^data:(.*?);base64,(.*)$/);
      if (!match) {
        throw new BadRequestException('Unsupported data URL format');
      }
      mimeType = match[1] || undefined;
      buffer = Buffer.from(match[2], 'base64');
    } else {
      // 远程 URL：通过 fetch 下载
      const response = await fetch(src);
      if (!response || !response.ok) {
        throw new BadRequestException(
          `Failed to download resource from ${src}`,
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      const ct = response.headers?.get
        ? response.headers.get('content-type')
        : undefined;
      mimeType = ct || undefined;
    }

    // 推断文件扩展名
    let ext: string | undefined;
    if (mimeType && mimeType.startsWith('image/')) {
      ext = mimeType.split('/')[1];
    } else if (resource.fileType) {
      ext = resource.fileType.toLowerCase();
    } else {
      const urlWithoutQuery = src.split('?')[0];
      const guessedExt = urlWithoutQuery.split('.').pop();
      if (guessedExt && guessedExt.length <= 10) {
        ext = guessedExt.toLowerCase();
      }
    }

    const baseName =
      resource.originalName ||
      (ext ? `${resource.alias}.${ext}` : resource.alias);

    const hash = resource.hash || calculateFileMD5(buffer);
    const cosKey = generateCosKey(hash, baseName);

    const fileUrl = await this.cosService.uploadFile(buffer, cosKey);

    const resourceWithMimeType = resource as any;
    const updated = await this.prisma.resource.update({
      where: { id: resource.id },
      data: {
        src: fileUrl,
        cosKey,
        fileSize: buffer.length,
        fileType: ext || resource.fileType || mimeType || undefined,
        mimeType: mimeType || resourceWithMimeType.mimeType || undefined,
      } as any, // 临时使用 any，直到运行 prisma generate
    });

    return {
      id: updated.id,
      alias: updated.alias,
      src: updated.src,
      bundle: updated.bundle,
      hash: updated.hash,
      fileSize: updated.fileSize,
      fileType: updated.fileType || undefined,
      originalName: updated.originalName || undefined,
      uploaderId: updated.uploaderId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // 只有管理员可以删除资源
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete resources');
    }

    // 从 COS 删除文件
    if (resource.cosKey) {
      try {
        await this.cosService.deleteFile(resource.cosKey);
      } catch (error) {
        console.warn(`Failed to delete file from COS: ${error}`);
        // 继续删除数据库记录
      }
    }

    // 删除数据库记录
    await this.prisma.resource.delete({
      where: { id },
    });
  }

  async generateManifest(bundleType?: string): Promise<ManifestResponse> {
    const where: any = {};
    if (bundleType) {
      where.bundleType = bundleType;
    }

    const resources = await this.prisma.resource.findMany({
      where,
      orderBy: { bundle: 'asc' },
    });

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
          src: resource.src,
        })),
      }),
    );

    const manifest: AssetsManifest = { bundles };

    return { manifest };
  }

  async generateCommonManifest(projectId: number): Promise<ManifestResponse> {
    // 获取项目的共通资源
    const resources = await this.prisma.resource.findMany({
      where: {
        usedByProjects: {
          some: {
            projectId: projectId,
          },
        },
        bundleType: 'common',
      },
      orderBy: { bundle: 'asc' },
    });

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
          src: resource.src,
        })),
      }),
    );

    const manifest: AssetsManifest = { bundles };

    return { manifest };
  }

  async generateFullManifest(projectId: number): Promise<ManifestResponse> {
    // 获取项目的所有资源（共通 + 章节）
    const resources = await this.prisma.resource.findMany({
      where: {
        usedByProjects: {
          some: {
            projectId: projectId,
          },
        },
      },
      orderBy: { bundle: 'asc' },
    });

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
          src: resource.src,
        })),
      }),
    );

    const manifest: AssetsManifest = { bundles };

    return { manifest };
  }

  async downloadByFileUrl(
    fileUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // 首先尝试从数据库查找资源
    const resource = await this.prisma.resource.findFirst({
      where: { src: fileUrl },
    });

    let mimeType: string | undefined;

    if (resource) {
      // 如果数据库中有记录，使用数据库中的信息
      mimeType = (resource as any).mimeType;
    }

    // 从 COS 获取文件（支持直接通过 URL 获取，不一定要在数据库中）
    const key = this.cosService.extractKeyFromUrl(fileUrl);
    if (!key) {
      throw new BadRequestException(`无法从 URL 中提取 COS Key: ${fileUrl}`);
    }
    const buffer = await this.cosService.getFile(key);

    // 如果没有从数据库获取到 mimeType，根据文件扩展名推断
    if (!mimeType) {
      const urlWithoutQuery = fileUrl.split('?')[0];
      const ext = urlWithoutQuery.split('.').pop()?.toLowerCase();

      // 根据扩展名推断 MIME 类型
      const mimeTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        mp4: 'video/mp4',
        webm: 'video/webm',
        json: 'application/json',
        txt: 'text/plain',
      };

      mimeType = ext ? mimeTypeMap[ext] : undefined;
    }

    // 最后使用默认值
    mimeType = mimeType || 'application/octet-stream';

    return { buffer, mimeType };
  }

  /**
   * 将资源添加到项目
   */
  async addResourceToProject(
    projectId: number,
    resourceId: number,
  ): Promise<void> {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 检查资源是否存在
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found`);
    }

    // 检查是否已存在关联
    const existing = await this.prisma.projectResourceUsage.findUnique({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Resource is already associated with this project',
      );
    }

    // 创建关联
    await this.prisma.projectResourceUsage.create({
      data: {
        projectId,
        resourceId,
      },
    });
  }

  /**
   * 从项目移除资源（不删除资源本身）
   */
  async removeResourceFromProject(
    projectId: number,
    resourceId: number,
  ): Promise<void> {
    const usage = await this.prisma.projectResourceUsage.findUnique({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId,
        },
      },
    });

    if (!usage) {
      throw new NotFoundException(
        'Resource is not associated with this project',
      );
    }

    await this.prisma.projectResourceUsage.delete({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId,
        },
      },
    });
  }

  /**
   * 获取项目使用的所有资源
   */
  async getProjectResources(
    projectId: number,
    query?: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 使用 findAll 方法，传入 usedByProjectId
    return this.findAll({
      ...query,
      usedByProjectId: projectId,
    });
  }

  /**
   * 更新Bundle（批量更新该Bundle下所有资源的bundle和bundleType）
   */
  async updateBundleResources(
    bundleName: string,
    newBundleName?: string,
    newBundleType?: string,
  ): Promise<{ updatedCount: number }> {
    // 检查Bundle是否存在（至少有一个资源使用该Bundle）
    const existingResources = await this.prisma.resource.findMany({
      where: { bundle: bundleName },
      take: 1,
    });

    if (existingResources.length === 0) {
      throw new NotFoundException(
        `Bundle "${bundleName}" not found or has no resources`,
      );
    }

    // 如果提供了新Bundle名称，检查是否已存在同名Bundle（且不是当前Bundle）
    if (newBundleName && newBundleName !== bundleName) {
      const existingBundle = await this.prisma.resource.findFirst({
        where: { bundle: newBundleName },
      });
      if (existingBundle) {
        throw new BadRequestException(
          `Bundle "${newBundleName}" already exists. Please choose a different name.`,
        );
      }
    }

    // 验证 bundleType
    if (
      newBundleType &&
      newBundleType !== 'common' &&
      newBundleType !== 'chapter'
    ) {
      throw new BadRequestException(
        `Invalid bundleType: ${newBundleType}. Must be "common" or "chapter"`,
      );
    }

    // 构建更新数据
    const updateData: any = {};
    if (newBundleName && newBundleName !== bundleName) {
      updateData.bundle = newBundleName;
    }
    if (newBundleType) {
      updateData.bundleType = newBundleType;
    }

    // 如果没有需要更新的内容，直接返回
    if (Object.keys(updateData).length === 0) {
      return { updatedCount: 0 };
    }

    // 使用事务批量更新
    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.resource.updateMany({
        where: { bundle: bundleName },
        data: updateData,
      });

      return updateResult.count;
    });

    return { updatedCount: result };
  }
}
