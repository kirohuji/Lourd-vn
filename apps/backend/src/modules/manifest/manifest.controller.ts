import type {
  CreateResourceDto,
  ManifestResponse,
  PaginatedResponse,
  ResourceQueryDto,
  ResourceResponseDto,
} from '@lourd-game/shared';
import { UserRole } from '@lourd-game/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ManifestService } from './manifest.service';

@ApiTags('manifest')
@Controller('manifest')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @Post()
  @UseGuards(RolesGuard)
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
  @ApiOperation({ summary: '获取资源列表' })
  @ApiResponse({
    status: 200,
    description: '资源列表',
  })
  async findAll(
    @Query() query: ResourceQueryDto,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.manifestService.findAll(query);
  }

  @Get('generate')
  @Public()
  @ApiOperation({ summary: '生成 Manifest（公开接口）' })
  @ApiResponse({ status: 200, description: 'Manifest' })
  async generateManifest(): Promise<ManifestResponse> {
    return this.manifestService.generateManifest();
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除资源（仅管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.manifestService.remove(id, user.id, user.role);
  }
}
