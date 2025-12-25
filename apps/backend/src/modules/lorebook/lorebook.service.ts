import {
  CreateLoreBookCategoryDto,
  CreateLoreBookEntryDto,
  LoreBookCategoryResponseDto,
  LoreBookEntryResponseDto,
  LoreBookSettingsResponseDto,
  UpdateLoreBookCategoryDto,
  UpdateLoreBookEntryDto,
  UpdateLoreBookSettingsDto,
} from '@lourd-game/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LoreBookService {
  constructor(private prisma: PrismaService) {}

  // ========== Entry CRUD ==========

  async findAllEntries(categoryId?: string): Promise<LoreBookEntryResponseDto[]> {
    const where = categoryId ? { categoryId } : {};
    const entries = await this.prisma.loreBookEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return entries.map(entry => this.mapEntryToDto(entry));
  }

  async findEntryById(id: string): Promise<LoreBookEntryResponseDto> {
    const entry = await this.prisma.loreBookEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`LoreBook Entry with ID ${id} not found`);
    }

    return this.mapEntryToDto(entry);
  }

  async createEntry(dto: CreateLoreBookEntryDto): Promise<LoreBookEntryResponseDto> {
    // 设置默认值
    const defaultContextConfig = {
      prefix: '',
      suffix: '\n',
      tokenBudget: 1,
      reservedTokens: 0,
      budgetPriority: 400,
      trimDirection: 'trimBottom' as const,
      insertionType: 'newline' as const,
      maximumTrimType: 'sentence' as const,
      insertionPosition: -1,
      ...dto.contextConfig,
    };

    const defaultLoreBiasGroups = dto.loreBiasGroups || [
      {
        phrases: [],
        ensureSequenceFinish: false,
        generateOnce: true,
        bias: 0,
        enabled: true,
        whenInactive: false,
      },
    ];

    const entry = await this.prisma.loreBookEntry.create({
      data: {
        text: dto.text,
        displayName: dto.displayName,
        keys: dto.keys || [],
        searchRange: dto.searchRange ?? 1000,
        enabled: dto.enabled ?? true,
        forceActivation: dto.forceActivation ?? false,
        keyRelative: dto.keyRelative ?? false,
        nonStoryActivatable: dto.nonStoryActivatable ?? false,
        hidden: dto.hidden ?? false,
        categoryId: dto.categoryId || null,
        contextConfig: defaultContextConfig as any,
        loreBiasGroups: defaultLoreBiasGroups as any,
        advancedConditions: (dto.advancedConditions || []) as any,
        lastUpdatedAt: BigInt(dto.lastUpdatedAt || Date.now()),
      },
    });

    return this.mapEntryToDto(entry);
  }

  async updateEntry(
    id: string,
    dto: UpdateLoreBookEntryDto,
  ): Promise<LoreBookEntryResponseDto> {
    const existing = await this.prisma.loreBookEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LoreBook Entry with ID ${id} not found`);
    }

    // 合并 contextConfig
    const contextConfig = dto.contextConfig
      ? { ...(existing.contextConfig as any), ...dto.contextConfig }
      : existing.contextConfig;

    const entry = await this.prisma.loreBookEntry.update({
      where: { id },
      data: {
        text: dto.text,
        displayName: dto.displayName,
        keys: dto.keys,
        searchRange: dto.searchRange,
        enabled: dto.enabled,
        forceActivation: dto.forceActivation,
        keyRelative: dto.keyRelative,
        nonStoryActivatable: dto.nonStoryActivatable,
        hidden: dto.hidden,
        categoryId: dto.categoryId === null ? null : dto.categoryId,
        contextConfig,
        loreBiasGroups: dto.loreBiasGroups as any,
        advancedConditions: dto.advancedConditions as any,
        lastUpdatedAt: dto.lastUpdatedAt ? BigInt(dto.lastUpdatedAt) : undefined,
      },
    });

    return this.mapEntryToDto(entry);
  }

  async deleteEntry(id: string): Promise<void> {
    const entry = await this.prisma.loreBookEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`LoreBook Entry with ID ${id} not found`);
    }

    await this.prisma.loreBookEntry.delete({
      where: { id },
    });
  }

  // ========== Category CRUD ==========

  async findAllCategories(): Promise<LoreBookCategoryResponseDto[]> {
    const categories = await this.prisma.loreBookCategory.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        entries: true,
      },
    });

    return categories.map(category => this.mapCategoryToDto(category));
  }

  async findCategoryById(id: string): Promise<LoreBookCategoryResponseDto> {
    const category = await this.prisma.loreBookCategory.findUnique({
      where: { id },
      include: {
        entries: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`LoreBook Category with ID ${id} not found`);
    }

    return this.mapCategoryToDto(category);
  }

  async createCategory(
    dto: CreateLoreBookCategoryDto,
  ): Promise<LoreBookCategoryResponseDto> {
    const category = await this.prisma.loreBookCategory.create({
      data: {
        name: dto.name,
        enabled: dto.enabled ?? true,
        createSubcontext: dto.createSubcontext ?? false,
        useCategoryDefaults: dto.useCategoryDefaults ?? false,
        open: dto.open ?? false,
        subcontextSettings: dto.subcontextSettings ? (dto.subcontextSettings as any) : Prisma.DbNull,
        categoryDefaults: dto.categoryDefaults ? (dto.categoryDefaults as any) : Prisma.DbNull,
        categoryBiasGroups: (dto.categoryBiasGroups || []) as any,
        settings: dto.settings || {},
        order: dto.order || [],
      },
    });

    return this.mapCategoryToDto(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateLoreBookCategoryDto,
  ): Promise<LoreBookCategoryResponseDto> {
    const existing = await this.prisma.loreBookCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`LoreBook Category with ID ${id} not found`);
    }

    const category = await this.prisma.loreBookCategory.update({
      where: { id },
      data: {
        name: dto.name,
        enabled: dto.enabled,
        createSubcontext: dto.createSubcontext,
        useCategoryDefaults: dto.useCategoryDefaults,
        open: dto.open,
        subcontextSettings: dto.subcontextSettings === null ? Prisma.DbNull : (dto.subcontextSettings as any),
        categoryDefaults: dto.categoryDefaults === null ? Prisma.DbNull : (dto.categoryDefaults as any),
        categoryBiasGroups: dto.categoryBiasGroups as any,
        settings: dto.settings,
        order: dto.order,
      },
    });

    return this.mapCategoryToDto(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.prisma.loreBookCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`LoreBook Category with ID ${id} not found`);
    }

    // 删除关联的 entries
    await this.prisma.loreBookEntry.deleteMany({
      where: { categoryId: id },
    });

    await this.prisma.loreBookCategory.delete({
      where: { id },
    });
  }

  // ========== Settings ==========

  async getSettings(): Promise<LoreBookSettingsResponseDto> {
    let settings = await this.prisma.loreBookSettings.findFirst();

    if (!settings) {
      // 创建默认设置
      settings = await this.prisma.loreBookSettings.create({
        data: {
          lorebookVersion: 6,
          orderByKeyLocations: false,
          order: [],
          settings: {},
        },
      });
    }

    return {
      id: settings.id,
      lorebookVersion: settings.lorebookVersion,
      orderByKeyLocations: settings.orderByKeyLocations,
      order: settings.order as string[],
      settings: settings.settings as Record<string, any>,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(
    dto: UpdateLoreBookSettingsDto,
  ): Promise<LoreBookSettingsResponseDto> {
    let settings = await this.prisma.loreBookSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.loreBookSettings.create({
        data: {
          lorebookVersion: dto.lorebookVersion ?? 6,
          orderByKeyLocations: dto.orderByKeyLocations ?? false,
          order: dto.order || [],
          settings: dto.settings || {},
        },
      });
    } else {
      settings = await this.prisma.loreBookSettings.update({
        where: { id: settings.id },
        data: {
          lorebookVersion: dto.lorebookVersion,
          orderByKeyLocations: dto.orderByKeyLocations,
          order: dto.order,
          settings: dto.settings,
        },
      });
    }

    return {
      id: settings.id,
      lorebookVersion: settings.lorebookVersion,
      orderByKeyLocations: settings.orderByKeyLocations,
      order: settings.order as string[],
      settings: settings.settings as Record<string, any>,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  // ========== Helper Methods ==========

  private mapEntryToDto(entry: any): LoreBookEntryResponseDto {
    return {
      id: entry.id,
      text: entry.text,
      displayName: entry.displayName,
      keys: entry.keys as string[],
      searchRange: entry.searchRange,
      enabled: entry.enabled,
      forceActivation: entry.forceActivation,
      keyRelative: entry.keyRelative,
      nonStoryActivatable: entry.nonStoryActivatable,
      hidden: entry.hidden,
      categoryId: entry.categoryId,
      contextConfig: entry.contextConfig as any,
      loreBiasGroups: entry.loreBiasGroups as any[],
      advancedConditions: entry.advancedConditions as any[],
      lastUpdatedAt: Number(entry.lastUpdatedAt),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private mapCategoryToDto(category: any): LoreBookCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      enabled: category.enabled,
      createSubcontext: category.createSubcontext,
      useCategoryDefaults: category.useCategoryDefaults,
      open: category.open,
      subcontextSettings: category.subcontextSettings as any,
      categoryDefaults: category.categoryDefaults as any,
      categoryBiasGroups: category.categoryBiasGroups as any[],
      settings: category.settings as Record<string, any>,
      order: category.order as string[],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

