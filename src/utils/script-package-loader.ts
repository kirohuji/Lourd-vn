import {
    navigator,
    OnRunProps,
    QuestInterface,
    RegisteredActivities,
    RegisteredCommitments,
    RegisteredLocations,
    RegisteredMaps,
    RegisteredQuests,
    RegisteredRooms,
    StageInterface,
} from '@drincs/nqtr';
import { Assets, AssetsManifest, ImageSprite, RegisteredCharacters } from '@drincs/pixi-vn';
import { NAVIGATION_ROUTE } from '../constans';
import Character from '../models/Character';
import TimeSlotsImage from '../models/TimeSlotsImage';
import Activity from '../models/nqtr/Activity';
import Commitment from '../models/nqtr/Commitment';
import Location from '../models/nqtr/Location';
import Map from '../models/nqtr/Map';
import Quest from '../models/nqtr/Quest';
import Room from '../models/nqtr/Room';
import Stage from '../models/nqtr/Stage';
import {
    ActivityJSON,
    CharacterJSON,
    CommitmentJSON,
    LabelJSON,
    LocationJSON,
    MapJSON,
    QuestJSON,
    RoomJSON,
} from '../types/json-schema';
import { createActivityOnRun, createCommitmentOnRun, createIconFromJSON } from './json-action-executor';
import { executeActions, evaluateCondition } from './json-interpreter';
import { loadLabelsFromJSON as loadLabelsFromJSONUtil } from './json-label-loader';

/**
 * JSON 数据加载器
 * 将 JSON 配置转换为游戏对象并注册到系统
 */

/**
 * 加载角色
 */
export function loadCharactersFromJSON(charactersJSON: CharacterJSON[]): void {
    const characters = charactersJSON.map(charJSON => {
        return new Character(charJSON.id, {
            name: charJSON.name,
            surname: charJSON.surname,
            age: charJSON.age,
            icon: charJSON.icon,
            color: charJSON.color,
        });
    });
    RegisteredCharacters.add(characters);
}

/**
 * 加载地图
 */
export function loadMapsFromJSON(mapsJSON: MapJSON[]): void {
    const maps = mapsJSON.map(mapJSON => {
        let background: string | TimeSlotsImage;
        if (typeof mapJSON.background === 'string') {
            background = mapJSON.background;
        } else {
            background = new TimeSlotsImage({
                morning: mapJSON.background.morning,
                afternoon: mapJSON.background.afternoon,
                evening: mapJSON.background.evening,
                night: mapJSON.background.night,
            });
        }

        return new Map(mapJSON.id, {
            name: mapJSON.name,
            background,
            neighboringMaps: mapJSON.neighboringMaps || {},
        });
    });
    RegisteredMaps.add(maps);
}

/**
 * 加载地点
 */
export function loadLocationsFromJSON(locationsJSON: LocationJSON[]): void {
    const locations = locationsJSON.map(locJSON => {
        const map = RegisteredMaps.get(locJSON.mapId);
        if (!map) {
            throw new Error(`Map "${locJSON.mapId}" not found for location "${locJSON.id}"`);
        }

        let sprite: any;
        if (locJSON.sprite.type === 'image' && locJSON.sprite.alias) {
            sprite = (location: Location, { navigate }: OnRunProps) => {
                const icon = new ImageSprite(
                    {
                        xAlign: locJSON.sprite.xAlign || 0.5,
                        yAlign: locJSON.sprite.yAlign || 0.5,
                        height: locJSON.sprite.height || 120,
                        width: locJSON.sprite.width || 120,
                        eventMode: (locJSON.sprite.eventMode || 'static') as 'static' | 'dynamic' | 'none',
                        cursor: locJSON.sprite.cursor || 'pointer',
                    },
                    locJSON.sprite.alias!,
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
        } else {
            sprite = () => new ImageSprite();
        }

        return new Location(locJSON.id, map, {
            name: locJSON.name,
            sprite,
        });
    });
    RegisteredLocations.add(locations);
}

/**
 * 加载房间
 */
export function loadRoomsFromJSON(roomsJSON: RoomJSON[]): void {
    const rooms = roomsJSON.map(roomJSON => {
        const location = RegisteredLocations.get(roomJSON.locationId);
        if (!location) {
            throw new Error(`Location "${roomJSON.locationId}" not found for room "${roomJSON.id}"`);
        }

        let background: string | TimeSlotsImage;
        if (typeof roomJSON.background === 'string') {
            background = roomJSON.background;
        } else {
            background = new TimeSlotsImage({
                morning: roomJSON.background.morning,
                afternoon: roomJSON.background.afternoon,
                evening: roomJSON.background.evening,
                night: roomJSON.background.night,
            });
        }

        return new Room(roomJSON.id, location, {
            name: roomJSON.name,
            background,
            isEntrance: roomJSON.isEntrance,
            activities: [], // 稍后通过 addActivity 添加
        });
    });
    RegisteredRooms.add(rooms);

    // 添加活动到房间
    roomsJSON.forEach(roomJSON => {
        const room = RegisteredRooms.get(roomJSON.id);
        if (room && roomJSON.activities) {
            roomJSON.activities.forEach(activityId => {
                const activity = RegisteredActivities.get(activityId);
                if (activity) {
                    room.addActivity(activity);
                }
            });
        }
    });
}

/**
 * 加载活动
 */
export function loadActivitiesFromJSON(activitiesJSON: ActivityJSON[]): void {
    const activities = activitiesJSON.map(activityJSON => {
        const onRun = createActivityOnRun(activityJSON.onRun);

        // 创建图标函数（如果需要）
        let icon: React.ReactElement | ((props: Activity, runProps: OnRunProps) => React.ReactElement) | undefined;
        if (activityJSON.icon) {
            const iconFromJSON = createIconFromJSON(activityJSON.icon, {} as Activity);
            if (iconFromJSON && typeof iconFromJSON === 'function') {
                // 转换为 Activity 期望的签名
                icon = (_activity: Activity, runProps: OnRunProps) => iconFromJSON(runProps);
            } else if (iconFromJSON) {
                icon = iconFromJSON;
            }
        }

        const activity = new Activity(activityJSON.id, onRun, {
            name: activityJSON.name,
            icon,
        });

        return activity;
    });
    RegisteredActivities.add(activities);
}

/**
 * 加载任务
 */
export function loadQuestsFromJSON(questsJSON: QuestJSON[]): void {
    questsJSON.forEach(questJSON => {
        const stages = questJSON.stages.map(stageJSON => {
            const onStart = stageJSON.onStart
                ? (_stage: StageInterface, props: OnRunProps) => {
                      executeActions(stageJSON.onStart!, props);
                  }
                : undefined;

            const onEnd = stageJSON.onEnd
                ? (_stage: StageInterface, props: OnRunProps) => {
                      executeActions(stageJSON.onEnd!, props);
                  }
                : undefined;

            return new Stage(stageJSON.id, {
                name: stageJSON.name,
                description: stageJSON.description,
                adviceDescription: stageJSON.adviceDescription,
                image: stageJSON.image,
                flags: stageJSON.flags as any,
                flagsRequired: stageJSON.flagsRequired as any,
                requestDescriptionToStart: stageJSON.requestDescriptionToStart,
                deltaDateRequired: stageJSON.deltaDateRequired,
                onStart,
                onEnd,
            });
        });

        const onStart = questJSON.onStart
            ? (_quest: QuestInterface, props: OnRunProps) => {
                  executeActions(questJSON.onStart!, props);
              }
            : undefined;

        const onNextStage = questJSON.onNextStage
            ? (_stage: StageInterface, props: OnRunProps) => {
                  executeActions(questJSON.onNextStage!, props);
              }
            : undefined;

        const quest = new Quest(questJSON.id, stages, {
            name: questJSON.name,
            description: questJSON.description,
            image: questJSON.image,
            inDevelopment: questJSON.inDevelopment,
            onStart,
            onNextStage: onNextStage as any,
        });

        RegisteredQuests.add(quest);

        // 加载相关的 Commitments
        if (questJSON.commitments && questJSON.commitments.length > 0) {
            loadCommitmentsFromJSON(questJSON.commitments);
        }
    });
}

/**
 * 加载日常安排
 */
export function loadCommitmentsFromJSON(commitmentsJSON: CommitmentJSON[]): void {
    const commitments = commitmentsJSON.map(commitJSON => {
        const character = RegisteredCharacters.get(commitJSON.characterId);
        if (!character) {
            throw new Error(`Character "${commitJSON.characterId}" not found for commitment "${commitJSON.id}"`);
        }

        const room = RegisteredRooms.get(commitJSON.roomId);
        if (!room) {
            throw new Error(`Room "${commitJSON.roomId}" not found for commitment "${commitJSON.id}"`);
        }

        let image: string | TimeSlotsImage | undefined;
        if (commitJSON.image) {
            if (typeof commitJSON.image === 'string') {
                image = commitJSON.image;
            } else {
                image = new TimeSlotsImage({
                    morning: commitJSON.image.morning,
                    afternoon: commitJSON.image.afternoon,
                    evening: commitJSON.image.evening,
                    night: commitJSON.image.night,
                });
            }
        }

        let background: string | TimeSlotsImage | undefined;
        if (commitJSON.background) {
            if (typeof commitJSON.background === 'string') {
                background = commitJSON.background;
            } else {
                background = new TimeSlotsImage({
                    morning: commitJSON.background.morning,
                    afternoon: commitJSON.background.afternoon,
                    evening: commitJSON.background.evening,
                    night: commitJSON.background.night,
                });
            }
        }

        const onRun = createCommitmentOnRun(commitJSON.onRun);

        // 创建图标函数（如果需要）
        let icon: React.ReactElement | ((props: Commitment, runProps: OnRunProps) => React.ReactElement) | undefined;
        if (commitJSON.icon) {
            const iconFromJSON = createIconFromJSON(commitJSON.icon, {} as Commitment);
            if (iconFromJSON && typeof iconFromJSON === 'function') {
                // 转换为 Commitment 期望的签名
                icon = (_commitment: Commitment, runProps: OnRunProps) => iconFromJSON(runProps);
            } else if (iconFromJSON) {
                icon = iconFromJSON;
            }
        }

        // 处理 hidden 条件
        let hidden: boolean | (() => boolean) | undefined;
        if (commitJSON.hidden !== undefined) {
            if (typeof commitJSON.hidden === 'boolean') {
                hidden = commitJSON.hidden;
            } else {
                // ConditionJSON - 转换为函数
                hidden = () => {
                    return evaluateCondition(commitJSON.hidden as any, {} as OnRunProps);
                };
            }
        }

        const commitment = new Commitment(commitJSON.id, character, room, {
            name: commitJSON.id,
            image,
            background,
            icon,
            onRun,
            priority: commitJSON.priority,
            timeSlot: commitJSON.timeSlot,
            executionType: commitJSON.executionType as any,
            hidden,
        });

        return commitment;
    });
    RegisteredCommitments.add(commitments);
}

/**
 * 加载标签
 */
export function loadLabelsFromJSON(labelsJSON: LabelJSON[]): void {
    loadLabelsFromJSONUtil(labelsJSON);
}

/**
 * 加载资源清单
 */
export function loadManifestFromJSON(manifestJSON: AssetsManifest): void {
    // 合并到现有的 Assets manifest
    Assets.init({ manifest: manifestJSON });
}
