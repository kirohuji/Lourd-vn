import type {
  CreateResourceDto,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
  UpdateResourceDto,
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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ManifestService } from './manifest.service';

export class GetFileDto {
  @ApiProperty({ description: '文件URL' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

export class UpdateBundleDto {
  @ApiProperty({ description: '新Bundle名称（可选）', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newBundleName?: string;

  @ApiProperty({ description: '新Bundle类型（可选，common 或 chapter）', required: false })
  @IsOptional()
  @IsString()
  newBundleType?: 'common' | 'chapter';
}

@ApiTags('manifest')
@Controller('manifest')
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传资源（仅管理员）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        alias: { type: 'string' },
        bundle: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '资源创建成功' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: any,
  ): Promise<ResourceResponseDto> {
    return this.manifestService.create(file, dto, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '获取资源列表（公开接口）' })
  @ApiResponse({
    status: 200,
    description: '资源列表',
  })
  async findAll(
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.manifestService.findAll(query);
  }

  @Get('bundles')
  @Public()
  @ApiOperation({ summary: '获取 Bundle 列表（包含统计信息）' })
  @ApiResponse({
    status: 200,
    description: 'Bundle 列表',
  })
  async getBundleList(
    @Query('bundleType') bundleType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    return this.manifestService.getBundleList({ bundleType, search, page: pageNum, limit: limitNum });
  }

  @Get('generate')
  @Public()
  @ApiOperation({ summary: '生成 Manifest（公开接口）' })
  @ApiResponse({ status: 200, description: 'Manifest' })
  async generateManifest(
    @Query('bundleType') bundleType?: string,
  ): Promise<ManifestResponse> {
    return this.manifestService.generateManifest(bundleType);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取资源详情' })
  @ApiResponse({ status: 200, description: '资源详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.manifestService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除资源（仅管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.manifestService.remove(id, user.id, user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新资源元数据（仅管理员）' })
  @ApiResponse({ status: 200, description: '资源更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.manifestService.update(id, dto);
  }

  @Put(':id/file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '替换资源文件（仅管理员）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        alias: { type: 'string' },
        bundle: { type: 'string' },
        bundleType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '资源文件替换成功' })
  async replaceFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.manifestService.replaceFile(id, file, dto);
  }

  @Post(':id/migrate-to-cos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '将资源迁移到腾讯云 COS（仅管理员）' })
  @ApiResponse({ status: 200, description: '迁移成功，返回更新后的资源' })
  async migrateToCos(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.manifestService.migrateToCos(id);
  }

  @Post('download')
  @ApiOperation({ summary: '获取文件（POST）' })
  async getFile(@Body() getFileDto: GetFileDto, @Res() res: Response) {
    const { buffer, mimeType } = await this.manifestService.downloadByFileUrl(
      getFileDto.fileUrl,
    );
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  }

  @Get('proxy')
  @Public()
  @ApiOperation({
    summary: '代理获取文件（GET，用于前端资源加载，不带扩展名）',
  })
  @ApiResponse({ status: 200, description: '文件内容' })
  async proxyFile(@Query('url') url: string, @Res() res: Response) {
    return this.handleProxyRequest(url, res);
  }

  @Put('bundles/:bundleName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新Bundle（批量更新该Bundle下所有资源）' })
  @ApiResponse({ status: 200, description: 'Bundle更新成功' })
  async updateBundle(
    @Param('bundleName') bundleName: string,
    @Body() dto: UpdateBundleDto,
  ): Promise<{ updatedCount: number }> {
    return this.manifestService.updateBundleResources(
      bundleName,
      dto.newBundleName,
      dto.newBundleType,
    );
  }

  @Get('proxy/*')
  @Public()
  @ApiOperation({
    summary: '代理获取文件（GET，用于前端资源加载，支持文件名路径）',
  })
  @ApiResponse({ status: 200, description: '文件内容' })
  async proxyFileWithPath(@Query('url') url: string, @Res() res: Response) {
    return this.handleProxyRequest(url, res);
  }

  private async handleProxyRequest(url: string, res: Response) {
    if (!url) {
      res.status(400).send('Missing url parameter');
      return;
    }

    try {
      // 解码 URL 参数
      const decodedUrl = decodeURIComponent(url);
      const { buffer, mimeType } =
        await this.manifestService.downloadByFileUrl(decodedUrl);

      // 设置响应头
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      res.send(buffer);
    } catch (error: any) {
      res.status(404).send(error.message || 'File not found');
    }
  }
}

@ApiTags('projects')
@Controller('projects')
export class ProjectResourceController {
  constructor(private readonly manifestService: ManifestService) {}

  @Get(':projectId/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取项目使用的资源列表（仅管理员）' })
  @ApiResponse({ status: 200, description: '项目资源列表' })
  async getProjectResources(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.manifestService.getProjectResources(projectId, query);
  }

  @Post(':projectId/resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '将资源添加到项目（仅管理员）' })
  @ApiResponse({ status: 204, description: '资源已添加到项目' })
  async addResourceToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ): Promise<void> {
    return this.manifestService.addResourceToProject(projectId, resourceId);
  }

  @Delete(':projectId/resources/:resourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '从项目移除资源（仅管理员）' })
  @ApiResponse({ status: 204, description: '资源已从项目移除' })
  async removeResourceFromProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ): Promise<void> {
    return this.manifestService.removeResourceFromProject(
      projectId,
      resourceId,
    );
  }

  @Get(':projectId/manifest/common')
  @Public()
  @ApiOperation({ summary: '生成项目的共通资源 manifest（公开）' })
  @ApiResponse({ status: 200, description: '共通资源 Manifest' })
  async getCommonManifest(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ManifestResponse> {
    return this.manifestService.generateCommonManifest(projectId);
  }

  @Get(':projectId/manifest/full')
  @Public()
  @ApiOperation({ summary: '生成项目的完整 manifest（公开）' })
  @ApiResponse({ status: 200, description: '完整 Manifest' })
  async getFullManifest(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ManifestResponse> {
    return this.manifestService.generateFullManifest(projectId);
  }
}
