import {
  BasePromptResponseDto,
  CharacterPromptResponseDto,
  CreateBasePromptDto,
  CreateCharacterPromptDto,
  CreatePromptTagDto,
  CreatePromptVariantDto,
  PromptImageResponseDto,
  PromptTagResponseDto,
  PromptVariantResponseDto,
  UpdateBasePromptDto,
  UpdateCharacterPromptDto,
  UpdatePromptTagDto,
  UpdatePromptVariantDto,
  VariantTagItem,
} from '@lourd-game/shared';
import {
  BadRequestException,
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

@Injectable()
export class PromptsService {
  constructor(
    private prisma: PrismaService,
    private cosService: CosService,
  ) {}

  // ========== Base Prompt CRUD ==========

  async findAllBasePrompts(): Promise<BasePromptResponseDto[]> {
    const basePrompts = await this.prisma.basePrompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        characterPrompts: {
          include: {
            _count: {
              select: { images: true },
            },
          },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    return basePrompts.map((bp) => ({
      id: bp.id,
      name: bp.name,
      basicPrompt: bp.basicPrompt,
      undesiredContent: bp.undesiredContent || undefined,
      normalizeReferenceStrength: bp.normalizeReferenceStrength || undefined,
      referenceStrength: bp.referenceStrength || undefined,
      informationExtracted: bp.informationExtracted || undefined,
      referenceImageUrl: bp.referenceImageUrl || undefined,
      createdAt: bp.createdAt,
      updatedAt: bp.updatedAt,
      imageCount: bp._count.images,
      characterPrompts: bp.characterPrompts.map((cp) => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        basicPrompt: cp.basicPrompt,
        undesiredContent: cp.undesiredContent || undefined,
        normalizeReferenceStrength: cp.normalizeReferenceStrength || undefined,
        referenceStrength: cp.referenceStrength || undefined,
        informationExtracted: cp.informationExtracted || undefined,
        referenceImageUrl: cp.referenceImageUrl || undefined,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        imageCount: cp._count.images,
      })),
    }));
  }

  async findBasePromptById(id: number): Promise<BasePromptResponseDto> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id },
      include: {
        characterPrompts: {
          include: {
            _count: {
              select: { images: true },
            },
          },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    if (!basePrompt) {
      throw new NotFoundException(`Base Prompt with ID ${id} not found`);
    }

    return {
      id: basePrompt.id,
      name: basePrompt.name,
      basicPrompt: basePrompt.basicPrompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map((cp) => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        basicPrompt: cp.basicPrompt,
        undesiredContent: cp.undesiredContent || undefined,
        normalizeReferenceStrength: cp.normalizeReferenceStrength || undefined,
        referenceStrength: cp.referenceStrength || undefined,
        informationExtracted: cp.informationExtracted || undefined,
        referenceImageUrl: cp.referenceImageUrl || undefined,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        imageCount: cp._count.images,
      })),
    };
  }

  async createBasePrompt(
    dto: CreateBasePromptDto,
  ): Promise<BasePromptResponseDto> {
    const basePrompt = await this.prisma.basePrompt.create({
      data: {
        name: dto.name,
        basicPrompt: dto.basicPrompt,
        undesiredContent: dto.undesiredContent,
        normalizeReferenceStrength: dto.normalizeReferenceStrength || false,
        referenceStrength: dto.referenceStrength,
        informationExtracted: dto.informationExtracted,
        referenceImageUrl: dto.referenceImageUrl,
      },
      include: {
        characterPrompts: {
          include: {
            _count: {
              select: { images: true },
            },
          },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    return {
      id: basePrompt.id,
      name: basePrompt.name,
      basicPrompt: basePrompt.basicPrompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map((cp) => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        basicPrompt: cp.basicPrompt,
        undesiredContent: cp.undesiredContent || undefined,
        normalizeReferenceStrength: cp.normalizeReferenceStrength || undefined,
        referenceStrength: cp.referenceStrength || undefined,
        informationExtracted: cp.informationExtracted || undefined,
        referenceImageUrl: cp.referenceImageUrl || undefined,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        imageCount: cp._count.images,
      })),
    };
  }

  async updateBasePrompt(
    id: number,
    dto: UpdateBasePromptDto,
  ): Promise<BasePromptResponseDto> {
    const existing = await this.prisma.basePrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Base Prompt with ID ${id} not found`);
    }

    const basePrompt = await this.prisma.basePrompt.update({
      where: { id },
      data: {
        name: dto.name,
        basicPrompt:
          dto.basicPrompt !== undefined ? dto.basicPrompt : undefined,
        undesiredContent:
          dto.undesiredContent !== undefined ? dto.undesiredContent : undefined,
        normalizeReferenceStrength: dto.normalizeReferenceStrength,
        referenceStrength: dto.referenceStrength,
        informationExtracted: dto.informationExtracted,
        referenceImageUrl:
          dto.referenceImageUrl !== undefined
            ? dto.referenceImageUrl
            : undefined,
      },
      include: {
        characterPrompts: {
          include: {
            _count: {
              select: { images: true },
            },
          },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    return {
      id: basePrompt.id,
      name: basePrompt.name,
      basicPrompt: basePrompt.basicPrompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map((cp) => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        basicPrompt: cp.basicPrompt,
        undesiredContent: cp.undesiredContent || undefined,
        normalizeReferenceStrength: cp.normalizeReferenceStrength || undefined,
        referenceStrength: cp.referenceStrength || undefined,
        informationExtracted: cp.informationExtracted || undefined,
        referenceImageUrl: cp.referenceImageUrl || undefined,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        imageCount: cp._count.images,
      })),
    };
  }

  async uploadBasePromptReferenceImage(
    id: number,
    file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const existing = await this.prisma.basePrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Base Prompt with ID ${id} not found`);
    }

    // 验证文件
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_FILE_TYPES.filter((type) =>
        ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(type),
      ),
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 计算文件哈希
    const hash = calculateFileMD5(file.buffer);

    // 生成 COS Key
    const cosKey = generateCosKey(hash, file.originalname);

    // 上传到 COS
    const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

    // 更新 Base Prompt 的参考图 URL
    await this.prisma.basePrompt.update({
      where: { id },
      data: {
        referenceImageUrl: fileUrl,
      },
    });

    return { imageUrl: fileUrl };
  }

  async deleteBasePrompt(id: number): Promise<void> {
    const existing = await this.prisma.basePrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Base Prompt with ID ${id} not found`);
    }

    await this.prisma.basePrompt.delete({
      where: { id },
    });
  }

  // ========== Character Prompt CRUD ==========

  async findCharacterPromptsByBasePromptId(
    basePromptId: number,
  ): Promise<CharacterPromptResponseDto[]> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(
        `Base Prompt with ID ${basePromptId} not found`,
      );
    }

    const characterPrompts = await this.prisma.characterPrompt.findMany({
      where: { basePromptId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return characterPrompts.map((cp) => ({
      id: cp.id,
      basePromptId: cp.basePromptId,
      name: cp.name,
      basicPrompt: cp.basicPrompt,
      undesiredContent: cp.undesiredContent || undefined,
      normalizeReferenceStrength: cp.normalizeReferenceStrength || undefined,
      referenceStrength: cp.referenceStrength || undefined,
      informationExtracted: cp.informationExtracted || undefined,
      referenceImageUrl: cp.referenceImageUrl || undefined,
      createdAt: cp.createdAt,
      updatedAt: cp.updatedAt,
      imageCount: cp._count.images,
    }));
  }

  async findCharacterPromptById(
    id: number,
  ): Promise<CharacterPromptResponseDto> {
    const characterPrompt = await this.prisma.characterPrompt.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    if (!characterPrompt) {
      throw new NotFoundException(`Character Prompt with ID ${id} not found`);
    }

    return {
      id: characterPrompt.id,
      basePromptId: characterPrompt.basePromptId,
      name: characterPrompt.name,
      basicPrompt: characterPrompt.basicPrompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        characterPrompt.normalizeReferenceStrength || undefined,
      referenceStrength: characterPrompt.referenceStrength || undefined,
      informationExtracted: characterPrompt.informationExtracted || undefined,
      referenceImageUrl: characterPrompt.referenceImageUrl || undefined,
      createdAt: characterPrompt.createdAt,
      updatedAt: characterPrompt.updatedAt,
      imageCount: characterPrompt._count.images,
    };
  }

  async createCharacterPrompt(
    basePromptId: number,
    dto: CreateCharacterPromptDto,
  ): Promise<CharacterPromptResponseDto> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(
        `Base Prompt with ID ${basePromptId} not found`,
      );
    }

    const characterPrompt = await this.prisma.characterPrompt.create({
      data: {
        basePromptId,
        name: dto.name,
        basicPrompt: dto.basicPrompt,
        undesiredContent: dto.undesiredContent,
        normalizeReferenceStrength: dto.normalizeReferenceStrength || false,
        referenceStrength: dto.referenceStrength,
        informationExtracted: dto.informationExtracted,
        referenceImageUrl: dto.referenceImageUrl,
      },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return {
      id: characterPrompt.id,
      basePromptId: characterPrompt.basePromptId,
      name: characterPrompt.name,
      basicPrompt: characterPrompt.basicPrompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        characterPrompt.normalizeReferenceStrength || undefined,
      referenceStrength: characterPrompt.referenceStrength || undefined,
      informationExtracted: characterPrompt.informationExtracted || undefined,
      referenceImageUrl: characterPrompt.referenceImageUrl || undefined,
      createdAt: characterPrompt.createdAt,
      updatedAt: characterPrompt.updatedAt,
      imageCount: characterPrompt._count.images,
    };
  }

  async updateCharacterPrompt(
    id: number,
    dto: UpdateCharacterPromptDto,
  ): Promise<CharacterPromptResponseDto> {
    const existing = await this.prisma.characterPrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Character Prompt with ID ${id} not found`);
    }

    const characterPrompt = await this.prisma.characterPrompt.update({
      where: { id },
      data: {
        name: dto.name,
        basicPrompt:
          dto.basicPrompt !== undefined ? dto.basicPrompt : undefined,
        undesiredContent:
          dto.undesiredContent !== undefined ? dto.undesiredContent : undefined,
        normalizeReferenceStrength: dto.normalizeReferenceStrength,
        referenceStrength: dto.referenceStrength,
        informationExtracted: dto.informationExtracted,
        referenceImageUrl:
          dto.referenceImageUrl !== undefined
            ? dto.referenceImageUrl
            : undefined,
      },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return {
      id: characterPrompt.id,
      basePromptId: characterPrompt.basePromptId,
      name: characterPrompt.name,
      basicPrompt: characterPrompt.basicPrompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength:
        characterPrompt.normalizeReferenceStrength || undefined,
      referenceStrength: characterPrompt.referenceStrength || undefined,
      informationExtracted: characterPrompt.informationExtracted || undefined,
      referenceImageUrl: characterPrompt.referenceImageUrl || undefined,
      createdAt: characterPrompt.createdAt,
      updatedAt: characterPrompt.updatedAt,
      imageCount: characterPrompt._count.images,
    };
  }

  async uploadReferenceImage(
    id: number,
    file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const existing = await this.prisma.characterPrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Character Prompt with ID ${id} not found`);
    }

    // 验证文件
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_FILE_TYPES.filter((type) =>
        ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(type),
      ),
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 计算文件哈希
    const hash = calculateFileMD5(file.buffer);

    // 生成 COS Key
    const cosKey = generateCosKey(hash, file.originalname);

    // 上传到 COS
    const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

    // 更新 Character Prompt 的参考图 URL
    await this.prisma.characterPrompt.update({
      where: { id },
      data: {
        referenceImageUrl: fileUrl,
      },
    });

    return { imageUrl: fileUrl };
  }

  async deleteCharacterPrompt(id: number): Promise<void> {
    const existing = await this.prisma.characterPrompt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Character Prompt with ID ${id} not found`);
    }

    await this.prisma.characterPrompt.delete({
      where: { id },
    });
  }

  // ========== Prompt Image CRUD ==========

  async findImagesByBasePromptId(
    basePromptId: number,
  ): Promise<PromptImageResponseDto[]> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(
        `Base Prompt with ID ${basePromptId} not found`,
      );
    }

    const images = await this.prisma.promptImage.findMany({
      where: { basePromptId },
      orderBy: { createdAt: 'desc' },
    });

    return images.map((img) => ({
      id: img.id,
      basePromptId: img.basePromptId || undefined,
      characterPromptId: img.characterPromptId || undefined,
      imageUrl: img.imageUrl,
      generatedPrompt: img.generatedPrompt,
      status: img.status as 'uploaded' | 'generated',
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
    }));
  }

  async findImagesByCharacterPromptId(
    characterPromptId: number,
  ): Promise<PromptImageResponseDto[]> {
    const characterPrompt = await this.prisma.characterPrompt.findUnique({
      where: { id: characterPromptId },
      include: {
        basePrompt: true,
      },
    });

    if (!characterPrompt) {
      throw new NotFoundException(
        `Character Prompt with ID ${characterPromptId} not found`,
      );
    }

    const images = await this.prisma.promptImage.findMany({
      where: { characterPromptId },
      orderBy: { createdAt: 'desc' },
    });

    return images.map((img) => ({
      id: img.id,
      basePromptId: img.basePromptId || undefined,
      characterPromptId: img.characterPromptId || undefined,
      variantId: img.variantId || undefined,
      imageUrl: img.imageUrl,
      generatedPrompt: img.generatedPrompt,
      status: img.status as 'uploaded' | 'generated',
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      basePrompt: characterPrompt.basePrompt
        ? {
            basicPrompt: characterPrompt.basePrompt.basicPrompt,
            undesiredContent:
              characterPrompt.basePrompt.undesiredContent || undefined,
          }
        : undefined,
      characterPrompt: {
        basicPrompt: characterPrompt.basicPrompt,
        undesiredContent: characterPrompt.undesiredContent || undefined,
      },
    }));
  }

  async uploadImagesToBasePrompt(
    basePromptId: number,
    files: Express.Multer.File[],
    variantId?: number,
  ): Promise<PromptImageResponseDto[]> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(
        `Base Prompt with ID ${basePromptId} not found`,
      );
    }

    // 验证所有文件
    for (const file of files) {
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_FILE_TYPES.filter((type) =>
          ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(type),
        ),
      });

      if (!validation.valid) {
        throw new BadRequestException(
          `文件 ${file.originalname}: ${validation.error}`,
        );
      }
    }

    // 生成 prompt（使用 Base Prompt 的配置）
    let generatedPrompt = basePrompt.basicPrompt;
    if (basePrompt.undesiredContent) {
      generatedPrompt += `, negative prompt: ${basePrompt.undesiredContent}`;
    }

    // 上传所有文件并创建记录
    const uploadedImages: PromptImageResponseDto[] = [];

    for (const file of files) {
      // 计算文件哈希
      const hash = calculateFileMD5(file.buffer);

      // 生成 COS Key
      const cosKey = generateCosKey(hash, file.originalname);

      // 上传到 COS
      const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

      // 创建图片记录
      const image = await this.prisma.promptImage.create({
        data: {
          basePromptId,
          variantId: variantId || null,
          imageUrl: fileUrl,
          generatedPrompt,
          status: 'uploaded',
        },
      });

      uploadedImages.push({
        id: image.id,
        basePromptId: image.basePromptId || undefined,
        characterPromptId: image.characterPromptId || undefined,
        variantId: image.variantId || undefined,
        imageUrl: image.imageUrl,
        generatedPrompt: image.generatedPrompt,
        status: image.status as 'uploaded' | 'generated',
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        basePrompt: {
          basicPrompt: basePrompt.basicPrompt,
          undesiredContent: basePrompt.undesiredContent || undefined,
        },
        characterPrompt: undefined,
      });
    }

    return uploadedImages;
  }

  async uploadImages(
    characterPromptId: number,
    files: Express.Multer.File[],
    variantId?: number,
  ): Promise<PromptImageResponseDto[]> {
    const characterPrompt = await this.prisma.characterPrompt.findUnique({
      where: { id: characterPromptId },
      include: {
        basePrompt: true,
      },
    });

    if (!characterPrompt) {
      throw new NotFoundException(
        `Character Prompt with ID ${characterPromptId} not found`,
      );
    }

    // 验证所有文件
    for (const file of files) {
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_FILE_TYPES.filter((type) =>
          ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(type),
        ),
      });

      if (!validation.valid) {
        throw new BadRequestException(
          `文件 ${file.originalname}: ${validation.error}`,
        );
      }
    }

    // 生成组合 prompt
    const basePromptText = characterPrompt.basePrompt.basicPrompt;
    const characterPromptText = characterPrompt.basicPrompt;
    const baseUndesired = characterPrompt.basePrompt.undesiredContent || '';
    const characterUndesired = characterPrompt.undesiredContent || '';

    let generatedPrompt = `${basePromptText}, ${characterPromptText}`;
    if (baseUndesired || characterUndesired) {
      const undesiredParts = [baseUndesired, characterUndesired]
        .filter(Boolean)
        .join(', ');
      generatedPrompt += `, negative prompt: ${undesiredParts}`;
    }

    // 上传所有文件并创建记录
    const uploadedImages: PromptImageResponseDto[] = [];

    for (const file of files) {
      // 计算文件哈希
      const hash = calculateFileMD5(file.buffer);

      // 生成 COS Key
      const cosKey = generateCosKey(hash, file.originalname);

      // 上传到 COS
      const fileUrl = await this.cosService.uploadFile(file.buffer, cosKey);

      // 创建图片记录
      const image = await this.prisma.promptImage.create({
        data: {
          characterPromptId,
          variantId: variantId || null,
          imageUrl: fileUrl,
          generatedPrompt,
          status: 'uploaded',
        },
      });

      uploadedImages.push({
        id: image.id,
        basePromptId: image.basePromptId || undefined,
        characterPromptId: image.characterPromptId || undefined,
        variantId: image.variantId || undefined,
        imageUrl: image.imageUrl,
        generatedPrompt: image.generatedPrompt,
        status: image.status as 'uploaded' | 'generated',
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        basePrompt: characterPrompt.basePrompt
          ? {
              basicPrompt: characterPrompt.basePrompt.basicPrompt,
              undesiredContent:
                characterPrompt.basePrompt.undesiredContent || undefined,
            }
          : undefined,
        characterPrompt: {
          basicPrompt: characterPrompt.basicPrompt,
          undesiredContent: characterPrompt.undesiredContent || undefined,
        },
      });
    }

    return uploadedImages;
  }

  async updateImageVariant(
    id: number,
    variantId: number | null,
  ): Promise<PromptImageResponseDto> {
    const existing = await this.prisma.promptImage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Image with ID ${id} not found`);
    }

    // 如果指定了 variantId，验证变体是否存在
    if (variantId !== null) {
      const variant = await this.prisma.promptVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        throw new NotFoundException(
          `Prompt Variant with ID ${variantId} not found`,
        );
      }
      // 验证变体是否属于同一个 BasePrompt 或 CharacterPrompt
      if (
        existing.basePromptId &&
        variant.basePromptId !== existing.basePromptId
      ) {
        throw new BadRequestException('变体必须属于同一个 Base Prompt');
      }
      if (
        existing.characterPromptId &&
        variant.characterPromptId !== existing.characterPromptId
      ) {
        throw new BadRequestException('变体必须属于同一个 Character Prompt');
      }
    }

    const updated = await this.prisma.promptImage.update({
      where: { id },
      data: {
        variantId: variantId,
      },
    });

    // 获取关联的 Prompt 信息
    let basePromptInfo:
      | { basicPrompt: string; undesiredContent?: string }
      | undefined;
    let characterPromptInfo:
      | { basicPrompt: string; undesiredContent?: string }
      | undefined;

    if (existing.basePromptId) {
      const bp = await this.prisma.basePrompt.findUnique({
        where: { id: existing.basePromptId },
        select: {
          basicPrompt: true,
          undesiredContent: true,
        },
      });
      if (bp) {
        basePromptInfo = {
          basicPrompt: bp.basicPrompt,
          undesiredContent: bp.undesiredContent || undefined,
        };
      }
    } else if (existing.characterPromptId) {
      const cp = await this.prisma.characterPrompt.findUnique({
        where: { id: existing.characterPromptId },
        include: {
          basePrompt: {
            select: {
              basicPrompt: true,
              undesiredContent: true,
            },
          },
        },
      });
      if (cp) {
        if (cp.basePrompt) {
          basePromptInfo = {
            basicPrompt: cp.basePrompt.basicPrompt,
            undesiredContent: cp.basePrompt.undesiredContent || undefined,
          };
        }
        characterPromptInfo = {
          basicPrompt: cp.basicPrompt,
          undesiredContent: cp.undesiredContent || undefined,
        };
      }
    }

    return {
      id: updated.id,
      basePromptId: updated.basePromptId || undefined,
      characterPromptId: updated.characterPromptId || undefined,
      variantId: updated.variantId || undefined,
      imageUrl: updated.imageUrl,
      generatedPrompt: updated.generatedPrompt,
      status: updated.status as 'uploaded' | 'generated',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      basePrompt: basePromptInfo,
      characterPrompt: characterPromptInfo,
    };
  }

  async deleteImage(id: number): Promise<void> {
    const existing = await this.prisma.promptImage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Image with ID ${id} not found`);
    }

    // 从 COS 删除文件（如果存在）
    try {
      // 从 URL 中提取 COS key
      const url = new URL(existing.imageUrl);
      const cosKey = url.pathname.startsWith('/')
        ? url.pathname.substring(1)
        : url.pathname;
      await this.cosService.deleteFile(cosKey);
    } catch (error) {
      // 如果删除 COS 文件失败，记录错误但不阻止删除数据库记录
      console.error(`Failed to delete COS file for image ${id}:`, error);
    }

    await this.prisma.promptImage.delete({
      where: { id },
    });
  }

  // ========== Prompt Tag CRUD ==========

  async findAllTags(tagType?: string): Promise<PromptTagResponseDto[]> {
    const where = tagType ? { tagType, enabled: true } : { enabled: true };
    const tags = await this.prisma.promptTag.findMany({
      where,
      orderBy: [{ tagType: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      tagType: tag.tagType,
      content: tag.content,
      description: tag.description || undefined,
      order: tag.order,
      enabled: tag.enabled,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));
  }

  async findTagById(id: number): Promise<PromptTagResponseDto> {
    const tag = await this.prisma.promptTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Prompt Tag with ID ${id} not found`);
    }

    return {
      id: tag.id,
      name: tag.name,
      tagType: tag.tagType,
      content: tag.content,
      description: tag.description || undefined,
      order: tag.order,
      enabled: tag.enabled,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async createTag(dto: CreatePromptTagDto): Promise<PromptTagResponseDto> {
    const tag = await this.prisma.promptTag.create({
      data: {
        name: dto.name,
        tagType: dto.tagType,
        content: dto.content,
        description: dto.description,
        order: dto.order || 0,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      tagType: tag.tagType,
      content: tag.content,
      description: tag.description || undefined,
      order: tag.order,
      enabled: tag.enabled,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async updateTag(
    id: number,
    dto: UpdatePromptTagDto,
  ): Promise<PromptTagResponseDto> {
    const existing = await this.prisma.promptTag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Tag with ID ${id} not found`);
    }

    const tag = await this.prisma.promptTag.update({
      where: { id },
      data: {
        name: dto.name,
        tagType: dto.tagType,
        content: dto.content,
        description: dto.description,
        order: dto.order,
        enabled: dto.enabled,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      tagType: tag.tagType,
      content: tag.content,
      description: tag.description || undefined,
      order: tag.order,
      enabled: tag.enabled,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async deleteTag(id: number): Promise<void> {
    const existing = await this.prisma.promptTag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Tag with ID ${id} not found`);
    }

    await this.prisma.promptTag.delete({
      where: { id },
    });
  }

  // ========== Prompt Variant CRUD ==========

  async findVariantsByPrompt(
    promptId: number,
    type: 'base' | 'character',
  ): Promise<PromptVariantResponseDto[]> {
    const where =
      type === 'base'
        ? { basePromptId: promptId }
        : { characterPromptId: promptId };
    const variants = await this.prisma.promptVariant.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      description: variant.description || undefined,
      isDefault: variant.isDefault,
      basePromptId: variant.basePromptId || undefined,
      characterPromptId: variant.characterPromptId || undefined,
      tagIds: (variant.tagIds as unknown as VariantTagItem[]) || [],
      mergedPrompt: variant.mergedPrompt,
      mergeConfig: (variant.mergeConfig as {
        separator?: string;
        prefix?: string;
        suffix?: string;
      }) || { separator: '\n' },
      order: variant.order,
      enabled: variant.enabled,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));
  }

  async findVariantById(id: number): Promise<PromptVariantResponseDto> {
    const variant = await this.prisma.promptVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new NotFoundException(`Prompt Variant with ID ${id} not found`);
    }

    return {
      id: variant.id,
      name: variant.name,
      description: variant.description || undefined,
      isDefault: variant.isDefault,
      basePromptId: variant.basePromptId || undefined,
      characterPromptId: variant.characterPromptId || undefined,
      tagIds: (variant.tagIds as unknown as VariantTagItem[]) || [],
      mergedPrompt: variant.mergedPrompt,
      mergeConfig: (variant.mergeConfig as {
        separator?: string;
        prefix?: string;
        suffix?: string;
      }) || { separator: '\n' },
      order: variant.order,
      enabled: variant.enabled,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  async createVariant(
    dto: CreatePromptVariantDto,
  ): Promise<PromptVariantResponseDto> {
    // 验证 basePromptId 或 characterPromptId 必须有一个
    if (!dto.basePromptId && !dto.characterPromptId) {
      throw new BadRequestException(
        'Either basePromptId or characterPromptId must be provided',
      );
    }

    // 如果指定了 basePromptId，验证它存在
    if (dto.basePromptId) {
      const basePrompt = await this.prisma.basePrompt.findUnique({
        where: { id: dto.basePromptId },
      });
      if (!basePrompt) {
        throw new NotFoundException(
          `Base Prompt with ID ${dto.basePromptId} not found`,
        );
      }
    }

    // 如果指定了 characterPromptId，验证它存在
    if (dto.characterPromptId) {
      const characterPrompt = await this.prisma.characterPrompt.findUnique({
        where: { id: dto.characterPromptId },
      });
      if (!characterPrompt) {
        throw new NotFoundException(
          `Character Prompt with ID ${dto.characterPromptId} not found`,
        );
      }
    }

    // 获取基础 Prompt
    const prompt = dto.basePromptId
      ? await this.prisma.basePrompt.findUnique({
          where: { id: dto.basePromptId },
        })
      : await this.prisma.characterPrompt.findUnique({
          where: { id: dto.characterPromptId! },
        });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // 合并 Prompt
    const mergedPrompt = await this.mergePrompt(
      (prompt as any).basicPrompt,
      dto.tagIds,
      dto.mergeConfig,
    );

    // 创建变体
    const variant = await this.prisma.promptVariant.create({
      data: {
        name: dto.name,
        description: dto.description,
        basePromptId: dto.basePromptId,
        characterPromptId: dto.characterPromptId,
        tagIds: dto.tagIds as any,
        mergedPrompt,
        mergeConfig: (dto.mergeConfig || { separator: '\n' }) as any,
        order: dto.order || 0,
      },
    });

    return {
      id: variant.id,
      name: variant.name,
      description: variant.description || undefined,
      isDefault: variant.isDefault,
      basePromptId: variant.basePromptId || undefined,
      characterPromptId: variant.characterPromptId || undefined,
      tagIds: (variant.tagIds as unknown as VariantTagItem[]) || [],
      mergedPrompt: variant.mergedPrompt,
      mergeConfig: (variant.mergeConfig as {
        separator?: string;
        prefix?: string;
        suffix?: string;
      }) || { separator: '\n' },
      order: variant.order,
      enabled: variant.enabled,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  async updateVariant(
    id: number,
    dto: UpdatePromptVariantDto,
  ): Promise<PromptVariantResponseDto> {
    const existing = await this.prisma.promptVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Variant with ID ${id} not found`);
    }

    // 如果需要更新标签或合并配置，重新计算 mergedPrompt
    let mergedPrompt = existing.mergedPrompt;
    if (dto.tagIds || dto.mergeConfig) {
      const prompt = existing.basePromptId
        ? await this.prisma.basePrompt.findUnique({
            where: { id: existing.basePromptId },
          })
        : await this.prisma.characterPrompt.findUnique({
            where: { id: existing.characterPromptId! },
          });

      if (prompt) {
        const tagIds =
          dto.tagIds || (existing.tagIds as unknown as VariantTagItem[]);
        const mergeConfig = dto.mergeConfig || existing.mergeConfig;
        mergedPrompt = await this.mergePrompt(
          (prompt as any).basicPrompt,
          tagIds,
          mergeConfig as any,
        );
      }
    }

    const variant = await this.prisma.promptVariant.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        tagIds: dto.tagIds ? (dto.tagIds as any) : undefined,
        mergedPrompt,
        mergeConfig: dto.mergeConfig ? (dto.mergeConfig as any) : undefined,
        order: dto.order,
        enabled: dto.enabled,
      },
    });

    return {
      id: variant.id,
      name: variant.name,
      description: variant.description || undefined,
      isDefault: variant.isDefault,
      basePromptId: variant.basePromptId || undefined,
      characterPromptId: variant.characterPromptId || undefined,
      tagIds: (variant.tagIds as unknown as VariantTagItem[]) || [],
      mergedPrompt: variant.mergedPrompt,
      mergeConfig: (variant.mergeConfig as {
        separator?: string;
        prefix?: string;
        suffix?: string;
      }) || { separator: '\n' },
      order: variant.order,
      enabled: variant.enabled,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  async deleteVariant(id: number): Promise<void> {
    const existing = await this.prisma.promptVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt Variant with ID ${id} not found`);
    }

    // 如果是默认变体，不允许删除
    if (existing.isDefault) {
      throw new BadRequestException('Cannot delete default variant');
    }

    await this.prisma.promptVariant.delete({
      where: { id },
    });
  }

  async setDefaultVariant(id: number): Promise<PromptVariantResponseDto> {
    const variant = await this.prisma.promptVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new NotFoundException(`Prompt Variant with ID ${id} not found`);
    }

    // 取消同一 Prompt 的其他变体的默认状态
    const where = variant.basePromptId
      ? { basePromptId: variant.basePromptId, isDefault: true }
      : { characterPromptId: variant.characterPromptId, isDefault: true };

    await this.prisma.promptVariant.updateMany({
      where,
      data: { isDefault: false },
    });

    // 设置当前变体为默认
    const updated = await this.prisma.promptVariant.update({
      where: { id },
      data: { isDefault: true },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || undefined,
      isDefault: updated.isDefault,
      basePromptId: updated.basePromptId || undefined,
      characterPromptId: updated.characterPromptId || undefined,
      tagIds: (updated.tagIds as unknown as VariantTagItem[]) || [],
      mergedPrompt: updated.mergedPrompt,
      mergeConfig: (updated.mergeConfig as {
        separator?: string;
        prefix?: string;
        suffix?: string;
      }) || { separator: '\n' },
      order: updated.order,
      enabled: updated.enabled,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async mergeVariantPrompt(variantId: number): Promise<string> {
    const variant = await this.prisma.promptVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(
        `Prompt Variant with ID ${variantId} not found`,
      );
    }

    // 获取基础 Prompt
    const prompt = variant.basePromptId
      ? await this.prisma.basePrompt.findUnique({
          where: { id: variant.basePromptId },
        })
      : await this.prisma.characterPrompt.findUnique({
          where: { id: variant.characterPromptId! },
        });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // 合并 Prompt
    const mergedPrompt = await this.mergePrompt(
      (prompt as any).basicPrompt,
      variant.tagIds as unknown as VariantTagItem[],
      variant.mergeConfig as any,
    );

    // 更新变体的 mergedPrompt
    await this.prisma.promptVariant.update({
      where: { id: variantId },
      data: { mergedPrompt },
    });

    return mergedPrompt;
  }

  // 合并 Prompt 的私有方法
  private async mergePrompt(
    basicPrompt: string,
    tagIds: VariantTagItem[],
    mergeConfig?: { separator?: string; prefix?: string; suffix?: string },
  ): Promise<string> {
    // 1. 按 order 排序标签
    const sortedTags = [...tagIds].sort((a, b) => a.order - b.order);

    // 2. 获取标签内容
    const tagContents = await Promise.all(
      sortedTags.map((item) =>
        this.prisma.promptTag.findUnique({ where: { id: item.tagId } }),
      ),
    );

    // 3. 过滤启用的标签
    const enabledTags = tagContents
      .filter((tag) => tag && tag.enabled)
      .map((tag) => tag!.content);

    // 4. 合并
    const separator = mergeConfig?.separator || '\n';
    const parts = [basicPrompt, ...enabledTags].filter(Boolean);
    return parts.join(separator);
  }

  // ========== 图片按变体分组查询 ==========

  async findImagesGroupedByVariant(
    basePromptId?: number,
    characterPromptId?: number,
  ): Promise<{
    variants: Array<{
      id: number;
      name: string;
      isDefault: boolean;
      imageCount: number;
      images: PromptImageResponseDto[];
    }>;
    uncategorized: {
      imageCount: number;
      images: PromptImageResponseDto[];
    };
  }> {
    // 确定查询条件
    const where: any = {};
    if (basePromptId) {
      where.basePromptId = basePromptId;
    } else if (characterPromptId) {
      where.characterPromptId = characterPromptId;
    } else {
      throw new BadRequestException(
        'Either basePromptId or characterPromptId must be provided',
      );
    }

    // 获取所有变体
    const variantWhere = basePromptId
      ? { basePromptId }
      : { characterPromptId };
    const variants = await this.prisma.promptVariant.findMany({
      where: variantWhere,
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    });

    // 获取所有图片，同时获取关联的 Prompt 信息
    const allImages = await this.prisma.promptImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        basePrompt: basePromptId
          ? {
              select: {
                basicPrompt: true,
                undesiredContent: true,
              },
            }
          : false,
        characterPrompt: characterPromptId
          ? {
              include: {
                basePrompt: {
                  select: {
                    basicPrompt: true,
                    undesiredContent: true,
                  },
                },
              },
            }
          : false,
      },
    });

    // 按变体分组
    const variantGroups = variants.map((variant) => {
      const images = allImages
        .filter((img) => img.variantId === variant.id)
        .map((img) => {
          const result: any = {
            id: img.id,
            basePromptId: img.basePromptId || undefined,
            characterPromptId: img.characterPromptId || undefined,
            variantId: img.variantId || undefined,
            imageUrl: img.imageUrl,
            generatedPrompt: img.generatedPrompt,
            status: img.status as 'uploaded' | 'generated',
            createdAt: img.createdAt,
            updatedAt: img.updatedAt,
          };

          // 添加 basePrompt 信息
          if (basePromptId && (img as any).basePrompt) {
            result.basePrompt = {
              basicPrompt: (img as any).basePrompt.basicPrompt,
              undesiredContent:
                (img as any).basePrompt.undesiredContent || undefined,
            };
          } else if (
            characterPromptId &&
            (img as any).characterPrompt?.basePrompt
          ) {
            result.basePrompt = {
              basicPrompt: (img as any).characterPrompt.basePrompt.basicPrompt,
              undesiredContent:
                (img as any).characterPrompt.basePrompt.undesiredContent ||
                undefined,
            };
          }

          // 添加 characterPrompt 信息
          if (characterPromptId && (img as any).characterPrompt) {
            result.characterPrompt = {
              basicPrompt: (img as any).characterPrompt.basicPrompt,
              undesiredContent:
                (img as any).characterPrompt.undesiredContent || undefined,
            };
          }

          return result;
        });

      return {
        id: variant.id,
        name: variant.name,
        isDefault: variant.isDefault,
        imageCount: images.length,
        images,
      };
    });

    // 未分类的图片（没有 variantId）
    const uncategorizedImages = allImages
      .filter((img) => !img.variantId)
      .map((img) => {
        const result: any = {
          id: img.id,
          basePromptId: img.basePromptId || undefined,
          characterPromptId: img.characterPromptId || undefined,
          variantId: img.variantId || undefined,
          imageUrl: img.imageUrl,
          generatedPrompt: img.generatedPrompt,
          status: img.status as 'uploaded' | 'generated',
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        };

        // 添加 basePrompt 信息
        if (basePromptId && (img as any).basePrompt) {
          result.basePrompt = {
            basicPrompt: (img as any).basePrompt.basicPrompt,
            undesiredContent:
              (img as any).basePrompt.undesiredContent || undefined,
          };
        } else if (
          characterPromptId &&
          (img as any).characterPrompt?.basePrompt
        ) {
          result.basePrompt = {
            basicPrompt: (img as any).characterPrompt.basePrompt.basicPrompt,
            undesiredContent:
              (img as any).characterPrompt.basePrompt.undesiredContent ||
              undefined,
          };
        }

        // 添加 characterPrompt 信息
        if (characterPromptId && (img as any).characterPrompt) {
          result.characterPrompt = {
            basicPrompt: (img as any).characterPrompt.basicPrompt,
            undesiredContent:
              (img as any).characterPrompt.undesiredContent || undefined,
          };
        }

        return result;
      });

    return {
      variants: variantGroups,
      uncategorized: {
        imageCount: uncategorizedImages.length,
        images: uncategorizedImages,
      },
    };
  }
}
