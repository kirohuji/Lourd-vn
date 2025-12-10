import {
  CharacterConfig,
  CreateCharacterDto,
  CreateLocationDto,
  CreateMapDto,
  CreateRoomDto,
  LocationConfig,
  MapConfig,
  PaginatedResponse,
  RoomConfig,
  UpdateCharacterDto,
  UpdateLocationDto,
  UpdateMapDto,
  UpdateRoomDto,
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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GameConfigService } from './game-config.service';

@ApiTags('game-config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('game-config')
export class GameConfigController {
  constructor(private readonly service: GameConfigService) {}

  // Maps
  @Get('maps')
  @ApiOperation({ summary: '获取所有地图（支持 usedByProjectId 查询参数）' })
  async listMaps(
    @Query('usedByProjectId') usedByProjectId?: string,
  ): Promise<MapConfig[]> {
    const projectId = usedByProjectId ? Number(usedByProjectId) : undefined;
    return this.service.listMaps(projectId);
  }

  @Put('maps/:id')
  @Post('maps/:id')
  @ApiOperation({ summary: '创建或更新地图' })
  async upsertMap(
    @Param('id') id: string,
    @Body() dto: CreateMapDto | UpdateMapDto,
  ): Promise<MapConfig> {
    return this.service.upsertMap({ ...(dto as any), id });
  }

  @Delete('maps/:id')
  @ApiOperation({ summary: '删除地图' })
  async deleteMap(@Param('id') id: string): Promise<void> {
    return this.service.deleteMap(id);
  }

  // Locations
  @Get('locations')
  @ApiOperation({ summary: '获取所有地点' })
  async listLocations(): Promise<LocationConfig[]> {
    return this.service.listLocations();
  }

  @Put('locations/:id')
  @Post('locations/:id')
  @ApiOperation({ summary: '创建或更新地点' })
  async upsertLocation(
    @Param('id') id: string,
    @Body() dto: CreateLocationDto | UpdateLocationDto,
  ): Promise<LocationConfig> {
    return this.service.upsertLocation({ ...(dto as any), id });
  }

  @Delete('locations/:id')
  @ApiOperation({ summary: '删除地点' })
  async deleteLocation(@Param('id') id: string): Promise<void> {
    return this.service.deleteLocation(id);
  }

  // Rooms
  @Get('rooms')
  @ApiOperation({ summary: '获取所有房间' })
  async listRooms(): Promise<RoomConfig[]> {
    return this.service.listRooms();
  }

  @Put('rooms/:id')
  @Post('rooms/:id')
  @ApiOperation({ summary: '创建或更新房间' })
  async upsertRoom(
    @Param('id') id: string,
    @Body() dto: CreateRoomDto | UpdateRoomDto,
  ): Promise<RoomConfig> {
    return this.service.upsertRoom({ ...(dto as any), id });
  }

  @Delete('rooms/:id')
  @ApiOperation({ summary: '删除房间' })
  async deleteRoom(@Param('id') id: string): Promise<void> {
    return this.service.deleteRoom(id);
  }

  // Characters
  @Get('characters')
  @ApiOperation({ summary: '获取角色列表（支持 usedByProjectId 查询参数）' })
  async listCharacters(
    @Query('usedByProjectId') usedByProjectId?: string,
  ): Promise<PaginatedResponse<CharacterConfig>> {
    const projectId = usedByProjectId ? Number(usedByProjectId) : undefined;
    return this.service.listCharacters(projectId);
  }

  @Put('characters/:id')
  @Post('characters/:id')
  @ApiOperation({ summary: '创建或更新角色' })
  async upsertCharacter(
    @Param('id') id: string,
    @Body() dto: CreateCharacterDto | UpdateCharacterDto,
  ): Promise<CharacterConfig> {
    return this.service.upsertCharacter({ ...(dto as any), id });
  }

  @Delete('characters/:id')
  @ApiOperation({ summary: '删除角色' })
  async deleteCharacter(@Param('id') id: string): Promise<void> {
    return this.service.deleteCharacter(id);
  }
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('projects')
export class ProjectGameConfigController {
  constructor(private readonly service: GameConfigService) {}

  // Project Maps
  @Get(':projectId/maps')
  @ApiOperation({ summary: '获取项目使用的地图列表' })
  async getProjectMaps(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<MapConfig[]> {
    return this.service.getProjectMaps(projectId);
  }

  @Post(':projectId/maps/:mapId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '将地图添加到项目' })
  async addMapToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('mapId') mapId: string,
  ): Promise<void> {
    return this.service.addMapToProject(projectId, mapId);
  }

  @Delete(':projectId/maps/:mapId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '从项目移除地图' })
  async removeMapFromProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('mapId') mapId: string,
  ): Promise<void> {
    return this.service.removeMapFromProject(projectId, mapId);
  }

  // Project Characters
  @Get(':projectId/characters')
  @ApiOperation({ summary: '获取项目使用的角色列表' })
  async getProjectCharacters(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<PaginatedResponse<CharacterConfig>> {
    return this.service.getProjectCharacters(projectId);
  }

  @Post(':projectId/characters/:characterId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '将角色添加到项目' })
  async addCharacterToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    return this.service.addCharacterToProject(projectId, characterId);
  }

  @Delete(':projectId/characters/:characterId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '从项目移除角色' })
  async removeCharacterFromProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    return this.service.removeCharacterFromProject(projectId, characterId);
  }
}
