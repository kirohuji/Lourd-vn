import { RegisteredLocations, RegisteredMaps, RegisteredRooms, navigator } from '@drincs/nqtr';
import { ImageSprite, RegisteredCharacters } from '@drincs/pixi-vn';
import { CharacterConfig, LocationConfig, MapConfig, RoomConfig } from '@lourd-game/shared';
import { NAVIGATION_ROUTE } from '../constans';
import CharacterModel from '../models/Character';
import LocationModel from '../models/nqtr/Location';
import MapModel from '../models/nqtr/Map';
import RoomModel from '../models/nqtr/Room';
import TimeSlotsImage from '../models/TimeSlotsImage';
import { apiClient } from '../utils/api-client';

function buildMapBackground(map: MapConfig): TimeSlotsImage | string {
    if (map.backgroundType === 'timeSlots' && map.backgroundJson) {
        const { morning, afternoon, evening, night } = map.backgroundJson;
        return new TimeSlotsImage({
            morning,
            afternoon,
            evening,
            night,
        });
    }
    if (map.backgroundType === 'single' && map.backgroundJson?.src) {
        return map.backgroundJson.src;
    }
    return map.backgroundJson?.src || '';
}

function buildRoomBackground(room: RoomConfig): TimeSlotsImage | string {
    if (room.backgroundType === 'timeSlots' && room.backgroundJson) {
        const { morning, afternoon, evening, night } = room.backgroundJson;
        return new TimeSlotsImage({
            morning,
            afternoon,
            evening,
            night,
        });
    }
    if (room.backgroundType === 'single' && room.backgroundJson?.src) {
        return room.backgroundJson.src;
    }
    return room.backgroundJson?.src || '';
}

/**
 * 从后端加载地图 / 地点 / 房间 / 角色配置，并注册到游戏引擎
 */
export async function initGameConfigFromBackend(): Promise<void> {
    const [maps, locations, rooms, charactersPage] = await Promise.all([
        apiClient.getMaps(),
        apiClient.getLocations(),
        apiClient.getRooms(),
        apiClient.getCharacters(),
    ]);

    const locationsById = new Map<string, LocationConfig>();
    locations.forEach(loc => locationsById.set(loc.id, loc));

    // 注册地图
    const mapModels: MapModel[] = maps.map(map => {
        // neighboringMaps 可能存储在 backgroundJson 中，或者作为 MapConfig 的扩展属性
        let neighboringMaps: { north?: string; south?: string; east?: string; west?: string } = {};
        if ((map as any).neighboringMaps) {
            neighboringMaps = (map as any).neighboringMaps;
        } else if (
            map.backgroundJson &&
            typeof map.backgroundJson === 'object' &&
            'neighboringMaps' in map.backgroundJson
        ) {
            neighboringMaps = (map.backgroundJson as any).neighboringMaps || {};
        }
        const model = new MapModel(map.id, {
            name: map.name,
            background: buildMapBackground(map),
            neighboringMaps,
        });
        return model;
    });
    RegisteredMaps.add(mapModels);

    // 注册地点
    const mapById = new Map<string, MapModel>();
    mapModels.forEach(m => mapById.set(m.id, m));

    const locationModels = locations.map(loc => {
        const mapModel = mapById.get(loc.mapId);
        const spriteFactory = (location: any, { navigate }: { navigate: (path: string) => void }) => {
            const iconKey = loc.iconAlias || 'icon_location_home';
            const icon = new ImageSprite(
                {
                    xAlign: 0.5,
                    yAlign: 0.3,
                    height: 120,
                    width: 120,
                    eventMode: 'static',
                    cursor: 'pointer',
                },
                iconKey,
            );
            icon.on('pointerdown', () => {
                const entrance = location.entrance;
                if (entrance) {
                    navigator.currentRoom = entrance;
                    navigate(NAVIGATION_ROUTE);
                }
            });
            icon.load();
            return icon;
        };

        const model = new LocationModel(loc.id, mapModel!, {
            name: loc.name,
            sprite: spriteFactory,
        });
        return model;
    });

    RegisteredLocations.add(locationModels);

    // 注册房间
    const locationModelById = new Map<string, any>();
    locationModels.forEach(l => locationModelById.set(l.id, l));

    const roomModels = rooms.map(room => {
        const loc = locationModelById.get(room.locationId);
        const model = new RoomModel(room.id, loc, {
            name: room.name,
            isEntrance: room.isEntrance,
            background: buildRoomBackground(room),
            hotspots: (room.hotspotsJson || []) as any,
        });
        return model;
    });

    RegisteredRooms.add(roomModels);

    // 注册角色
    const characters: CharacterConfig[] = charactersPage.data || [];
    const characterModels = characters.map(
        c =>
            new CharacterModel(c.id, {
                name: c.name,
                age: c.age ?? undefined,
                icon: c.icon ?? undefined,
                color: c.color ?? undefined,
            }),
    );
    RegisteredCharacters.add(characterModels);
}
