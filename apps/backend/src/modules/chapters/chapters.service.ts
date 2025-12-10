import { AssetsManifest } from '@drincs/pixi-vn';
import {
  ChapterQueryDto,
  ChapterResponseDto,
  CreateChapterDto,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
  UpdateChapterDto,
} from '@lourd-game/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(
    projectId: number,
    dto: CreateChapterDto,
  ): Promise<ChapterResponseDto> {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        order: dto.order ?? 0,
        requireAd: dto.requireAd ?? false,
        enabled: true,
      },
    });

    return this.toResponseDto(chapter);
  }

  async findAll(
    query: ChapterQueryDto,
  ): Promise<ChapterResponseDto[]> {
    const where: any = {};

    if (query.projectId) {
      where.projectId = Number(query.projectId);
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    const chapters = await this.prisma.chapter.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return chapters.map((chapter) => this.toResponseDto(chapter));
  }

  async findOne(id: number): Promise<ChapterResponseDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return this.toResponseDto(chapter);
  }

  async update(id: number, dto: UpdateChapterDto): Promise<ChapterResponseDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    const updated = await this.prisma.chapter.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        order: dto.order,
        requireAd: dto.requireAd,
        enabled: dto.enabled,
      },
    });

    return this.toResponseDto(updated);
  }

  async remove(id: number): Promise<void> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    await this.prisma.chapter.delete({
      where: { id },
    });
  }

  async addResourceToChapter(
    chapterId: number,
    resourceId: number,
  ): Promise<void> {
    // 检查章节和资源是否存在
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found`);
    }

    // 检查是否已存在关联
    const existingUsage = await this.prisma.chapterResourceUsage.findUnique({
      where: {
        chapterId_resourceId: {
          chapterId: chapterId,
          resourceId: resourceId,
        },
      },
    });

    if (existingUsage) {
      throw new BadRequestException(
        'Resource is already associated with this chapter',
      );
    }

    await this.prisma.chapterResourceUsage.create({
      data: {
        chapterId: chapterId,
        resourceId: resourceId,
      },
    });
  }

  async removeResourceFromChapter(
    chapterId: number,
    resourceId: number,
  ): Promise<void> {
    const usage = await this.prisma.chapterResourceUsage.findUnique({
      where: {
        chapterId_resourceId: {
          chapterId: chapterId,
          resourceId: resourceId,
        },
      },
    });

    if (!usage) {
      throw new NotFoundException(
        'Resource is not associated with this chapter',
      );
    }

    await this.prisma.chapterResourceUsage.delete({
      where: { id: usage.id },
    });
  }

  async getChapterResources(
    chapterId: number,
    query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    const page =
      query.page !== undefined && query.page !== null ? Number(query.page) : 1;
    const limit =
      query.limit !== undefined && query.limit !== null
        ? Number(query.limit)
        : 20;

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 20 : limit;
    const skip = (safePage - 1) * safeLimit;

    const where: any = {
      usedByChapters: {
        some: {
          chapterId: chapterId,
        },
      },
    };

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
        bundleType: resource.bundleType || undefined,
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

  async generateChapterManifest(
    chapterId: number,
  ): Promise<ManifestResponse> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

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

  private toResponseDto(chapter: any): ChapterResponseDto {
    return {
      id: chapter.id,
      projectId: chapter.projectId,
      name: chapter.name,
      description: chapter.description || undefined,
      order: chapter.order,
      enabled: chapter.enabled,
      requireAd: chapter.requireAd,
      chapterBundleZipUrl: chapter.chapterBundleZipUrl ?? undefined,
      chapterBundleVersion: chapter.chapterBundleVersion ?? undefined,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }
}

