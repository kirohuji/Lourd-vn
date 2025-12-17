import { AssetsManifest } from '@drincs/pixi-vn';
import {
  ChapterQueryDto,
  ChapterResponseDto,
  CreateChapterDto,
  CreateInkFileDto,
  InkFile,
  InkFileSummary,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
  UpdateChapterDto,
  UpdateInkFileDto,
} from '@lourd-game/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import path from 'path';
// Use compiler subpath to access inkjs compiler (root build lacks constructor export)
import { Compiler } from 'inkjs/compiler/Compiler';
import { CompilerOptions } from 'inkjs/compiler/CompilerOptions';
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
        startInkId: dto.startInkId,
        chapterBundleUrl: dto.chapterBundleUrl,
        bundleDirTree: dto.bundleDirTree as any,
        enabled: true,
      },
      include: { inkFiles: true },
    });

    return this.toResponseDto(chapter);
  }

  async findAll(query: ChapterQueryDto): Promise<ChapterResponseDto[]> {
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
      include: { inkFiles: true, startInk: true },
    });

    return chapters.map((chapter) => this.toResponseDto(chapter));
  }

  async findOne(id: number): Promise<ChapterResponseDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { inkFiles: true, startInk: true },
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
        startInkId: dto.startInkId,
        chapterBundleUrl: dto.chapterBundleUrl,
        bundleDirTree: dto.bundleDirTree as any,
      },
      include: { inkFiles: true, startInk: true },
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

  async generateChapterManifest(chapterId: number): Promise<ManifestResponse> {
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
      chapterBundleUrl: chapter.chapterBundleUrl ?? undefined,
      bundleDirTree: chapter.bundleDirTree ?? undefined,
      startInkId: chapter.startInkId ?? undefined,
      inkFiles: (chapter.inkFiles || []).map((ink: any) =>
        this.toInkFileSummary(ink, chapter.startInkId),
      ),
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  private toInkFileSummary(ink: any, startInkId?: number): InkFileSummary {
    return {
      id: ink.id,
      filename: ink.filename,
      displayName: ink.displayName ?? undefined,
      isStart: startInkId ? startInkId === ink.id : undefined,
      compiledPath: ink.compiledPath ?? undefined,
    };
  }

  // Ink 文件 CRUD
  async listInkFiles(chapterId: number): Promise<InkFile[]> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }
    const files = await this.prisma.inkFile.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'asc' },
    });
    return files.map((f) =>
      this.toInkFileDto(f, chapter.startInkId ?? undefined),
    );
  }

  async getInkFile(chapterId: number, inkId: number): Promise<InkFile> {
    const ink = await this.prisma.inkFile.findFirst({
      where: { id: inkId, chapterId },
    });
    if (!ink) {
      throw new NotFoundException('Ink file not found in this chapter');
    }
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    return this.toInkFileDto(ink, chapter?.startInkId ?? undefined);
  }

  async createInkFile(
    chapterId: number,
    dto: CreateInkFileDto,
  ): Promise<InkFile> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }
    const exists = await this.prisma.inkFile.findFirst({
      where: { chapterId, filename: dto.filename },
    });
    if (exists) {
      throw new BadRequestException('Ink filename already exists in chapter');
    }
    const ink = await this.prisma.inkFile.create({
      data: {
        chapterId,
        filename: dto.filename,
        displayName: dto.displayName,
        content: dto.content,
      },
    });
    return this.toInkFileDto(ink, chapter.startInkId ?? undefined);
  }

  async updateInkFile(
    chapterId: number,
    inkId: number,
    dto: UpdateInkFileDto,
  ): Promise<InkFile> {
    const ink = await this.prisma.inkFile.findFirst({
      where: { id: inkId, chapterId },
    });
    if (!ink) {
      throw new NotFoundException('Ink file not found in this chapter');
    }
    if (dto.filename) {
      const dup = await this.prisma.inkFile.findFirst({
        where: {
          chapterId,
          filename: dto.filename,
          NOT: { id: inkId },
        },
      });
      if (dup) {
        throw new BadRequestException('Ink filename already exists in chapter');
      }
    }
    const updated = await this.prisma.inkFile.update({
      where: { id: inkId },
      data: {
        filename: dto.filename,
        displayName: dto.displayName,
        content: dto.content,
        compiledPath: dto.compiledPath,
      },
    });

    // 更新 startInkId
    if (dto.isStart !== undefined) {
      await this.prisma.chapter.update({
        where: { id: chapterId },
        data: { startInkId: dto.isStart ? inkId : null },
      });
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    return this.toInkFileDto(updated, chapter?.startInkId ?? undefined);
  }

  async deleteInkFile(chapterId: number, inkId: number): Promise<void> {
    const ink = await this.prisma.inkFile.findFirst({
      where: { id: inkId, chapterId },
    });
    if (!ink) {
      throw new NotFoundException('Ink file not found in this chapter');
    }
    await this.prisma.inkFile.delete({ where: { id: inkId } });

    // 如果删除的是 startInk，清空引用
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: {
        startInkId:
          inkId ===
          (
            await this.prisma.chapter.findUnique({
              where: { id: chapterId },
              select: { startInkId: true },
            })
          )?.startInkId
            ? null
            : undefined,
      },
    });
  }

  private toInkFileDto(ink: any, startInkId?: number): InkFile {
    return {
      id: ink.id,
      chapterId: ink.chapterId,
      filename: ink.filename,
      displayName: ink.displayName ?? undefined,
      content: ink.content ?? undefined,
      compiledPath: ink.compiledPath ?? undefined,
      isStart: startInkId ? startInkId === ink.id : undefined,
      createdAt: ink.createdAt,
      updatedAt: ink.updatedAt,
    };
  }

  async compileInkFile(
    chapterId: number,
    inkId: number,
  ): Promise<{ compiledContent: string }> {
    const [ink, allInkFiles] = await Promise.all([
      this.prisma.inkFile.findFirst({
        where: { id: inkId, chapterId },
      }),
      this.prisma.inkFile.findMany({ where: { chapterId } }),
    ]);
    if (!ink) {
      throw new NotFoundException('Ink file not found in this chapter');
    }

    const source = ink.content ?? '';
    // Preload other ink files so INCLUDE directives can resolve locally
    const inkMap = new Map<string, string>();
    allInkFiles.forEach((f) => {
      if (!f.filename) {
        return;
      }
      const normalized = f.filename.trim();
      const withExt = normalized.endsWith('.ink')
        ? normalized
        : `${normalized}.ink`;
      const withoutExt = normalized.endsWith('.ink')
        ? normalized.slice(0, -4)
        : normalized;
      inkMap.set(normalized, f.content ?? '');
      inkMap.set(withExt, f.content ?? '');
      inkMap.set(withoutExt, f.content ?? '');
    });
    const availableKnots = Array.from(inkMap.entries()).flatMap(
      ([fileName, content]) => {
        if (!content) return [];
        const matches = Array.from(
          content.matchAll(/^={2,3}\s*([^\s=][^=]*)\s*=*\s*$/gm),
        );
        return matches.map((m) => `${fileName}:${m[1].trim()}`);
      },
    );
    // fullSource will be built below (after expanding INCLUDEs and loading optional globals)
    let fullSource = '';
    let compiler: Compiler | undefined;
    try {
      const normalizeFilename = (filename: string) => {
        const trimmed = filename.trim();
        if (trimmed.startsWith('./')) {
          return trimmed.slice(2);
        }
        return trimmed;
      };

      const loadInkContent = (filename: string): string => {
        const key = normalizeFilename(filename);
        const direct = inkMap.get(key);
        if (direct !== undefined) return direct;
        const withExt = key.endsWith('.ink') ? key : `${key}.ink`;
        const withoutExt = key.endsWith('.ink') ? key.slice(0, -4) : key;
        const byWithExt = inkMap.get(withExt);
        if (byWithExt !== undefined) return byWithExt;
        const byWithoutExt = inkMap.get(withoutExt);
        if (byWithoutExt !== undefined) return byWithoutExt;
        const available = Array.from(inkMap.keys()).join(', ');
        throw new Error(
          `Included Ink file "${filename}" not found. Available: [${available}]`,
        );
      };

      // Manually expand INCLUDE directives so we don't rely on inkjs FileHandler semantics
      const expandIncludes = (content: string, seen: Set<string>): string => {
        const lines = content.split(/\r?\n/);
        const expandedLines: string[] = [];
        for (const line of lines) {
          const match = line.match(/^\s*INCLUDE\s+(.+?)\s*$/);
          if (match) {
            let includeName = match[1].trim();
            // strip optional quotes
            if (
              (includeName.startsWith('"') && includeName.endsWith('"')) ||
              (includeName.startsWith("'") && includeName.endsWith("'"))
            ) {
              includeName = includeName.slice(1, -1);
            }
            const key = normalizeFilename(includeName);
            if (seen.has(key)) {
              // prevent infinite recursion on circular includes
              continue;
            }
            seen.add(key);
            const includedContent = loadInkContent(includeName);
            expandedLines.push(expandIncludes(includedContent, seen));
          } else {
            expandedLines.push(line);
          }
        }
        return expandedLines.join('\n');
      };
      // Expand INCLUDEs starting from current ink source
      const expandedSource = expandIncludes(source, new Set<string>());

      let globalPrelude =
        inkMap.get('globals.ink') ??
        inkMap.get('global.ink') ??
        inkMap.get('__globals__.ink') ??
        null;
      // Fallback: allow server-side global ink file that is not part of chapter bundle
      if (!globalPrelude && process.env.INK_GLOBAL_FILE) {
        try {
          const abs = path.resolve(process.cwd(), process.env.INK_GLOBAL_FILE);
          globalPrelude = await readFile(abs, 'utf8');
        } catch {
          // surface a clear message so caller knows why compile failed
          throw new BadRequestException(
            `Failed to load INK_GLOBAL_FILE: ${process.env.INK_GLOBAL_FILE}`,
          );
        }
      }
      fullSource = [globalPrelude, expandedSource]
        .filter((s): s is string => !!s && s.trim().length > 0)
        .join('\n\n');

      // Provide a minimal fileHandler; in theory INCLUDEs are already expanded,
      // but this keeps inkjs from complaining when it encounters filenames.
      const fileHandler = {
        ResolveInkFilename: (filename: string) => normalizeFilename(filename),
        LoadInkFileContents: (filename: string) => loadInkContent(filename),
      };

      const options = new CompilerOptions(
        ink.filename ?? null,
        undefined,
        undefined,
        null,
        fileHandler,
      );
      compiler = new Compiler(fullSource, options);
      const story = compiler.Compile();
      if (compiler.errors?.length) {
        // Compiler sometimes aggregates errors without throwing; surface them
        throw new Error(compiler.errors.join('\n'));
      }
      const compiledContent = JSON.stringify(story.ToJson(), null, 2);

      const compiledPath = `ink/${ink.filename}.json`;
      await this.prisma.inkFile.update({
        where: { id: inkId },
        data: { compiledPath },
      });

      return { compiledContent };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const errors = compiler?.errors ?? [];
      const warnings = compiler?.warnings ?? [];
      const availableInkFiles = Array.from(inkMap.keys());
      const includeDebug = {
        inkId,
        filename: ink.filename,
        availableInkFiles,
        availableKnots,
        // fullSourcePreview: (() => {
        //   try {
        //     return fullSource.slice(0, 5000);
        //   } catch {
        //     return undefined;
        //   }
        // })(),
      };
      throw new BadRequestException({
        message: `Ink compile failed: ${msg}`,
        errors,
        warnings,
        availableInkFiles,
        availableKnots,
        includeDebug,
      });
    }
  }
}
