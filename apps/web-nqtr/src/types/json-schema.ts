/**
 * JSON Schema 类型定义
 * 用于定义剧本包 JSON 文件的数据结构
 */

// 条件类型
export interface ConditionJSON {
    type: 'questStage' | 'questStarted' | 'time' | 'flag' | 'room' | 'isWeekend';
    questId?: string;
    stageIndex?: number;
    operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
    flagName?: string;
    flagValue?: boolean;
    timeFrom?: number;
    timeTo?: number;
    roomId?: string;
}

// 动作类型
export interface ActionJSON {
    type:
        | 'showImage'
        | 'setDialogue'
        | 'setChoices'
        | 'questNext'
        | 'addActivity'
        | 'removeActivity'
        | 'addCommitment'
        | 'removeCommitment'
        | 'navigate'
        | 'jumpLabel'
        | 'wait'
        | 'sleep'
        | 'notify'
        | 'goNext'
        | 'showRoomBackground';
    layerId?: string;
    imageId?: string;
    dialogue?: {
        character?: string;
        text: string;
    };
    choices?: ChoiceJSON[];
    questId?: string;
    activityId?: string;
    roomId?: string;
    commitmentId?: string;
    route?: string;
    labelKey?: string;
    hours?: number | string;
    message?: string;
    params?: Record<string, any>;
}

// 条件动作
export interface ConditionalActionJSON {
    type: 'conditional';
    condition: ConditionJSON;
    then: ActionJSON[];
    else?: ActionJSON[];
}

// 选择项
export interface ChoiceJSON {
    text: string;
    textParams?: Record<string, any>;
    labelKey?: string;
    params?: Record<string, any>;
    condition?: ConditionJSON;
    type?: 'close';
}

// 标签步骤
export interface LabelStepJSON {
    type: 'dialogue' | 'choice' | 'conditional' | 'action' | 'jump';
    character?: string;
    text?: string;
    choices?: ChoiceJSON[];
    condition?: ConditionJSON;
    then?: LabelStepJSON[];
    else?: LabelStepJSON[];
    actions?: ActionJSON[];
    jumpTo?: string;
}

// 标签
export interface LabelJSON {
    key: string;
    steps: LabelStepJSON[];
    onStepStart?: {
        [stepIndex: number]: ActionJSON[];
    };
}

// 图标配置
export interface IconJSON {
    type: 'mui' | 'custom';
    name?: string;
    custom?: string;
}

// 活动
export interface ActivityJSON {
    id: string;
    name: string;
    icon?: IconJSON;
    onRun?: ActionJSON | ConditionalActionJSON;
    disabled?: boolean | ConditionJSON;
    hidden?: boolean | ConditionJSON;
}

// 角色
export interface CharacterJSON {
    id: string;
    name: string;
    surname?: string;
    age?: number;
    icon?: string;
    color?: string;
}

// 地图
export interface MapJSON {
    id: string;
    name: string;
    background:
        | string
        | {
              type: 'timeSlots';
              morning: string;
              afternoon: string;
              evening: string;
              night: string;
          };
    neighboringMaps?: {
        north?: string;
        south?: string;
        east?: string;
        west?: string;
    };
}

// 地点
export interface LocationJSON {
    id: string;
    name: string;
    mapId: string;
    sprite: {
        type: 'image' | 'empty';
        alias?: string;
        xAlign?: number;
        yAlign?: number;
        height?: number;
        width?: number;
        eventMode?: string;
        cursor?: string;
    };
}

// 房间
export interface RoomJSON {
    id: string;
    name: string;
    locationId: string;
    background:
        | string
        | {
              type: 'timeSlots';
              morning: string;
              afternoon: string;
              evening: string;
              night: string;
          };
    activities?: string[];
    isEntrance?: boolean;
}

// 任务阶段
export interface StageJSON {
    id: string;
    name: string;
    description: string;
    adviceDescription?: string;
    image?: string;
    flags?: string[];
    flagsRequired?: string[];
    requestDescriptionToStart?: string;
    deltaDateRequired?: number;
    onStart?: ActionJSON[];
    onEnd?: ActionJSON[];
}

// 任务
export interface QuestJSON {
    id: string;
    name: string;
    description: string;
    image?: string;
    inDevelopment?: boolean;
    stages: StageJSON[];
    onStart?: ActionJSON[];
    onNextStage?: ActionJSON[];
    commitments?: CommitmentJSON[];
}

// 日常安排
export interface CommitmentJSON {
    id: string;
    characterId: string;
    roomId: string;
    priority?: number;
    timeSlot?: {
        from: number;
        to: number;
    };
    background?:
        | string
        | {
              type: 'timeSlots';
              morning: string;
              afternoon: string;
              evening: string;
              night: string;
          };
    image?:
        | string
        | {
              type: 'timeSlots';
              morning: string;
              afternoon: string;
              evening: string;
              night: string;
          };
    icon?: IconJSON;
    executionType?: 'automatic' | 'manual';
    hidden?: boolean | ConditionJSON;
    onRun?: ActionJSON[];
}

// 剧本包元数据
export interface ScriptPackageMetadata {
    name: string;
    version: string;
    description: string;
    author: string;
    gameVersion: string;
}
