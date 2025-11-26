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
 */
function createScriptContext() {
    return {
        // pixi-vn API
        narration,
        newLabel,
        newChoiceOption,
        newCloseChoiceOption,
        showImage,
        storage,
        canvas,

        // nqtr API
        navigator,
        routine,
        timeTracker,
        RegisteredQuests,
        RegisteredActivities,
        RegisteredCommitments,
        RegisteredRooms,
        RegisteredCharacters,

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
        const contextKeys = Object.keys(context);

        // 包装代码为 IIFE，注入上下文
        // 支持 CommonJS 和 ES Module 两种导出格式
        const wrappedCode = `
            (function(context) {
                const { ${contextKeys.join(', ')} } = context;
                
                // 模拟 module.exports 和 exports
                const module = { exports: {} };
                const exports = module.exports;
                
                ${code}
                
                // 收集导出的 Label
                const labels = [];
                
                // 检查 CommonJS 导出
                if (module.exports && typeof module.exports === 'object') {
                    const exports = module.exports;
                    // 检查 default 导出
                    if (exports.default && exports.default.key) {
                        labels.push(exports.default);
                    }
                    // 检查命名导出
                    Object.keys(exports).forEach(key => {
                        if (key !== 'default' && exports[key] && exports[key].key) {
                            labels.push(exports[key]);
                        }
                    });
                }
                
                return labels;
            })
        `;

        // 执行代码
        const factory = new Function('return ' + wrappedCode)();
        const labels = factory(context);

        if (!Array.isArray(labels)) {
            console.warn(`[${filename}] 脚本没有返回 Label 数组`);
            return [];
        }

        // 过滤并验证 Label
        const validLabels = labels.filter(
            (label): label is Label => label && typeof label === 'object' && 'key' in label,
        );

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
