import {
    OnRunProps,
    RegisteredActivities,
    RegisteredCommitments,
    RegisteredQuests,
    RegisteredRooms,
    navigator,
    routine,
    timeTracker,
} from '@drincs/nqtr';
import {
    RegisteredCharacters,
    canvas,
    narration,
    newChoiceOption,
    newCloseChoiceOption,
    showImage,
    storage,
} from '@drincs/pixi-vn';
import { NARRATION_ROUTE } from '../constans';
import { navigateAndJumpToLabel } from '../labels/label-utility';
import { ActionJSON, ConditionJSON, LabelStepJSON } from '../types/json-schema';
import { convertMultiTypeSprite } from './image-utility';

/**
 * JSON 运行时解释器
 * 执行 JSON 配置中的条件判断和动作序列
 */

/**
 * 评估条件表达式
 */
export function evaluateCondition(condition: ConditionJSON, _props: OnRunProps): boolean {
    switch (condition.type) {
        case 'questStage':
            if (condition.questId) {
                const quest = RegisteredQuests.get(condition.questId);
                if (quest) {
                    const currentStage = quest.currentStageIndex ?? 0;
                    const targetStage = condition.stageIndex ?? 0;
                    const op = condition.operator || '==';

                    switch (op) {
                        case '==':
                            return currentStage === targetStage;
                        case '!=':
                            return currentStage !== targetStage;
                        case '>':
                            return currentStage > targetStage;
                        case '<':
                            return currentStage < targetStage;
                        case '>=':
                            return currentStage >= targetStage;
                        case '<=':
                            return currentStage <= targetStage;
                        default:
                            return false;
                    }
                }
            }
            return false;

        case 'questStarted':
            if (condition.questId) {
                const quest = RegisteredQuests.get(condition.questId);
                return quest ? quest.started : false;
            }
            return false;

        case 'time':
            if (condition.timeFrom !== undefined && condition.timeTo !== undefined) {
                return timeTracker.nowIsBetween(condition.timeFrom, condition.timeTo);
            }
            return false;

        case 'flag':
            if (condition.flagName) {
                const flagValue = storage.getFlag(condition.flagName);
                if (condition.flagValue !== undefined) {
                    return flagValue === condition.flagValue;
                }
                return flagValue;
            }
            return false;

        case 'room':
            if (condition.roomId) {
                return navigator.currentRoom?.id === condition.roomId;
            }
            return false;

        case 'isWeekend':
            return timeTracker.isWeekend;

        default:
            return false;
    }
}

/**
 * 执行单个动作
 */
export async function executeAction(action: ActionJSON, props: OnRunProps): Promise<void> {
    switch (action.type) {
        case 'showImage':
            if (action.layerId && action.imageId) {
                await showImage(action.layerId, action.imageId);
            }
            break;

        case 'setDialogue':
            if (action.dialogue) {
                const character = action.dialogue.character
                    ? RegisteredCharacters.get(action.dialogue.character)
                    : undefined;
                narration.dialogue = {
                    character,
                    text: action.dialogue.text,
                };
            }
            break;

        case 'setChoices':
            if (action.choices) {
                const choiceOptions = action.choices
                    .filter(choice => {
                        // 过滤条件选择
                        if (choice.condition) {
                            return evaluateCondition(choice.condition, props);
                        }
                        return true;
                    })
                    .map(choice => {
                        if (choice.type === 'close') {
                            return newCloseChoiceOption(choice.text);
                        }
                        if (choice.labelKey) {
                            return newChoiceOption(choice.text, choice.labelKey, choice.params || {});
                        }
                        return newCloseChoiceOption(choice.text);
                    });
                narration.choiceMenuOptions = choiceOptions;
            }
            break;

        case 'questNext':
            if (action.questId) {
                const quest = RegisteredQuests.get(action.questId);
                if (quest) {
                    quest.goNext(props);
                }
            }
            break;

        case 'addActivity':
            if (action.activityId && action.roomId) {
                const room = RegisteredRooms.get(action.roomId);
                const activity = RegisteredActivities.get(action.activityId);
                if (room && activity) {
                    room.addActivity(activity);
                }
            }
            break;

        case 'removeActivity':
            if (action.activityId && action.roomId) {
                const room = RegisteredRooms.get(action.roomId);
                if (room) {
                    room.removeActivity(action.activityId, { to: timeTracker.currentDate });
                }
            }
            break;

        case 'addCommitment':
            if (action.commitmentId) {
                const commitment = RegisteredCommitments.get(action.commitmentId);
                if (commitment) {
                    routine.add(commitment);
                }
            }
            break;

        case 'removeCommitment':
            if (action.commitmentId) {
                const commitment = RegisteredCommitments.get(action.commitmentId);
                if (commitment) {
                    routine.remove(commitment);
                }
            }
            break;

        case 'navigate':
            if (action.route) {
                await props.navigate(action.route);
            }
            break;

        case 'jumpLabel':
            if (action.labelKey) {
                const route = action.route || NARRATION_ROUTE;
                await navigateAndJumpToLabel(action.labelKey, route, props);
            }
            break;

        case 'wait':
            if (action.hours !== undefined) {
                const hours = typeof action.hours === 'string' ? parseInt(action.hours) : action.hours;
                await props.wait(hours);
            }
            break;

        case 'sleep':
            if (action.hours !== undefined) {
                const hours = typeof action.hours === 'string' ? parseInt(action.hours) : action.hours;
                await props.sleep(hours, props);
            }
            break;

        case 'notify':
            if (action.message) {
                props.notify(action.message);
            }
            break;

        case 'goNext':
            narration.goNext(props);
            break;

        case 'showRoomBackground':
            const currentRoom = navigator.currentRoom;
            if (currentRoom && action.layerId) {
                const bg = convertMultiTypeSprite(currentRoom.background, props);
                if (typeof bg === 'string') {
                    await showImage(action.layerId, bg);
                } else {
                    canvas.add(action.layerId, bg);
                }
            }
            break;

        default:
            console.warn(`Unknown action type: ${(action as any).type}`);
    }
}

/**
 * 执行动作序列
 */
export async function executeActions(actions: ActionJSON[], props: OnRunProps): Promise<void> {
    for (const action of actions) {
        await executeAction(action, props);
    }
}

/**
 * 执行标签步骤
 */
export async function executeStep(step: LabelStepJSON, props: OnRunProps): Promise<void> {
    switch (step.type) {
        case 'dialogue':
            const character = step.character ? RegisteredCharacters.get(step.character) : undefined;
            narration.dialogue = {
                character,
                text: step.text || '',
            };
            break;

        case 'choice':
            if (step.choices) {
                const choiceOptions = step.choices
                    .filter(choice => {
                        // 过滤条件选择
                        if (choice.condition) {
                            return evaluateCondition(choice.condition, props);
                        }
                        return true;
                    })
                    .map(choice => {
                        // 处理文本翻译，支持 textParams
                        let text: string = choice.text;
                        if (choice.textParams) {
                            text = String(props.uiTransition(choice.text, choice.textParams));
                        } else if (text.startsWith('{{') && text.endsWith('}}')) {
                            // 处理翻译键格式 {{key}}
                            text = String(props.uiTransition(text.slice(2, -2)));
                        }

                        if (choice.type === 'close') {
                            return newCloseChoiceOption(text);
                        }
                        if (choice.labelKey) {
                            return newChoiceOption(text, choice.labelKey, choice.params || {});
                        }
                        return newCloseChoiceOption(text);
                    });
                narration.choiceMenuOptions = choiceOptions;
            }
            break;

        case 'conditional':
            if (step.condition) {
                const result = evaluateCondition(step.condition, props);
                if (result && step.then) {
                    for (const thenStep of step.then) {
                        await executeStep(thenStep, props);
                    }
                } else if (!result && step.else) {
                    for (const elseStep of step.else) {
                        await executeStep(elseStep, props);
                    }
                }
            }
            break;

        case 'action':
            if (step.actions) {
                await executeActions(step.actions, props);
            }
            break;

        case 'jump':
            if (step.jumpTo) {
                await narration.jumpLabel(step.jumpTo, props);
            }
            break;

        default:
            console.warn(`Unknown step type: ${(step as any).type}`);
    }
}

/**
 * 执行标签步骤序列
 */
export async function executeLabelSteps(steps: LabelStepJSON[], props: OnRunProps): Promise<void> {
    for (const step of steps) {
        await executeStep(step, props);
    }
}
