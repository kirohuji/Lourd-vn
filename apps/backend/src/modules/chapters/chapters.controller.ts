import type {
  ChapterQueryDto,
  ChapterResponseDto,
  CreateChapterDto,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
  UpdateChapterDto,
} from '@lourd-game/shared';
import { UserRole } from '@lourd-game/shared';
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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BundleZipInfo } from '@lourd-game/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BundleGeneratorService } from '../manifest/bundle-generator.service';
import { ChaptersService } from './chapters.service';

@ApiTags('chapters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class ChaptersController {
  constructor(
    private readonly chaptersService: ChaptersService,
    private readonly bundleGeneratorService: BundleGeneratorService,
  ) {}

  @Get('projects/:projectId/chapters')
  @ApiOperation({ summary: '获取项目的章节列表' })
  async getProjectChapters(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ChapterQueryDto,
  ): Promise<ChapterResponseDto[]> {
    return this.chaptersService.findAll({ ...query, projectId });
  }

  @Get('chapters/:id')
  @ApiOperation({ summary: '获取章节详情' })
  async getChapter(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChapterResponseDto> {
    return this.chaptersService.findOne(id);
  }

  @Post('projects/:projectId/chapters')
  @ApiOperation({ summary: '创建章节' })
  async createChapter(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateChapterDto,
  ): Promise<ChapterResponseDto> {
    return this.chaptersService.create(projectId, dto);
  }

  @Put('chapters/:id')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChapterDto,
  ): Promise<ChapterResponseDto> {
    return this.chaptersService.update(id, dto);
  }

  @Delete('chapters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.chaptersService.remove(id);
  }

  @Get('chapters/:id/resources')
  @ApiOperation({ summary: '获取章节使用的资源列表' })
  async getChapterResources(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.chaptersService.getChapterResources(id, query);
  }

  @Post('chapters/:id/resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '将资源添加到章节' })
  async addResourceToChapter(
    @Param('id', ParseIntPipe) chapterId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ): Promise<void> {
    return this.chaptersService.addResourceToChapter(chapterId, resourceId);
  }

  @Delete('chapters/:id/resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '从章节移除资源' })
  async removeResourceFromChapter(
    @Param('id', ParseIntPipe) chapterId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ): Promise<void> {
    return this.chaptersService.removeResourceFromChapter(chapterId, resourceId);
  }

  @Get('chapters/:id/manifest')
  @ApiOperation({ summary: '生成章节资源 manifest' })
  async getChapterManifest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ManifestResponse> {
    return this.chaptersService.generateChapterManifest(id);
  }

  @Post('chapters/:id/generate-bundle')
  @ApiOperation({ summary: '生成章节资源包 ZIP' })
  @ApiResponse({ status: 200, description: 'ZIP 包生成成功' })
  async generateBundle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BundleZipInfo> {
    return this.bundleGeneratorService.generateChapterBundle(id);
  }
}

