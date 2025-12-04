import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CosService } from '../common/cos/cos.service';
import {
  CreateResourceDto,
  ResourceResponseDto,
  ResourceQueryDto,
  PaginatedResponse,
  ManifestResponse,
  UserRole,
} from '@lourd-game/shared';
import { AssetsManifest } from '@drincs/pixi-vn';
import { calculateFileMD5, generateCosKey, validateFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../common/utils/file-hash.util';

@Injectable()
export class ResourcesService {
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
    const hash = await calculateFileMD5(file.buffer);

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
        fileType: file.mimetype || file.originalname.split('.').pop()?.toLowerCase(),
        cosKey,
        originalName: file.originalname,
        uploaderId: userId,
      },
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

  async findAll(query: ResourceQueryDto): Promise<PaginatedResponse<ResourceResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

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
        take: limit,
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
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    const bundles = Array.from(bundleMap.entries()).map(([name, resources]) => ({
      name,
      assets: resources.map((resource) => ({
        alias: resource.alias,
        src: resource.src,
      })),
    }));

    const manifest: AssetsManifest = { bundles };

    return { manifest };
  }
}

