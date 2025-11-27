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
import { loadLabelsFromJavaScript } from './typescript-label-loader';

/**
 * 剧本包导入器
 * 从 ZIP 文件加载整个剧本包
 *
 * 约定：
 * - 不再使用 zip.folder(...) 来遍历文件夹
 * - 统一通过 Object.keys(zip.files) + path.startsWith(...) 过滤需要的文件
 * - 通过一个通用的 findFile 辅助函数来查找单个文件（支持顶层目录包裹）
 */

/**
 * 别名到 URL 的映射
 */
export interface AliasToUrlMap {
    [alias: string]: string;
}

/**
 * 分析结果接口
 */
export interface TypeScriptLabelFile {
    path: string;
    content: string;
}

export interface ScriptPackageAnalysis {
    metadata: ScriptPackageMetadata;
    hasManifest: boolean;
    characters: number;
    maps: number;
    locations: number;
    rooms: number;
    labels: number;
    activities: number;
    quests: number;
    commitments: number;
    inkFiles: number;
    typescriptLabels: number;
    errors?: string[];
    // 别名到 URL 的映射
    aliasToUrlMap?: AliasToUrlMap;
    // 详细数据
    charactersData?: CharacterJSON[];
    mapsData?: MapJSON[];
    locationsData?: LocationJSON[];
    roomsData?: RoomJSON[];
    labelsData?: LabelJSON[];
    activitiesData?: ActivityJSON[];
    questsData?: QuestJSON[];
    commitmentsData?: CommitmentJSON[];
    inkFilesData?: string[];
    typescriptLabelsData?: TypeScriptLabelFile[];
}

/**
 * 内部工具：基于 allFiles 和 basePath 创建通用的 findFile 助手
 */
function createFindFile(
    zip: JSZip,
    allFiles: string[],
    basePath: string,
): (fileName: string, folder?: string) => JSZip.JSZipObject | null {
    return (fileName: string, folder?: string): JSZip.JSZipObject | null => {
        let fullPath = fileName;
        if (folder) {
            fullPath = `${folder}/${fileName}`;
        }

        // 1. 直接路径
        let file = zip.file(fullPath);
        if (file) return file;

        // 2. 加上顶层目录前缀
        if (basePath) {
            file = zip.file(`${basePath}${fullPath}`);
            if (file) return file;
        }

        // 3. 在所有文件里按文件名搜索（排除 node_modules）
        const foundPath = allFiles.find(path => {
            const parts = path.split('/');
            const lastPart = parts[parts.length - 1];
            return lastPart === fileName && !path.includes('node_modules');
        });

        return foundPath ? zip.file(foundPath) : null;
    };
}

/**
 * 分析剧本包（不实际导入）
 */
export async function analyzeScriptPackage(file: File): Promise<ScriptPackageAnalysis> {
    const zip = await JSZip.loadAsync(file);
    const errors: string[] = [];
    const allFiles = Object.keys(zip.files);
    console.log('ZIP 文件中的所有路径:', allFiles);

    // 检测顶层文件夹（例如 "script-package-example/"）
    const topLevelFolder = allFiles.find(path => path.endsWith('/') && path.split('/').length === 2);
    const basePath = topLevelFolder ? topLevelFolder : '';

    const findFile = createFindFile(zip, allFiles, basePath);

    // 辅助函数：解析 JSON 文件并返回数组长度和数据
    const parseJsonFile = async <T>(
        file: JSZip.JSZipObject | null,
        defaultValue: number = 0,
    ): Promise<{ count: number; data?: T[] }> => {
        if (!file) return { count: defaultValue };
        try {
            const content = await file.async('string');
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                return { count: data.length, data };
            }
            return { count: 1, data: [data] as T[] };
        } catch (e) {
            errors.push(`Failed to parse ${file.name}: ${e}`);
            return { count: defaultValue };
        }
    };

    // 1. 读取 package.json
    const packageJsonFile = findFile('package.json');
    if (!packageJsonFile) {
        throw new Error(
            `package.json not found in script package.\n` +
                `ZIP 文件中的前10个文件: ${allFiles.slice(0, 10).join(', ')}\n` +
                `请确保 package.json 在 ZIP 文件的根目录中。`,
        );
    }

    const packageJsonContent = await packageJsonFile.async('string');
    let metadata: ScriptPackageMetadata;
    try {
        metadata = JSON.parse(packageJsonContent);
    } catch (e) {
        throw new Error(`Failed to parse package.json: ${e}`);
    }

    // 2. 解析 manifest.json 并建立别名到 URL 的映射
    const manifestFile = findFile('manifest.json');
    const aliasToUrlMap: AliasToUrlMap = {};
    if (manifestFile) {
        try {
            const manifestContent = await manifestFile.async('string');
            const manifest: any = JSON.parse(manifestContent);
            if (manifest.bundles && Array.isArray(manifest.bundles)) {
                manifest.bundles.forEach((bundle: any) => {
                    if (bundle.assets && Array.isArray(bundle.assets)) {
                        bundle.assets.forEach((asset: any) => {
                            if (asset.alias && asset.src) {
                                aliasToUrlMap[asset.alias] = asset.src;
                            }
                        });
                    }
                });
            }
        } catch (e) {
            errors.push(`Failed to parse manifest.json: ${e}`);
        }
    }
    const hasManifest = !!manifestFile;

    // 3. 分析 values/ 文件夹下的文件
    const valuesPath = basePath ? `${basePath}values/` : 'values/';
    const charactersResult = await parseJsonFile<CharacterJSON>(findFile('characters.json', 'values'));
    const mapsResult = await parseJsonFile<MapJSON>(findFile('maps.json', 'values'));
    const locationsResult = await parseJsonFile<LocationJSON>(findFile('locations.json', 'values'));
    const roomsResult = await parseJsonFile<RoomJSON>(findFile('rooms.json', 'values'));
    const activitiesResult = await parseJsonFile<ActivityJSON>(findFile('activities.json', 'values'));
    const commitmentsResult = await parseJsonFile<CommitmentJSON>(findFile('routine.json', 'values'));

    // 3.7 分析任务（在 values/quests/ 文件夹下）
    const questsFolder = valuesPath + 'quests/';
    const questFilePaths = allFiles.filter(
        path => path.startsWith(questsFolder) && path.endsWith('.json') && !path.endsWith('/'),
    );
    const questsData: QuestJSON[] = [];
    for (const questPath of questFilePaths) {
        const file = zip.file(questPath);
        if (file) {
            try {
                const content = await file.async('string');
                const questData: QuestJSON = JSON.parse(content);
                questsData.push(questData);
            } catch (e) {
                errors.push(`Failed to parse quest file ${questPath}: ${e}`);
            }
        }
    }

    // 4. 分析标签（JSON）
    const labelsPath = basePath ? `${basePath}labels/` : 'labels/';
    const labelFiles = allFiles.filter(
        path =>
            path.startsWith(labelsPath) &&
            path.endsWith('.json') &&
            !path.endsWith('LabelKeys.json') &&
            !path.endsWith('/'),
    );

    const labelsData: LabelJSON[] = [];
    for (const labelPath of labelFiles) {
        const file = zip.file(labelPath);
        if (file) {
            try {
                const content = await file.async('string');
                const labelData: LabelJSON | LabelJSON[] = JSON.parse(content);
                if (Array.isArray(labelData)) {
                    labelsData.push(...labelData);
                } else {
                    labelsData.push(labelData);
                }
            } catch (e) {
                errors.push(`Failed to parse label file ${labelPath}: ${e}`);
            }
        }
    }

    // 5. 分析 ink 文件
    const inkPath = basePath ? `${basePath}ink/` : 'ink/';
    const inkFilePaths = allFiles.filter(
        path => path.startsWith(inkPath) && path.endsWith('.ink') && !path.endsWith('/'),
    );
    const inkFilesData: string[] = [];
    for (const inkFilePath of inkFilePaths) {
        const file = zip.file(inkFilePath);
        if (file) {
            try {
                await file.async('string'); // 验证文件可读
                inkFilesData.push(inkFilePath);
            } catch (e) {
                errors.push(`Failed to read ink file ${inkFilePath}: ${e}`);
            }
        }
    }

    // 6. 分析 TypeScript Label 源文件
    const typescriptLabelsData: TypeScriptLabelFile[] = [];
    const tsLabelFilePaths = allFiles.filter(
        path => path.startsWith(labelsPath) && path.endsWith('.ts') && !path.endsWith('.d.ts') && !path.endsWith('/'),
    );
    for (const tsLabelFilePath of tsLabelFilePaths) {
        const file = zip.file(tsLabelFilePath);
        if (file) {
            try {
                const content = await file.async('string');
                typescriptLabelsData.push({
                    path: tsLabelFilePath,
                    content: content,
                });
            } catch (e) {
                errors.push(`Failed to read TypeScript label file ${tsLabelFilePath}: ${e}`);
            }
        }
    }

    return {
        metadata,
        hasManifest,
        characters: charactersResult.count,
        maps: mapsResult.count,
        locations: locationsResult.count,
        rooms: roomsResult.count,
        labels: labelsData.length,
        activities: activitiesResult.count,
        quests: questsData.length,
        commitments: commitmentsResult.count,
        inkFiles: inkFilesData.length,
        typescriptLabels: typescriptLabelsData.length,
        errors: errors.length > 0 ? errors : undefined,
        // 别名到 URL 的映射
        aliasToUrlMap: Object.keys(aliasToUrlMap).length > 0 ? aliasToUrlMap : undefined,
        // 详细数据
        charactersData: charactersResult.data,
        mapsData: mapsResult.data,
        locationsData: locationsResult.data,
        roomsData: roomsResult.data,
        labelsData: labelsData.length > 0 ? labelsData : undefined,
        activitiesData: activitiesResult.data,
        questsData: questsData.length > 0 ? questsData : undefined,
        commitmentsData: commitmentsResult.data,
        inkFilesData: inkFilesData.length > 0 ? inkFilesData : undefined,
        typescriptLabelsData: typescriptLabelsData.length > 0 ? typescriptLabelsData : undefined,
    };
}

/**
 * 导入剧本包（真正把数据灌进各个 loader）
 */
export async function importScriptPackage(file: File): Promise<ScriptPackageMetadata> {
    const zip = await JSZip.loadAsync(file);
    return await loadFromZip(zip);
}

/**
 * 从 ZIP 对象加载所有数据
 */
async function loadFromZip(zip: JSZip): Promise<ScriptPackageMetadata> {
    const allFiles = Object.keys(zip.files);
    const topLevelFolder = allFiles.find(path => path.endsWith('/') && path.split('/').length === 2);
    const basePath = topLevelFolder ? topLevelFolder : '';

    const findFile = createFindFile(zip, allFiles, basePath);

    // 1. 读取 package.json
    const packageJsonFile = findFile('package.json');
    if (!packageJsonFile) {
        throw new Error('package.json not found in script package');
    }
    const packageJsonContent = await packageJsonFile.async('string');
    const metadata: ScriptPackageMetadata = JSON.parse(packageJsonContent);

    // 2. 读取 manifest.json
    const manifestFile = findFile('manifest.json');
    if (manifestFile) {
        const manifestContent = await manifestFile.async('string');
        const manifest: AssetsManifest = JSON.parse(manifestContent);
        loadManifestFromJSON(manifest);
    }

    // 3. 加载 values/ 下的 JSON 文件
    const valuesPath = basePath ? `${basePath}values/` : 'values/';

    // 3.1 角色
    const charactersFile = findFile('characters.json', 'values');
    if (charactersFile) {
        const charactersContent = await charactersFile.async('string');
        const characters: CharacterJSON[] = JSON.parse(charactersContent);
        loadCharactersFromJSON(characters);
    }

    // 3.2 地图
    const mapsFile = findFile('maps.json', 'values');
    if (mapsFile) {
        const mapsContent = await mapsFile.async('string');
        const maps: MapJSON[] = JSON.parse(mapsContent);
        loadMapsFromJSON(maps);
    }

    // 3.3 地点
    const locationsFile = findFile('locations.json', 'values');
    if (locationsFile) {
        const locationsContent = await locationsFile.async('string');
        const locations: LocationJSON[] = JSON.parse(locationsContent);
        loadLocationsFromJSON(locations);
    }

    // 3.4 房间
    const roomsFile = findFile('rooms.json', 'values');
    if (roomsFile) {
        const roomsContent = await roomsFile.async('string');
        const rooms: RoomJSON[] = JSON.parse(roomsContent);
        loadRoomsFromJSON(rooms);
    }

    // 3.5 标签（JSON + 预编译 JS）
    const labelsPath = basePath ? `${basePath}labels/` : 'labels/';

    // 3.5.1 JSON 标签
    const labelJsonPaths = allFiles.filter(
        path =>
            path.startsWith(labelsPath) &&
            path.endsWith('.json') &&
            !path.endsWith('LabelKeys.json') &&
            !path.endsWith('/'),
    );

    const labelFiles: LabelJSON[] = [];
    for (const labelPath of labelJsonPaths) {
        const file = zip.file(labelPath);
        if (!file) continue;
        const content = await file.async('string');
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                labelFiles.push(...(parsed as LabelJSON[]));
            } else {
                labelFiles.push(parsed as LabelJSON);
            }
        } catch (e) {
            console.error(`[${labelPath}] 解析 JSON 标签失败:`, e);
        }
    }
    if (labelFiles.length > 0) {
        loadLabelsFromJSON(labelFiles);
    }

    // 3.5.2 预编译 TypeScript（labels-compiled/*.js）
    const labelsCompiledPath = basePath ? `${basePath}labels-compiled/` : 'labels-compiled/';
    const jsLabelFilePaths = allFiles.filter(
        path =>
            path.startsWith(labelsCompiledPath) &&
            path.endsWith('.js') &&
            !path.endsWith('.min.js') &&
            !path.endsWith('/'),
    );

    for (const jsPath of jsLabelFilePaths) {
        const file = zip.file(jsPath);
        if (!file) continue;
        try {
            const content = await file.async('string');
            // 去掉 basePath 前缀，只保留相对于脚本包根目录的路径，方便日志和调试
            const relativeForLog = basePath && jsPath.startsWith(basePath) ? jsPath.slice(basePath.length) : jsPath;
            const labels = await loadLabelsFromJavaScript(content, relativeForLog);
            console.log(`[${relativeForLog}] 成功加载 ${labels.length} 个 JavaScript Label`);
        } catch (e) {
            console.error(`[${jsPath}] 加载 JavaScript Label 失败:`, e);
        }
    }

    // 3.6 活动（依赖标签）
    const activitiesFile = findFile('activities.json', 'values');
    if (activitiesFile) {
        const activitiesContent = await activitiesFile.async('string');
        const activities: ActivityJSON[] = JSON.parse(activitiesContent);
        loadActivitiesFromJSON(activities);
    }

    // 3.7 任务（values/quests/*.json）
    const questsFolder = valuesPath + 'quests/';
    const questFilePaths = allFiles.filter(
        path => path.startsWith(questsFolder) && path.endsWith('.json') && !path.endsWith('/'),
    );
    for (const questPath of questFilePaths) {
        const file = zip.file(questPath);
        if (!file) continue;
        try {
            const content = await file.async('string');
            const quest: QuestJSON = JSON.parse(content);
            loadQuestsFromJSON([quest]);
        } catch (e) {
            console.error(`[${questPath}] 解析任务失败:`, e);
        }
    }

    // 3.8 日常安排（routine.json）
    const routineFile = findFile('routine.json', 'values');
    if (routineFile) {
        const routineContent = await routineFile.async('string');
        const commitments: CommitmentJSON[] = JSON.parse(routineContent);
        loadCommitmentsFromJSON(commitments);
    }

    // 4. 加载 ink 文件
    const inkPath = basePath ? `${basePath}ink/` : 'ink/';
    const inkFilePaths = allFiles.filter(
        path => path.startsWith(inkPath) && path.endsWith('.ink') && !path.endsWith('/'),
    );
    const inkFiles: string[] = [];
    for (const inkFilePath of inkFilePaths) {
        const file = zip.file(inkFilePath);
        if (!file) continue;
        try {
            const content = await file.async('string');
            inkFiles.push(content);
        } catch (e) {
            console.error(`[${inkFilePath}] 读取 ink 文件失败:`, e);
        }
    }
    if (inkFiles.length > 0) {
        await importInkText(inkFiles);
    }

    return metadata;
}
