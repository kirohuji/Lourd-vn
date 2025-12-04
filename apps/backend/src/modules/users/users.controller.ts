import type {
  PaginatedResponse,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from '@lourd-game/shared';
import { UserRole } from '@lourd-game/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取用户列表（仅管理员）' })
  @ApiResponse({
    status: 200,
    description: '用户列表',
  })
  async findAll(
    @Query() query: UserQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取用户详情（仅管理员）' })
  @ApiResponse({ status: 200, description: '用户详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新用户（仅管理员）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除用户（仅管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.usersService.remove(id, user.id, user.role);
  }
}
