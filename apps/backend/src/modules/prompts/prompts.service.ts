import {
  BasePromptResponseDto,
  CharacterPromptResponseDto,
  CreateBasePromptDto,
  CreateCharacterPromptDto,
  PromptImageResponseDto,
  UpdateBasePromptDto,
  UpdateCharacterPromptDto,
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

    return basePrompts.map(bp => ({
      id: bp.id,
      name: bp.name,
      prompt: bp.prompt,
      undesiredContent: bp.undesiredContent || undefined,
      normalizeReferenceStrength: bp.normalizeReferenceStrength || undefined,
      referenceStrength: bp.referenceStrength || undefined,
      informationExtracted: bp.informationExtracted || undefined,
      referenceImageUrl: bp.referenceImageUrl || undefined,
      createdAt: bp.createdAt,
      updatedAt: bp.updatedAt,
      imageCount: bp._count.images,
      characterPrompts: bp.characterPrompts.map(cp => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        prompt: cp.prompt,
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
      prompt: basePrompt.prompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength: basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map(cp => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        prompt: cp.prompt,
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

  async createBasePrompt(dto: CreateBasePromptDto): Promise<BasePromptResponseDto> {
    const basePrompt = await this.prisma.basePrompt.create({
      data: {
        name: dto.name,
        prompt: dto.prompt,
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
      prompt: basePrompt.prompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength: basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map(cp => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        prompt: cp.prompt,
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
        prompt: dto.prompt,
        undesiredContent: dto.undesiredContent,
        normalizeReferenceStrength: dto.normalizeReferenceStrength,
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
      prompt: basePrompt.prompt,
      undesiredContent: basePrompt.undesiredContent || undefined,
      normalizeReferenceStrength: basePrompt.normalizeReferenceStrength || undefined,
      referenceStrength: basePrompt.referenceStrength || undefined,
      informationExtracted: basePrompt.informationExtracted || undefined,
      referenceImageUrl: basePrompt.referenceImageUrl || undefined,
      createdAt: basePrompt.createdAt,
      updatedAt: basePrompt.updatedAt,
      imageCount: basePrompt._count.images,
      characterPrompts: basePrompt.characterPrompts.map(cp => ({
        id: cp.id,
        basePromptId: cp.basePromptId,
        name: cp.name,
        prompt: cp.prompt,
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
      allowedTypes: ALLOWED_FILE_TYPES.filter(type =>
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
      throw new NotFoundException(`Base Prompt with ID ${basePromptId} not found`);
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

    return characterPrompts.map(cp => ({
      id: cp.id,
      basePromptId: cp.basePromptId,
      name: cp.name,
      prompt: cp.prompt,
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

  async findCharacterPromptById(id: number): Promise<CharacterPromptResponseDto> {
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
      prompt: characterPrompt.prompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength: characterPrompt.normalizeReferenceStrength || undefined,
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
      throw new NotFoundException(`Base Prompt with ID ${basePromptId} not found`);
    }

    const characterPrompt = await this.prisma.characterPrompt.create({
      data: {
        basePromptId,
        name: dto.name,
        prompt: dto.prompt,
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
      prompt: characterPrompt.prompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength: characterPrompt.normalizeReferenceStrength || undefined,
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
        prompt: dto.prompt,
        undesiredContent: dto.undesiredContent,
        normalizeReferenceStrength: dto.normalizeReferenceStrength,
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
      prompt: characterPrompt.prompt,
      undesiredContent: characterPrompt.undesiredContent || undefined,
      normalizeReferenceStrength: characterPrompt.normalizeReferenceStrength || undefined,
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
      allowedTypes: ALLOWED_FILE_TYPES.filter(type =>
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

  async findImagesByBasePromptId(basePromptId: number): Promise<PromptImageResponseDto[]> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(`Base Prompt with ID ${basePromptId} not found`);
    }

    const images = await this.prisma.promptImage.findMany({
      where: { basePromptId },
      orderBy: { createdAt: 'desc' },
    });

    return images.map(img => ({
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

    return images.map(img => ({
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

  async uploadImagesToBasePrompt(
    basePromptId: number,
    files: Express.Multer.File[],
  ): Promise<PromptImageResponseDto[]> {
    const basePrompt = await this.prisma.basePrompt.findUnique({
      where: { id: basePromptId },
    });

    if (!basePrompt) {
      throw new NotFoundException(`Base Prompt with ID ${basePromptId} not found`);
    }

    // 验证所有文件
    for (const file of files) {
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_FILE_TYPES.filter(type =>
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
    let generatedPrompt = basePrompt.prompt;
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
          imageUrl: fileUrl,
          generatedPrompt,
          status: 'uploaded',
        },
      });

      uploadedImages.push({
        id: image.id,
        basePromptId: image.basePromptId || undefined,
        characterPromptId: image.characterPromptId || undefined,
        imageUrl: image.imageUrl,
        generatedPrompt: image.generatedPrompt,
        status: image.status as 'uploaded' | 'generated',
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      });
    }

    return uploadedImages;
  }

  async uploadImages(
    characterPromptId: number,
    files: Express.Multer.File[],
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
        allowedTypes: ALLOWED_FILE_TYPES.filter(type =>
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
    const basePromptText = characterPrompt.basePrompt.prompt;
    const characterPromptText = characterPrompt.prompt;
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
          imageUrl: fileUrl,
          generatedPrompt,
          status: 'uploaded',
        },
      });

      uploadedImages.push({
        id: image.id,
        basePromptId: image.basePromptId || undefined,
        characterPromptId: image.characterPromptId || undefined,
        imageUrl: image.imageUrl,
        generatedPrompt: image.generatedPrompt,
        status: image.status as 'uploaded' | 'generated',
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      });
    }

    return uploadedImages;
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
}

