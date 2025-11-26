/**
 * TypeScript Label 示例源文件
 *
 * 这是基于项目中的 variousActionsLabels.ts 创建的示例文件
 * 展示了如何在 script-package-example 中使用 TypeScript Label
 *
 * 编译命令：
 * tsc labels/variousActionsLabels.ts --target ES2020 --module CommonJS --outDir labels-compiled
 * 或使用 esbuild（更快，推荐）：
 * esbuild labels/variousActionsLabels.ts --bundle --format=cjs --external:@drincs/* --outfile=labels-compiled/variousActionsLabels.js
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
 * - narration: 对话系统对象
 * - newLabel: 创建 Label 的函数
 * - newChoiceOption: 创建选择选项的函数
 * - newCloseChoiceOption: 创建关闭选项的函数
 * - showImage: 显示图片的函数
 * - storage: 存储系统对象
 *
 * 【nqtr API】
 * - RegisteredQuests: 任务注册表
 * - RegisteredCharacters: 角色注册表
 *
 * 【常量】
 * - BACKGROUND_ID: 背景层 ID（值为 "background"）
 *
 * ============================================================================
 */

// 这些导入在编译时用于类型检查，运行时通过 context 注入

// 声明运行时注入的常量

// Label 键常量
const TALK_ALICE_QUEST_KEY = 'talkAliceQuest';
const ALICE_TALK_MENU_LABEL_KEY = 'AliceTalkMenuLabel';

// 获取游戏对象（这些需要在加载 Label 之前已经注册）
const aliceQuest = RegisteredQuests.get('aliceQuest');
const alice = RegisteredCharacters.get('alice');
const mc = RegisteredCharacters.get('mc');

/**
 * 示例：Alice 任务对话 Label
 * 根据任务阶段显示不同的对话内容
 */
const talkAliceQuest = newLabel(TALK_ALICE_QUEST_KEY, () => {
    if (!aliceQuest) {
        return [
            () => {
                narration.dialogue = { text: 'Quest not found' };
            },
        ];
    }

    if (aliceQuest.currentStageIndex == 0) {
        return [
            async () => {
                narration.dialogue = { character: alice, text: 'Hi, can you order me a new book from pc?' };
            },
            () => {
                narration.dialogue = { character: alice, text: 'Ok' };
            },
            () => {
                narration.dialogue = { character: alice, text: 'Thanks' };
            },
            (props) => {
                aliceQuest.goNext(props);
                narration.goNext(props);
            },
        ];
    } else if (aliceQuest.currentStageIndex == 1) {
        return [
            async () => {
                narration.dialogue = { character: mc, text: 'What book do you want me to order?' };
            },
            () => {
                narration.dialogue = { character: alice, text: 'For me it is the same.' };
            },
        ];
    } else if (aliceQuest.currentStageIndex == 2) {
        return [
            async () => {
                narration.dialogue = { character: mc, text: 'I ordered the Book, hope you enjoy it.' };
            },
            () => {
                narration.dialogue = {
                    character: alice,
                    text: 'Great, when it arrives remember to bring it to me.',
                };
            },
        ];
    } else if (aliceQuest.currentStageIndex == 3) {
        return [
            async () => {
                narration.dialogue = { character: mc, text: "Here's your book." };
            },
            () => {
                narration.dialogue = { character: alice, text: 'Thank you, I can finally read something new.' };
            },
            (props) => {
                aliceQuest.goNext(props);
                narration.goNext(props);
            },
        ];
    }
    return [
        () => {
            narration.dialogue = { character: alice, text: 'Thanks for the book.' };
        },
    ];
}, {
    onStepStart: async (stepIndex) => {
        if (stepIndex == 0) {
            await showImage(BACKGROUND_ID, 'alice_terrace0At');
        }
    },
});

/**
 * 示例：Alice 对话菜单 Label
 * 根据任务状态动态显示选项
 */
const aliceTalkMenuLabel = newLabel(ALICE_TALK_MENU_LABEL_KEY, [
    async () => {
        await showImage(BACKGROUND_ID, 'alice_terrace0At');
        narration.dialogue = { character: alice, text: 'Hi, what do you want to talk about?' };
        const optionsMenu = [];
        if (aliceQuest && aliceQuest.started) {
            optionsMenu.push(newChoiceOption('About the book', talkAliceQuest, {}));
        }
        narration.choiceMenuOptions = [...optionsMenu, newCloseChoiceOption('Cancel')];
    },
]);

// 导出所有 Label（CommonJS 格式）
module.exports = {
    talkAliceQuest,
    aliceTalkMenuLabel,
};