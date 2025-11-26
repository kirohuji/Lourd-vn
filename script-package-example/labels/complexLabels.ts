/**
 * TypeScript Label 示例源文件
 *
 * 这是创作者应该编写的 TypeScript 源文件
 * 编译后应该生成 complexLabels.js
 *
 * 编译命令：
 * tsc labels/complexLabels.ts --target ES2020 --module CommonJS --outDir labels-compiled
 * 或使用 esbuild（更快，推荐）：
 * esbuild labels/complexLabels.ts --bundle --format=cjs --external:@drincs/* --outfile=labels-compiled/complexLabels.js
 *
 * 注意：
 * 1. 这些导入在编译时用于类型检查，运行时通过 context 注入，不需要实际打包
 * 2. 使用 esbuild 时，必须使用 --external:@drincs/* 避免打包这些依赖
 * 3. 如果使用 tsc，需要确保类型定义文件可用（用于类型检查）
 */

/**
 * ============================================================================
 * 运行时注入的上下文（所有以下 API 都会在运行时自动注入，无需导入）
 * ============================================================================
 *
 * 【pixi-vn API】
 * - narration: 对话系统对象，用于设置对话内容和选择菜单
 *   - narration.dialogue: 设置当前对话 { character?, text }
 *   - narration.choiceMenuOptions: 设置选择菜单选项数组
 * - newLabel: 创建 Label 的函数
 * - newChoiceOption: 创建选择选项的函数 (text, labelKey, params)
 * - newCloseChoiceOption: 创建关闭选项的函数 (text)
 * - showImage: 显示图片的函数 (layerId, imageId)
 * - storage: 存储系统对象
 *   - storage.getFlag(flagName): 获取布尔标志
 *   - storage.setFlag(flagName, value): 设置布尔标志
 * - canvas: 画布操作对象，用于添加图形元素
 *
 * 【nqtr API】
 * - navigator: 导航系统对象
 *   - navigator.currentRoom: 当前房间对象
 *   - navigator.navigateTo(route): 导航到指定路由
 * - routine: 日常安排系统对象
 *   - routine.add(commitment): 添加日常安排
 *   - routine.remove(commitment): 移除日常安排
 * - timeTracker: 时间追踪对象
 *   - timeTracker.currentTime: 当前时间
 *   - timeTracker.currentDay: 当前天数
 * - RegisteredQuests: 任务注册表
 *   - RegisteredQuests.get(questId): 获取任务对象
 * - RegisteredActivities: 活动注册表
 *   - RegisteredActivities.get(activityId): 获取活动对象
 * - RegisteredCommitments: 日常安排注册表
 *   - RegisteredCommitments.get(commitmentId): 获取日常安排对象
 * - RegisteredRooms: 房间注册表
 *   - RegisteredRooms.get(roomId): 获取房间对象
 * - RegisteredCharacters: 角色注册表
 *   - RegisteredCharacters.get(characterId): 获取角色对象
 *
 * 【工具函数】
 * - navigateAndJumpToLabel: 导航并跳转到指定 Label
 *   - navigateAndJumpToLabel(label, route, event?)
 *
 * 【常量】
 * - BACKGROUND_ID: 背景层 ID（值为 "background"）
 * - NARRATION_ROUTE: 对话路由（值为 "/narration"）
 *
 * ============================================================================
 */

// 这些导入在编译时用于类型检查，运行时通过 context 注入
// 运行时不需要实际的模块导入，加载器会自动注入这些 API
import { RegisteredQuests } from '@drincs/nqtr';
import {
    narration,
    newChoiceOption,
    newCloseChoiceOption,
    newLabel,
    RegisteredCharacters,
    showImage,
} from '@drincs/pixi-vn';

// 声明运行时注入的常量（使用类型声明告诉 TypeScript 这些变量会在运行时可用）
declare const BACKGROUND_ID: string;
declare const NARRATION_ROUTE: string;
declare const storage: any; // 存储系统
declare const navigator: any; // 导航系统
declare const routine: any; // 日常安排系统
declare const timeTracker: any; // 时间追踪系统
declare const RegisteredActivities: any; // 活动注册表
declare const RegisteredCommitments: any; // 日常安排注册表
declare const RegisteredRooms: any; // 房间注册表
declare const navigateAndJumpToLabel: any; // 导航工具函数

// 获取游戏对象（这些需要在加载 Label 之前已经注册）
const aliceQuest = RegisteredQuests.get('aliceQuest');
const alice = RegisteredCharacters.get('alice');
const mc = RegisteredCharacters.get('mc');

/**
 * 示例 1: 复杂的条件判断 Label
 * 展示 TypeScript 的强大功能
 */
export const complexConditionLabel = newLabel('complexConditionLabel', () => {
    if (!aliceQuest) {
        return [
            () => {
                narration.dialogue = { text: 'Quest not found' };
            },
        ];
    }

    const stage = aliceQuest.currentStageIndex;
    const isStarted = aliceQuest.started;
    const random = Math.random();

    // 复杂的条件逻辑
    if (stage === 0 && isStarted && random > 0.5) {
        return [
            async () => {
                narration.dialogue = {
                    character: alice,
                    text: 'Random dialogue! The quest has started.',
                };
            },
            () => {
                narration.dialogue = {
                    character: mc,
                    text: 'This is a random event!',
                };
            },
        ];
    }

    if (stage === 0) {
        return [
            () => {
                narration.dialogue = {
                    character: alice,
                    text: 'Normal dialogue for stage 0',
                };
            },
        ];
    }

    return [
        () => {
            narration.dialogue = {
                character: alice,
                text: 'Default dialogue',
            };
        },
    ];
});

/**
 * 示例 2: 动态选择菜单 Label
 * 根据游戏状态动态生成选项
 */
export const dynamicMenuLabel = newLabel('dynamicMenuLabel', [
    async () => {
        // BACKGROUND_ID 在运行时通过 context 注入
        await showImage(BACKGROUND_ID, 'alice_terrace0At');
        narration.dialogue = {
            character: alice,
            text: 'What would you like to do?',
        };

        const options: any[] = [];

        // 根据任务状态动态添加选项
        if (aliceQuest && aliceQuest.started) {
            options.push(newChoiceOption('About the quest', complexConditionLabel, {}));
        }

        // 总是添加取消选项
        options.push(newCloseChoiceOption('Cancel'));

        narration.choiceMenuOptions = options;
    },
]);

/**
 * 示例 3: 使用循环和数组的 Label
 * 展示 TypeScript 的数组操作能力
 */
export const arrayBasedLabel = newLabel('arrayBasedLabel', () => {
    const dialogues = ['First dialogue', 'Second dialogue', 'Third dialogue'];

    // 使用 map 创建步骤数组
    return dialogues.map((text, index) => {
        return () => {
            narration.dialogue = {
                character: index % 2 === 0 ? alice : mc,
                text: text,
            };
        };
    }) as any;
});

/**
 * 示例 4: 综合使用所有注入的上下文
 * 展示如何使用 storage、navigator、timeTracker 等 API
 */
export const comprehensiveExampleLabel = newLabel('comprehensiveExampleLabel', [
    async () => {
        // 1. 显示背景图片
        await showImage(BACKGROUND_ID, 'alice_terrace0At');

        // 2. 获取当前时间和房间信息
        const currentDay = timeTracker.currentDay;
        const currentTime = timeTracker.currentTime;
        const currentRoom = navigator.currentRoom;

        // 3. 检查存储标志
        const hasMetBefore = storage.getFlag('hasMetAlice');
        const visitCount = storage.getFlag('visitCount') || 0;

        // 4. 根据游戏状态显示不同的对话
        if (!hasMetBefore) {
            narration.dialogue = {
                character: alice,
                text: `Hello! This is day ${currentDay}. Nice to meet you!`,
            };
            storage.setFlag('hasMetAlice', true);
        } else {
            narration.dialogue = {
                character: alice,
                text: `Welcome back! You've visited ${visitCount + 1} times. Current time: ${currentTime}:00`,
            };
            storage.setFlag('visitCount', visitCount + 1);
        }
    },
    () => {
        // 5. 显示选择菜单，根据任务状态动态生成选项
        const options: any[] = [];

        // 检查任务状态
        if (aliceQuest && aliceQuest.started) {
            options.push(newChoiceOption('About the quest', complexConditionLabel, {}));
        }

        // 检查当前房间（从 navigator 重新获取，因为每个步骤是独立的）
        const currentRoom = navigator.currentRoom;
        if (currentRoom) {
            options.push(newChoiceOption(`Explore ${currentRoom.name}`, arrayBasedLabel, {}));
        }

        // 总是添加关闭选项
        options.push(newCloseChoiceOption('Leave'));

        narration.choiceMenuOptions = options;
    },
]);
