import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import {
  CreateResourceDto,
  ResourceResponseDto,
  ResourceQueryDto,
  PaginatedResponse,
  ManifestResponse,
} from '@nqtr-game/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@nqtr-game/shared';

@ApiTags('resources')
@Controller('resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

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
  @ApiResponse({ status: 201, description: '资源创建成功', type: ResourceResponseDto })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: any,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.create(file, dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取资源列表' })
  @ApiResponse({
    status: 200,
    description: '资源列表',
    type: PaginatedResponse<ResourceResponseDto>,
  })
  async findAll(@Query() query: ResourceQueryDto): Promise<PaginatedResponse<ResourceResponseDto>> {
    return this.resourcesService.findAll(query);
  }

  @Get('manifest')
  @ApiOperation({ summary: '生成 Manifest' })
  @ApiResponse({ status: 200, description: 'Manifest', type: ManifestResponse })
  async generateManifest(): Promise<ManifestResponse> {
    return this.resourcesService.generateManifest();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取资源详情' })
  @ApiResponse({ status: 200, description: '资源详情', type: ResourceResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResourceResponseDto> {
    return this.resourcesService.findOne(id);
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
    return this.resourcesService.remove(id, user.id, user.role);
  }
}

