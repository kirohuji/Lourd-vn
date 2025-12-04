import { OnRunProps } from '@drincs/nqtr';
import { Label, newLabel, StepLabelResultType } from '@drincs/pixi-vn';
import { LabelJSON, LabelStepJSON } from '../types/json-schema';
import { executeActions, executeStep } from './json-interpreter';

/**
 * JSON 标签加载器
 * 从 JSON 配置创建 Label 对象
 */

/**
 * 创建标签步骤函数数组
 */
function createLabelSteps(steps: LabelStepJSON[]): StepLabelResultType[] {
    return steps.map(step => {
        return async (props: OnRunProps) => {
            await executeStep(step, props);
        };
    });
}

/**
 * 从 JSON 创建 Label 对象
 */
export function loadLabelFromJSON(labelJSON: LabelJSON): Label {
    const steps = createLabelSteps(labelJSON.steps);

    const options: any = {};

    // 处理 onStepStart 回调
    if (labelJSON.onStepStart) {
        options.onStepStart = async (stepIndex: number, props: OnRunProps) => {
            const actions = labelJSON.onStepStart![stepIndex];
            if (actions) {
                await executeActions(actions, props);
            }
        };
    }

    return newLabel(labelJSON.key, () => steps as any, options);
}

/**
 * 批量加载标签
 */
export function loadLabelsFromJSON(labelsJSON: LabelJSON[]): Label[] {
    return labelsJSON.map(labelJSON => loadLabelFromJSON(labelJSON));
}
