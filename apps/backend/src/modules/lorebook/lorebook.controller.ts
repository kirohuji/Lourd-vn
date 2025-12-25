import type {
  CreateLoreBookCategoryDto,
  CreateLoreBookEntryDto,
  UpdateLoreBookCategoryDto,
  UpdateLoreBookEntryDto,
  UpdateLoreBookSettingsDto,
} from '@lourd-game/shared';
import {
  LoreBookCategoryResponseDto,
  LoreBookEntryResponseDto,
  LoreBookSettingsResponseDto,
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
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LoreBookService } from './lorebook.service';

@ApiTags('lorebook')
@Controller('lorebook')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LoreBookController {
  constructor(private readonly loreBookService: LoreBookService) {}

  // ========== Entry Endpoints ==========

  @Get('entries')
  @ApiOperation({ summary: '获取所有 LoreBook Entry' })
  @ApiResponse({ status: 200, description: 'Entry 列表' })
  async findAllEntries(
    @Query('categoryId') categoryId?: string,
  ): Promise<LoreBookEntryResponseDto[]> {
    return this.loreBookService.findAllEntries(categoryId);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: '获取 LoreBook Entry 详情' })
  @ApiResponse({ status: 200, description: 'Entry 详情' })
  async findEntryById(
    @Param('id') id: string,
  ): Promise<LoreBookEntryResponseDto> {
    return this.loreBookService.findEntryById(id);
  }

  @Post('entries')
  @ApiOperation({ summary: '创建 LoreBook Entry' })
  @ApiResponse({ status: 201, description: 'Entry 创建成功' })
  async createEntry(
    @Body() dto: CreateLoreBookEntryDto,
  ): Promise<LoreBookEntryResponseDto> {
    return this.loreBookService.createEntry(dto);
  }

  @Put('entries/:id')
  @ApiOperation({ summary: '更新 LoreBook Entry' })
  @ApiResponse({ status: 200, description: 'Entry 更新成功' })
  async updateEntry(
    @Param('id') id: string,
    @Body() dto: UpdateLoreBookEntryDto,
  ): Promise<LoreBookEntryResponseDto> {
    return this.loreBookService.updateEntry(id, dto);
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 LoreBook Entry' })
  @ApiResponse({ status: 204, description: 'Entry 删除成功' })
  async deleteEntry(@Param('id') id: string): Promise<void> {
    return this.loreBookService.deleteEntry(id);
  }

  // ========== Category Endpoints ==========

  @Get('categories')
  @ApiOperation({ summary: '获取所有 LoreBook Category' })
  @ApiResponse({ status: 200, description: 'Category 列表' })
  async findAllCategories(): Promise<LoreBookCategoryResponseDto[]> {
    return this.loreBookService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: '获取 LoreBook Category 详情' })
  @ApiResponse({ status: 200, description: 'Category 详情' })
  async findCategoryById(
    @Param('id') id: string,
  ): Promise<LoreBookCategoryResponseDto> {
    return this.loreBookService.findCategoryById(id);
  }

  @Post('categories')
  @ApiOperation({ summary: '创建 LoreBook Category' })
  @ApiResponse({ status: 201, description: 'Category 创建成功' })
  async createCategory(
    @Body() dto: CreateLoreBookCategoryDto,
  ): Promise<LoreBookCategoryResponseDto> {
    return this.loreBookService.createCategory(dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新 LoreBook Category' })
  @ApiResponse({ status: 200, description: 'Category 更新成功' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateLoreBookCategoryDto,
  ): Promise<LoreBookCategoryResponseDto> {
    return this.loreBookService.updateCategory(id, dto);
  }

  @Put('categories/:id/order')
  @ApiOperation({ summary: '更新 Category 的 order 数组' })
  @ApiResponse({ status: 200, description: 'Order 更新成功' })
  async updateCategoryOrder(
    @Param('id') id: string,
    @Body() order: string[],
  ): Promise<LoreBookCategoryResponseDto> {
    return this.loreBookService.updateCategory(id, { order });
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 LoreBook Category' })
  @ApiResponse({ status: 204, description: 'Category 删除成功' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.loreBookService.deleteCategory(id);
  }

  // ========== Settings Endpoints ==========

  @Get('settings')
  @ApiOperation({ summary: '获取 LoreBook 全局设置' })
  @ApiResponse({ status: 200, description: '设置详情' })
  async getSettings(): Promise<LoreBookSettingsResponseDto> {
    return this.loreBookService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: '更新 LoreBook 全局设置' })
  @ApiResponse({ status: 200, description: '设置更新成功' })
  async updateSettings(
    @Body() dto: UpdateLoreBookSettingsDto,
  ): Promise<LoreBookSettingsResponseDto> {
    return this.loreBookService.updateSettings(dto);
  }
}

