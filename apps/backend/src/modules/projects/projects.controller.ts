import type {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from '@lourd-game/shared';
import {
  PaginatedResponse,
  ProjectResponseDto,
  UserRole,
} from '@lourd-game/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BundleZipInfo } from '@lourd-game/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { BundleGeneratorService } from '../manifest/bundle-generator.service';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
@Roles(UserRole.ADMIN)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly bundleGeneratorService: BundleGeneratorService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponse({ status: 201, description: '项目创建成功' })
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() query: ProjectQueryDto,
  ): Promise<PaginatedResponse<ProjectResponseDto>> {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectsService.remove(id);
  }

  @Post(':id/generate-bundle')
  @ApiOperation({ summary: '生成项目共通资源包 ZIP' })
  @ApiResponse({ status: 200, description: 'ZIP 包生成成功' })
  async generateBundle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BundleZipInfo> {
    return this.bundleGeneratorService.generateCommonBundle(id);
  }
}
