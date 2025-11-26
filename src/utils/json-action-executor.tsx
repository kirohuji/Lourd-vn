import { ActivityInterface, CommitmentInterface, OnRunEvent, OnRunProps } from '@drincs/nqtr';
import * as MuiIcons from '@mui/icons-material';
import { ReactElement } from 'react';
import NqtrRoundIconButton from '../components/NqtrRoundIconButton';
import { ActionJSON, ConditionalActionJSON, IconJSON } from '../types/json-schema';
import { evaluateCondition, executeAction, executeActions } from './json-interpreter';

/**
 * JSON 动作执行器
 * 创建 Activity 和 Commitment 的 onRun 函数
 */

/**
 * 从 JSON 创建图标组件
 */
export function createIconFromJSON(
    iconJSON: IconJSON | undefined,
    activityOrCommitment: ActivityInterface | CommitmentInterface,
): ReactElement | ((props: OnRunProps) => ReactElement) | undefined {
    if (!iconJSON) {
        return undefined;
    }

    if (iconJSON.type === 'mui' && iconJSON.name) {
        // 动态获取 MUI 图标
        const IconComponent = (MuiIcons as any)[iconJSON.name] as React.ComponentType<any>;
        if (!IconComponent) {
            console.warn(`MUI icon "${iconJSON.name}" not found`);
            return undefined;
        }

        return (props: OnRunProps) => {
            return (
                <NqtrRoundIconButton
                    disabled={activityOrCommitment.disabled}
                    onClick={() => {
                        if ('run' in activityOrCommitment && activityOrCommitment.run) {
                            activityOrCommitment.run(props).then(() => {
                                props.invalidateInterfaceData();
                            });
                        }
                    }}
                    ariaLabel={props.uiTransition(activityOrCommitment.name)}
                    variant='solid'
                    color='primary'
                >
                    <IconComponent
                        sx={{
                            fontSize: { sx: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
                        }}
                    />
                </NqtrRoundIconButton>
            );
        };
    }

    if (iconJSON.type === 'custom' && iconJSON.custom) {
        // TODO: 实现自定义图标
        return undefined;
    }

    return undefined;
}

/**
 * 从 JSON 创建 Activity 的 onRun 函数
 */
export function createActivityOnRun(
    onRunJSON: ActionJSON | ConditionalActionJSON | undefined,
): OnRunEvent<ActivityInterface> {
    if (!onRunJSON) {
        return async () => {
            // 默认空函数
        };
    }

    // 处理条件动作
    if (onRunJSON.type === 'conditional') {
        return async (_activity: ActivityInterface, event: OnRunProps) => {
            const condition = onRunJSON.condition;
            const result = evaluateCondition(condition, event);

            if (result) {
                await executeActions(onRunJSON.then, event);
            } else if (onRunJSON.else) {
                await executeActions(onRunJSON.else, event);
            }
        };
    }

    // 处理单个动作
    return async (_activity: ActivityInterface, event: OnRunProps) => {
        await executeAction(onRunJSON as ActionJSON, event);
    };
}

/**
 * 从 JSON 创建 Commitment 的 onRun 函数
 */
export function createCommitmentOnRun(onRunJSON: ActionJSON[] | undefined): OnRunEvent<CommitmentInterface> {
    if (!onRunJSON || onRunJSON.length === 0) {
        return async () => {
            // 默认空函数
        };
    }

    return async (_commitment: CommitmentInterface, event: OnRunProps) => {
        await executeActions(onRunJSON, event);
    };
}
