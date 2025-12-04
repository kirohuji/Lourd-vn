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
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: '获取所有地图' })
  async listMaps(): Promise<MapConfig[]> {
    return this.service.listMaps();
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
  @ApiOperation({ summary: '获取角色列表' })
  async listCharacters(): Promise<PaginatedResponse<CharacterConfig>> {
    return this.service.listCharacters();
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


