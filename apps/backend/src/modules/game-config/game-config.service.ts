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
} from '@lourd-game/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GameConfigService {
  constructor(private prisma: PrismaService) {}

  // Maps
  async listMaps(usedByProjectId?: number): Promise<MapConfig[]> {
    const where: any = {};

    // 如果指定了 usedByProjectId，只查询该项目使用的地图
    if (usedByProjectId) {
      where.usedByProjects = {
        some: {
          projectId: usedByProjectId,
        },
      };
    }

    const maps = await this.prisma.map.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return maps.map((m) => ({
      id: m.id,
      name: m.name,
      bundle: m.bundle,
      backgroundType: (m.backgroundType as any) || 'timeSlots',
      backgroundJson: m.backgroundJson || undefined,
    }));
  }

  async upsertMap(
    dto: CreateMapDto | (UpdateMapDto & { id: string }),
  ): Promise<MapConfig> {
    const data: any = {
      name: dto.name,
      bundle: dto.bundle ?? null,
      backgroundType: dto.backgroundType ?? 'timeSlots',
      backgroundJson: dto.backgroundJson ?? null,
    };
    const map = await this.prisma.map.upsert({
      where: { id: (dto as any).id },
      create: {
        id: (dto as any).id,
        ...data,
      },
      update: data,
    });
    return {
      id: map.id,
      name: map.name,
      bundle: map.bundle,
      backgroundType: (map.backgroundType as any) || 'timeSlots',
      backgroundJson: map.backgroundJson || undefined,
    };
  }

  async deleteMap(id: string): Promise<void> {
    await this.prisma.map.delete({ where: { id } });
  }

  // Locations
  async listLocations(mapId?: string): Promise<LocationConfig[]> {
    const locations = await this.prisma.location.findMany({
      where: mapId ? { mapId } : undefined,
      orderBy: { order: 'asc' },
    });
    return locations.map((l) => ({
      id: l.id,
      mapId: l.mapId,
      name: l.name,
      iconAlias: l.iconAlias,
      order: l.order,
      spriteJson: (l.spriteJson as any) || undefined,
    }));
  }

  async upsertLocation(
    dto:
      | CreateLocationDto
      | (UpdateLocationDto & { id: string; mapId: string }),
  ): Promise<LocationConfig> {
    const data: any = {
      mapId: (dto as any).mapId,
      name: dto.name,
      iconAlias: dto.iconAlias ?? null,
      order: dto.order ?? 0,
      spriteJson: dto.spriteJson ?? null,
    };
    const loc = await this.prisma.location.upsert({
      where: { id: (dto as any).id },
      create: {
        id: (dto as any).id,
        ...data,
      },
      update: data,
    });
    return {
      id: loc.id,
      mapId: loc.mapId,
      name: loc.name,
      iconAlias: loc.iconAlias,
      order: loc.order,
      spriteJson: (loc.spriteJson as any) || undefined,
    };
  }

  async deleteLocation(id: string): Promise<void> {
    await this.prisma.location.delete({ where: { id } });
  }

  // Rooms
  async listRooms(locationId?: string): Promise<RoomConfig[]> {
    const rooms = await this.prisma.room.findMany({
      where: locationId ? { locationId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return rooms.map((r) => ({
      id: r.id,
      mapId: r.mapId || undefined,
      locationId: r.locationId,
      name: r.name,
      isEntrance: r.isEntrance,
      backgroundType: (r.backgroundType as any) || 'timeSlots',
      backgroundJson: r.backgroundJson || undefined,
      hotspotsJson: (r.hotspotsJson as any) || undefined,
    }));
  }

  async upsertRoom(
    dto: CreateRoomDto | (UpdateRoomDto & { id: string; locationId: string }),
  ): Promise<RoomConfig> {
    const data: any = {
      mapId: dto.mapId ?? null,
      locationId: (dto as any).locationId,
      name: dto.name,
      isEntrance: dto.isEntrance ?? false,
      backgroundType: dto.backgroundType ?? 'timeSlots',
      backgroundJson: dto.backgroundJson ?? null,
      hotspotsJson: dto.hotspotsJson ?? null,
    };
    const room = await this.prisma.room.upsert({
      where: { id: (dto as any).id },
      create: {
        id: (dto as any).id,
        ...data,
      },
      update: data,
    });
    return {
      id: room.id,
      mapId: room.mapId || undefined,
      locationId: room.locationId,
      name: room.name,
      isEntrance: room.isEntrance,
      backgroundType: (room.backgroundType as any) || 'timeSlots',
      backgroundJson: room.backgroundJson || undefined,
      hotspotsJson: (room.hotspotsJson as any) || undefined,
    };
  }

  async deleteRoom(id: string): Promise<void> {
    await this.prisma.room.delete({ where: { id } });
  }

  // Characters
  async listCharacters(
    usedByProjectId?: number,
  ): Promise<PaginatedResponse<CharacterConfig>> {
    const where: any = {};

    // 如果指定了 usedByProjectId，只查询该项目使用的角色
    if (usedByProjectId) {
      where.usedByProjects = {
        some: {
          projectId: usedByProjectId,
        },
      };
    }

    const chars = await this.prisma.character.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    const data: CharacterConfig[] = chars.map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age ?? undefined,
      icon: c.icon ?? undefined,
      color: c.color ?? undefined,
      enabled: c.enabled,
      order: c.order,
    }));
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length || 1,
      totalPages: 1,
    };
  }

  async upsertCharacter(
    dto: CreateCharacterDto | (UpdateCharacterDto & { id: string }),
  ): Promise<CharacterConfig> {
    const data: any = {
      name: dto.name,
      age: dto.age ?? null,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
      enabled: dto.enabled ?? true,
      order: dto.order ?? 0,
    };
    const c = await this.prisma.character.upsert({
      where: { id: (dto as any).id },
      create: {
        id: (dto as any).id,
        ...data,
      },
      update: data,
    });
    return {
      id: c.id,
      name: c.name,
      age: c.age ?? undefined,
      icon: c.icon ?? undefined,
      color: c.color ?? undefined,
      enabled: c.enabled,
      order: c.order,
    };
  }

  async deleteCharacter(id: string): Promise<void> {
    const exists = await this.prisma.character.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Character not found');
    }
    await this.prisma.character.delete({ where: { id } });
  }

  // Project Map Usage
  async addMapToProject(projectId: number, mapId: string): Promise<void> {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 检查地图是否存在
    const map = await this.prisma.map.findUnique({
      where: { id: mapId },
    });
    if (!map) {
      throw new NotFoundException(`Map with ID ${mapId} not found`);
    }

    // 检查是否已存在关联
    const existing = await this.prisma.projectMapUsage.findUnique({
      where: {
        projectId_mapId: {
          projectId,
          mapId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Map is already associated with this project',
      );
    }

    // 创建关联
    await this.prisma.projectMapUsage.create({
      data: {
        projectId,
        mapId,
      },
    });
  }

  async removeMapFromProject(projectId: number, mapId: string): Promise<void> {
    const usage = await this.prisma.projectMapUsage.findUnique({
      where: {
        projectId_mapId: {
          projectId,
          mapId,
        },
      },
    });

    if (!usage) {
      throw new NotFoundException('Map is not associated with this project');
    }

    await this.prisma.projectMapUsage.delete({
      where: {
        projectId_mapId: {
          projectId,
          mapId,
        },
      },
    });
  }

  async getProjectMaps(projectId: number): Promise<MapConfig[]> {
    return this.listMaps(projectId);
  }

  // Project Character Usage
  async addCharacterToProject(
    projectId: number,
    characterId: string,
  ): Promise<void> {
    // 检查项目是否存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 检查角色是否存在
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });
    if (!character) {
      throw new NotFoundException(`Character with ID ${characterId} not found`);
    }

    // 检查是否已存在关联
    const existing = await this.prisma.projectCharacterUsage.findUnique({
      where: {
        projectId_characterId: {
          projectId,
          characterId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Character is already associated with this project',
      );
    }

    // 创建关联
    await this.prisma.projectCharacterUsage.create({
      data: {
        projectId,
        characterId,
      },
    });
  }

  async removeCharacterFromProject(
    projectId: number,
    characterId: string,
  ): Promise<void> {
    const usage = await this.prisma.projectCharacterUsage.findUnique({
      where: {
        projectId_characterId: {
          projectId,
          characterId,
        },
      },
    });

    if (!usage) {
      throw new NotFoundException(
        'Character is not associated with this project',
      );
    }

    await this.prisma.projectCharacterUsage.delete({
      where: {
        projectId_characterId: {
          projectId,
          characterId,
        },
      },
    });
  }

  async getProjectCharacters(
    projectId: number,
  ): Promise<PaginatedResponse<CharacterConfig>> {
    return this.listCharacters(projectId);
  }
}
