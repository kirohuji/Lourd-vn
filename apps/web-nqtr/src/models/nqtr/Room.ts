import { ActivityInterface, LocationInterface, OnRunProps, RoomInterface, RoomStoredClass } from '@drincs/nqtr';
import MultiTypeSprite, { MultiTypeSpriteProp } from '../MultiTypeSprite';

export interface RoomHotspot {
    /** 目标房间 ID */
    targetRoomId: string;
    /** 热点图片（可选，如果不提供则使用透明点击区域） */
    sprite?: MultiTypeSpriteProp<Room>;
    /** 图标类型：'arrow' 使用箭头图标，'hand' 使用手套图标，如果不指定则使用箭头 */
    iconType?: 'arrow' | 'hand';
    /** X 位置（0-1 相对位置，或像素值） */
    x: number | { align: number };
    /** Y 位置（0-1 相对位置，或像素值） */
    y: number | { align: number };
    /** 宽度（像素） */
    width?: number;
    /** 高度（像素） */
    height?: number;
    /** 是否禁用 */
    disabled?: boolean | (() => boolean);
}

export default class Room extends RoomStoredClass implements RoomInterface {
    private readonly _hotspots?: RoomHotspot[];

    constructor(
        id: string,
        location: LocationInterface,
        props: {
            name: string;
            disabled?: boolean | (() => boolean);
            hidden?: boolean | (() => boolean);
            background: MultiTypeSpriteProp<Room>;
            activities?: ActivityInterface[];
            isEntrance?: boolean;
            /** 可点击的热点区域，用于在房间内点击移动到其他房间 */
            hotspots?: RoomHotspot[];
        },
    ) {
        super(id, location, props.activities);
        this.name = props.name;
        this._defaultDisabled = props.disabled || false;
        this._defaultHidden = props.hidden || false;
        this._background = props.background;
        this.isEntrance = props.isEntrance || false;
        this._hotspots = props.hotspots;
    }

    get hotspots(): RoomHotspot[] | undefined {
        return this._hotspots;
    }
    readonly name: string;
    private readonly _background: MultiTypeSpriteProp<Room>;
    get background(): MultiTypeSprite {
        const background = this._background;
        if (typeof background === 'function') {
            return (runProps: OnRunProps) => background(this, runProps);
        }
        return background;
    }
    readonly isEntrance: boolean;
    private _defaultDisabled: boolean | (() => boolean) = false;
    get disabled(): boolean {
        let value = this.getStorageProperty<boolean>('disabled') || this._defaultDisabled;
        if (typeof value === 'function') {
            return value();
        }
        return value;
    }
    set disabled(value: boolean) {
        this.setStorageProperty('disabled', value);
    }
    private _defaultHidden: boolean | (() => boolean) = false;
    get hidden(): boolean {
        let value = this.getStorageProperty<boolean>('hidden') || this._defaultHidden;
        if (typeof value === 'function') {
            return value();
        }
        return value;
    }
    set hidden(value: boolean) {
        this.setStorageProperty('hidden', value);
    }
}
