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

    if (query.search) {
      where.OR = [
        { alias: { contains: query.search, mode: 'insensitive' } },
        { originalName: { contains: query.search, mode: 'insensitive' } },
        { bundle: { contains: query.search, mode: 'insensitive' } },
      ];
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
        ...(dto.fileType !== undefined && { fileType: dto.fileType }),
        ...(dto.originalName !== undefined && {
          originalName: dto.originalName,
        }),
      },
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

  async generateManifest(): Promise<ManifestResponse> {
    const resources = await this.prisma.resource.findMany({
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
}
