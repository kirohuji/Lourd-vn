import { AssetsManifest } from '@drincs/pixi-vn';
import { importInkText } from '@drincs/pixi-vn-ink';
import JSZip from 'jszip';
import {
    ActivityJSON,
    CharacterJSON,
    CommitmentJSON,
    LabelJSON,
    LocationJSON,
    MapJSON,
    QuestJSON,
    RoomJSON,
    ScriptPackageMetadata,
} from '../types/json-schema';
import {
    loadActivitiesFromJSON,
    loadCharactersFromJSON,
    loadCommitmentsFromJSON,
    loadLabelsFromJSON,
    loadLocationsFromJSON,
    loadManifestFromJSON,
    loadMapsFromJSON,
    loadQuestsFromJSON,
    loadRoomsFromJSON,
} from './script-package-loader';

/**
 * 剧本包导入器
 * 从 ZIP 文件加载整个剧本包
 */

/**
 * 导入剧本包
 */
export async function importScriptPackage(file: File): Promise<ScriptPackageMetadata> {
    const zip = await JSZip.loadAsync(file);
    return await loadFromZip(zip);
}

/**
 * 从 ZIP 对象加载所有数据
 */
async function loadFromZip(zip: JSZip): Promise<ScriptPackageMetadata> {
    // 1. 读取 package.json
    const packageJsonFile = zip.file('package.json');
    if (!packageJsonFile) {
        throw new Error('package.json not found in script package');
    }
    const packageJsonContent = await packageJsonFile.async('string');
    const metadata: ScriptPackageMetadata = JSON.parse(packageJsonContent);

    // 2. 读取 manifest.json
    const manifestFile = zip.file('manifest.json');
    if (manifestFile) {
        const manifestContent = await manifestFile.async('string');
        const manifest: AssetsManifest = JSON.parse(manifestContent);
        loadManifestFromJSON(manifest);
    }

    // 3. 读取 values/ 文件夹下的 JSON 文件
    const valuesFolder = zip.folder('values');
    if (valuesFolder) {
        // 3.1 加载角色（最先加载，其他对象可能依赖）
        const charactersFile = valuesFolder.file('characters.json');
        if (charactersFile) {
            const charactersContent = await charactersFile.async('string');
            const characters: CharacterJSON[] = JSON.parse(charactersContent);
            loadCharactersFromJSON(characters);
        }

        // 3.2 加载地图
        const mapsFile = valuesFolder.file('maps.json');
        if (mapsFile) {
            const mapsContent = await mapsFile.async('string');
            const maps: MapJSON[] = JSON.parse(mapsContent);
            loadMapsFromJSON(maps);
        }

        // 3.3 加载地点（依赖地图）
        const locationsFile = valuesFolder.file('locations.json');
        if (locationsFile) {
            const locationsContent = await locationsFile.async('string');
            const locations: LocationJSON[] = JSON.parse(locationsContent);
            loadLocationsFromJSON(locations);
        }

        // 3.4 加载房间（依赖地点）
        const roomsFile = valuesFolder.file('rooms.json');
        if (roomsFile) {
            const roomsContent = await roomsFile.async('string');
            const rooms: RoomJSON[] = JSON.parse(roomsContent);
            loadRoomsFromJSON(rooms);
        }

        // 3.5 加载标签（在活动之前，因为活动可能依赖标签）
        const labelsFolder = zip.folder('labels');
        if (labelsFolder) {
            const labelFiles: LabelJSON[] = [];
            // 等待所有文件读取完成
            const labelFileEntries = Object.entries(labelsFolder).filter(
                ([relativePath]) => relativePath.endsWith('.json') && !relativePath.endsWith('LabelKeys.json'),
            );
            await Promise.all(
                labelFileEntries.map(async ([_relativePath, file]) => {
                    const content = await file.async('string');
                    try {
                        const labels: LabelJSON[] = JSON.parse(content);
                        labelFiles.push(...labels);
                    } catch (e) {
                        // 可能是单个对象而不是数组
                        const label: LabelJSON = JSON.parse(content);
                        labelFiles.push(label);
                    }
                }),
            );
            if (labelFiles.length > 0) {
                loadLabelsFromJSON(labelFiles);
            }
        }

        // 3.6 加载活动（依赖标签）
        const activitiesFile = valuesFolder.file('activities.json');
        if (activitiesFile) {
            const activitiesContent = await activitiesFile.async('string');
            const activities: ActivityJSON[] = JSON.parse(activitiesContent);
            loadActivitiesFromJSON(activities);
        }

        // 3.7 加载任务（依赖活动和房间）
        const questsFolder = valuesFolder.folder('quests');
        if (questsFolder) {
            const questFileEntries = Object.entries(questsFolder).filter(([relativePath]) => relativePath.endsWith('.json'));
            await Promise.all(
                questFileEntries.map(async ([_relativePath, file]) => {
                    const content = await file.async('string');
                    const quest: QuestJSON = JSON.parse(content);
                    loadQuestsFromJSON([quest]);
                }),
            );
        }

        // 3.8 加载日常安排（依赖角色、房间、标签）
        const routineFile = valuesFolder.file('routine.json');
        if (routineFile) {
            const routineContent = await routineFile.async('string');
            const commitments: CommitmentJSON[] = JSON.parse(routineContent);
            loadCommitmentsFromJSON(commitments);
        }
    }

    // 4. 加载 ink 文件
    const inkFolder = zip.folder('ink');
    if (inkFolder) {
        const inkFiles: string[] = [];
        const inkFileEntries = Object.entries(inkFolder).filter(([relativePath]) => relativePath.endsWith('.ink'));
        await Promise.all(
            inkFileEntries.map(async ([_relativePath, file]) => {
                const content = await file.async('string');
                inkFiles.push(content);
            }),
        );
        if (inkFiles.length > 0) {
            await importInkText(inkFiles);
        }
    }

    return metadata;
}
