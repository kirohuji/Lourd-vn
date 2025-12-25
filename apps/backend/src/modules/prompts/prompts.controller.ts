import type {
  CreateBasePromptDto,
  CreateCharacterPromptDto,
  CreatePromptTagDto,
  CreatePromptVariantDto,
  UpdateBasePromptDto,
  UpdateCharacterPromptDto,
  UpdatePromptTagDto,
  UpdatePromptVariantDto,
} from '@lourd-game/shared';
import {
  BasePromptResponseDto,
  CharacterPromptResponseDto,
  PromptImageResponseDto,
  PromptImagesGroupedResponseDto,
  PromptTagResponseDto,
  PromptVariantResponseDto,
  UserRole,
} from '@lourd-game/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PromptsService } from './prompts.service';

@ApiTags('prompts')
@Controller('prompts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  // ========== Base Prompt Endpoints ==========

  @Get('base')
  @ApiOperation({ summary: '获取所有 Base Prompt' })
  @ApiResponse({ status: 200, description: 'Base Prompt 列表' })
  async findAllBasePrompts(): Promise<BasePromptResponseDto[]> {
    return this.promptsService.findAllBasePrompts();
  }

  @Get('base/:id')
  @ApiOperation({ summary: '获取 Base Prompt 详情' })
  @ApiResponse({ status: 200, description: 'Base Prompt 详情' })
  async findBasePromptById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BasePromptResponseDto> {
    return this.promptsService.findBasePromptById(id);
  }

  @Post('base')
  @ApiOperation({ summary: '创建 Base Prompt' })
  @ApiResponse({ status: 201, description: 'Base Prompt 创建成功' })
  async createBasePrompt(
    @Body() dto: CreateBasePromptDto,
  ): Promise<BasePromptResponseDto> {
    return this.promptsService.createBasePrompt(dto);
  }

  @Put('base/:id')
  @ApiOperation({ summary: '更新 Base Prompt' })
  @ApiResponse({ status: 200, description: 'Base Prompt 更新成功' })
  async updateBasePrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBasePromptDto,
  ): Promise<BasePromptResponseDto> {
    return this.promptsService.updateBasePrompt(id, dto);
  }

  @Post('base/:id/reference-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传 Base Prompt 参考图' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '参考图上传成功' })
  async uploadBasePromptReferenceImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    return await this.promptsService.uploadBasePromptReferenceImage(id, file);
  }

  @Get('base/:id/images')
  @ApiOperation({ summary: '获取 Base Prompt 下的所有图片' })
  @ApiResponse({ status: 200, description: '图片列表' })
  async findImagesByBasePromptId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromptImageResponseDto[]> {
    return await this.promptsService.findImagesByBasePromptId(id);
  }

  @Post('base/:id/images')
  @UseInterceptors(FilesInterceptor('files', 20)) // 最多支持 20 个文件
  @ApiOperation({ summary: '上传图片到 Base Prompt（支持多文件）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '图片上传成功' })
  async uploadImagesToBasePrompt(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('variantId') variantId?: string,
  ): Promise<PromptImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new Error('至少需要上传一个文件');
    }
    const variantIdNum = variantId ? parseInt(variantId, 10) : undefined;
    return await this.promptsService.uploadImagesToBasePrompt(id, files, variantIdNum);
  }

  @Delete('base/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 Base Prompt' })
  @ApiResponse({ status: 204, description: 'Base Prompt 删除成功' })
  async deleteBasePrompt(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promptsService.deleteBasePrompt(id);
  }

  // ========== Character Prompt Endpoints ==========

  @Get('base/:basePromptId/characters')
  @ApiOperation({ summary: '获取 Base Prompt 下的所有 Character Prompt' })
  @ApiResponse({ status: 200, description: 'Character Prompt 列表' })
  async findCharacterPromptsByBasePromptId(
    @Param('basePromptId', ParseIntPipe) basePromptId: number,
  ): Promise<CharacterPromptResponseDto[]> {
    return this.promptsService.findCharacterPromptsByBasePromptId(basePromptId);
  }

  @Post('base/:basePromptId/characters')
  @ApiOperation({ summary: '创建 Character Prompt' })
  @ApiResponse({ status: 201, description: 'Character Prompt 创建成功' })
  async createCharacterPrompt(
    @Param('basePromptId', ParseIntPipe) basePromptId: number,
    @Body() dto: CreateCharacterPromptDto,
  ): Promise<CharacterPromptResponseDto> {
    return this.promptsService.createCharacterPrompt(basePromptId, dto);
  }

  @Get('characters/:id')
  @ApiOperation({ summary: '获取 Character Prompt 详情' })
  @ApiResponse({ status: 200, description: 'Character Prompt 详情' })
  async findCharacterPromptById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CharacterPromptResponseDto> {
    return this.promptsService.findCharacterPromptById(id);
  }

  @Put('characters/:id')
  @ApiOperation({ summary: '更新 Character Prompt' })
  @ApiResponse({ status: 200, description: 'Character Prompt 更新成功' })
  async updateCharacterPrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCharacterPromptDto,
  ): Promise<CharacterPromptResponseDto> {
    return this.promptsService.updateCharacterPrompt(id, dto);
  }

  @Post('characters/:id/reference-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传 Character Prompt 参考图' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '参考图上传成功' })
  async uploadReferenceImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    return await this.promptsService.uploadReferenceImage(id, file);
  }

  @Delete('characters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 Character Prompt' })
  @ApiResponse({ status: 204, description: 'Character Prompt 删除成功' })
  async deleteCharacterPrompt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.promptsService.deleteCharacterPrompt(id);
  }

  // ========== Prompt Image Endpoints ==========

  @Get('characters/:characterPromptId/images')
  @ApiOperation({ summary: '获取 Character Prompt 下的所有图片' })
  @ApiResponse({ status: 200, description: '图片列表' })
  async findImagesByCharacterPromptId(
    @Param('characterPromptId', ParseIntPipe) characterPromptId: number,
  ): Promise<PromptImageResponseDto[]> {
    return this.promptsService.findImagesByCharacterPromptId(characterPromptId);
  }

  @Post('characters/:characterPromptId/images')
  @UseInterceptors(FilesInterceptor('files', 20)) // 最多支持 20 个文件
  @ApiOperation({ summary: '上传图片（支持多文件）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '图片上传成功' })
  async uploadImages(
    @Param('characterPromptId', ParseIntPipe) characterPromptId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('variantId') variantId?: string,
  ): Promise<PromptImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new Error('至少需要上传一个文件');
    }
    const variantIdNum = variantId ? parseInt(variantId, 10) : undefined;
    return this.promptsService.uploadImages(characterPromptId, files, variantIdNum);
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除图片' })
  @ApiResponse({ status: 204, description: '图片删除成功' })
  async deleteImage(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promptsService.deleteImage(id);
  }

  @Put('images/:id/variant')
  @ApiOperation({ summary: '更新图片的变体' })
  @ApiResponse({ status: 200, description: '图片变体更新成功' })
  async updateImageVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { variantId: number | null },
  ): Promise<PromptImageResponseDto> {
    return this.promptsService.updateImageVariant(id, dto.variantId);
  }

  // ========== Prompt Tag Endpoints ==========

  @Get('tags')
  @ApiOperation({ summary: '获取所有标签 Prompt' })
  @ApiResponse({ status: 200, description: '标签 Prompt 列表' })
  async findAllTags(
    @Query('tagType') tagType?: string,
  ): Promise<PromptTagResponseDto[]> {
    return this.promptsService.findAllTags(tagType);
  }

  @Get('tags/:id')
  @ApiOperation({ summary: '获取标签 Prompt 详情' })
  @ApiResponse({ status: 200, description: '标签 Prompt 详情' })
  async findTagById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromptTagResponseDto> {
    return this.promptsService.findTagById(id);
  }

  @Post('tags')
  @ApiOperation({ summary: '创建标签 Prompt' })
  @ApiResponse({ status: 201, description: '标签 Prompt 创建成功' })
  async createTag(
    @Body() dto: CreatePromptTagDto,
  ): Promise<PromptTagResponseDto> {
    return this.promptsService.createTag(dto);
  }

  @Put('tags/:id')
  @ApiOperation({ summary: '更新标签 Prompt' })
  @ApiResponse({ status: 200, description: '标签 Prompt 更新成功' })
  async updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptTagDto,
  ): Promise<PromptTagResponseDto> {
    return this.promptsService.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除标签 Prompt' })
  @ApiResponse({ status: 204, description: '标签 Prompt 删除成功' })
  async deleteTag(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promptsService.deleteTag(id);
  }

  // ========== Prompt Variant Endpoints ==========

  @Get('variants')
  @ApiOperation({ summary: '获取变体列表' })
  @ApiResponse({ status: 200, description: '变体列表' })
  async findVariants(
    @Query('basePromptId') basePromptId?: number,
    @Query('characterPromptId') characterPromptId?: number,
  ): Promise<PromptVariantResponseDto[]> {
    if (basePromptId) {
      return this.promptsService.findVariantsByPrompt(basePromptId, 'base');
    } else if (characterPromptId) {
      return this.promptsService.findVariantsByPrompt(
        characterPromptId,
        'character',
      );
    } else {
      return [];
    }
  }

  @Get('variants/:id')
  @ApiOperation({ summary: '获取变体详情' })
  @ApiResponse({ status: 200, description: '变体详情' })
  async findVariantById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromptVariantResponseDto> {
    return this.promptsService.findVariantById(id);
  }

  @Post('variants')
  @ApiOperation({ summary: '创建变体' })
  @ApiResponse({ status: 201, description: '变体创建成功' })
  async createVariant(
    @Body() dto: CreatePromptVariantDto,
  ): Promise<PromptVariantResponseDto> {
    return this.promptsService.createVariant(dto);
  }

  @Put('variants/:id')
  @ApiOperation({ summary: '更新变体' })
  @ApiResponse({ status: 200, description: '变体更新成功' })
  async updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptVariantDto,
  ): Promise<PromptVariantResponseDto> {
    return this.promptsService.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除变体' })
  @ApiResponse({ status: 204, description: '变体删除成功' })
  async deleteVariant(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promptsService.deleteVariant(id);
  }

  @Post('variants/:id/set-default')
  @ApiOperation({ summary: '设置默认变体' })
  @ApiResponse({ status: 200, description: '默认变体设置成功' })
  async setDefaultVariant(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromptVariantResponseDto> {
    return this.promptsService.setDefaultVariant(id);
  }

  @Post('variants/:id/merge')
  @ApiOperation({ summary: '合并变体 Prompt' })
  @ApiResponse({ status: 200, description: '合并成功' })
  async mergeVariant(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ mergedPrompt: string }> {
    const mergedPrompt = await this.promptsService.mergeVariantPrompt(id);
    return { mergedPrompt };
  }

  // ========== 图片分组查询 ==========

  @Get('images/grouped')
  @ApiOperation({ summary: '获取按变体分组的图片' })
  @ApiResponse({ status: 200, description: '分组图片列表' })
  async findImagesGrouped(
    @Query('basePromptId') basePromptId?: number,
    @Query('characterPromptId') characterPromptId?: number,
  ): Promise<PromptImagesGroupedResponseDto> {
    return this.promptsService.findImagesGroupedByVariant(
      basePromptId,
      characterPromptId,
    );
  }
}
