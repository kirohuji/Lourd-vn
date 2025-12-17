import {
  CreateProjectDto,
  PaginatedResponse,
  ProjectQueryDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from '@lourd-game/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        enabled: dto.enabled ?? true,
        commonBundle: dto.commonBundle,
      },
    });

    return this.toResponseDto(project);
  }

  async findAll(
    query: ProjectQueryDto,
  ): Promise<PaginatedResponse<ProjectResponseDto>> {
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

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: data.map((p) => this.toResponseDto(p)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: number): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // 加载项目下的章节及资源 / Ink 数量统计
    const chapters = await this.prisma.chapter.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            usedResources: true,
            inkFiles: true,
          },
        },
      },
    });

    return {
      ...this.toResponseDto(project),
      // chapters 字段在当前运行时类型定义中可能尚未同步，这里通过断言绕过编译检查
      chapters: chapters.map((ch) => ({
        id: ch.id,
        name: ch.name,
        description: ch.description ?? undefined,
        order: ch.order,
        enabled: ch.enabled,
        requireAd: ch.requireAd,
        startInkId: ch.startInkId ?? undefined,
        chapterBundleZipUrl: ch.chapterBundleZipUrl ?? undefined,
        chapterBundleVersion: ch.chapterBundleVersion ?? undefined,
        chapterBundleUrl: ch.chapterBundleUrl ?? undefined,
        resourceCount: ch._count.usedResources,
        inkFileCount: ch._count.inkFiles,
      })),
    } as ProjectResponseDto;
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.commonBundle !== undefined && {
          commonBundle: dto.commonBundle,
        }),
      },
    });

    return this.toResponseDto(updated);
  }

  async remove(id: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }

  private toResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description ?? undefined,
      enabled: project.enabled,
      commonBundle: project.commonBundle ?? undefined,
      commonBundleZipUrl: project.commonBundleZipUrl ?? undefined,
      commonBundleVersion: project.commonBundleVersion ?? undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
