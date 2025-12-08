import {
    RegisteredActivities,
    RegisteredCommitments,
    RegisteredQuests,
    RegisteredRooms,
    navigator,
    routine,
    timeTracker,
} from '@drincs/nqtr';
import {
    Label,
    RegisteredCharacters,
    canvas,
    narration,
    newChoiceOption,
    newCloseChoiceOption,
    newLabel,
    showImage,
    storage,
} from '@drincs/pixi-vn';
import { BACKGROUND_ID, NARRATION_ROUTE } from '../constans';
import { navigateAndJumpToLabel } from '../labels/label-utility';

/**
 * TypeScript Label 加载器
 * 从预编译的 JavaScript 文件加载 Label
 */

/**
 * 创建安全的执行环境
 * 提供游戏 API 给脚本使用
 *
 * 注意：
 * - 编译后的 JS 使用 CommonJS 的 `require('@drincs/nqtr')` / `require('@drincs/pixi-vn')`
 * - 这里通过伪造一个简单的 require，把需要的对象映射回去
 */
function createScriptContext() {
    const nqtrModule = {
        navigator,
        routine,
        timeTracker,
        RegisteredQuests,
        RegisteredActivities,
        RegisteredCommitments,
        RegisteredRooms,
    };

    const pixiModule = {
        Label,
        narration,
        newLabel,
        newChoiceOption,
        newCloseChoiceOption,
        showImage,
        storage,
        canvas,
        RegisteredCharacters,
    };

    function require(moduleId: string) {
        switch (moduleId) {
            case '@drincs/nqtr':
                return nqtrModule;
            case '@drincs/pixi-vn':
                return pixiModule;
            // 支持本示例中使用的相对路径常量模块（仅用于 demo）
            case './variousActionsLabelKeys':
            case 'labels-compiled/variousActionsLabelKeys':
                return {
                    ORDER_PRODUCT_LABEL_KEY: 'OrderProductLabel',
                    TAKE_KEY_LABEL_KEY: 'TakeKeyLabel',
                    TALK_SLEEP_LABEL_KEY: 'TalkSleepLabel',
                    TALK_ALICE_QUEST_KEY: 'talkAliceQuest',
                    ALICE_TALK_MENU_LABEL_KEY: 'AliceTalkMenuLabel',
                };
            default:
                console.warn(`[TypeScriptLabelLoader] 未知模块 require('${moduleId}')，返回空对象`);
                return {};
        }
    }

    return {
        // 伪造的 CommonJS require
        require,

        // pixi-vn API
        ...pixiModule,

        // nqtr API
        ...nqtrModule,

        // 工具函数
        navigateAndJumpToLabel,

        // 常量
        BACKGROUND_ID,
        NARRATION_ROUTE,
    };
}

/**
 * 从 JavaScript 代码字符串加载 Label
 * @param code JavaScript 代码字符串
 * @param filename 文件名（用于错误提示）
 */
export async function loadLabelsFromJavaScript(code: string, filename: string = 'unknown'): Promise<Label[]> {
    try {
        // 创建执行上下文
        const context = createScriptContext();
        // 不在解构中重复声明 require，避免 "redeclaration of const require"
        const contextKeys = Object.keys(context).filter(key => key !== 'require');

        // 直接构造一个以 context 为参数的函数
        // 内部再模拟 Node 的 CommonJS 包装器 (exports, require, module) => { ... }
        const functionBody = `
            "use strict";
            const { ${contextKeys.join(', ')} } = context;

            // 模拟 CommonJS 的 module / exports / require
            const module = { exports: {} };
            const exports = module.exports;
            const require = context.require;

            // 用 Node 风格包装脚本，确保 TypeScript 编译后的 CJS 代码能正常工作
            (function (exports, require, module) {
                // 用户脚本开始
                ${code}
                // 用户脚本结束
            })(exports, require, module);

            // 收集导出的 Label
            const labels = [];

            if (module.exports && typeof module.exports === 'object') {
                const exported = module.exports;
                // default 导出
                if (exported.default && exported.default.key) {
                    labels.push(exported.default);
                }
                // 命名导出
                Object.keys(exported).forEach(key => {
                    if (key !== 'default' && exported[key] && exported[key].key) {
                        labels.push(exported[key]);
                    }
                });
            }

            return labels;
        `;

        // 执行代码
        const runScript = new Function('context', functionBody) as (context: any) => unknown;
        const labels = runScript(context);
        if (!Array.isArray(labels)) {
            console.warn(`[${filename}] 脚本没有返回 Label 数组`);
            return [];
        }

        // 过滤并验证 Label
        // 在 pixi-vn 中，Label 一般是带有 key 属性的函数，因此需要同时接受 object 和 function
        const validLabels = labels.filter((label): label is Label => {
            if (!label) return false;
            const t = typeof label;
            return (t === 'object' || t === 'function') && 'key' in label;
        });

        if (validLabels.length === 0) {
            console.warn(`[${filename}] 没有找到有效的 Label 对象`);
        } else {
            console.log(`[${filename}] 成功加载 ${validLabels.length} 个 Label`);
        }

        return validLabels;
    } catch (error) {
        console.error(`[${filename}] 加载 JavaScript Label 失败:`, error);
        throw new Error(`Failed to load JavaScript labels from ${filename}: ${error}`);
    }
}
