import { navigator, RegisteredRooms } from '@drincs/nqtr';
import { canvas, ImageSprite } from '@drincs/pixi-vn';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CANVAS_UI_LAYER_NAME, NAVIGATION_ROUTE } from '../constans';
import { CURRENT_ROOM_USE_QUEY_KEY, useQueryCurrentRoomId, useQueryRoom, useQueryTime } from '../hooks/useQueryNQTR';
import useNqtrScreenStore from '../stores/useNqtrScreenStore';
import { getCanvasDimensions } from '../utils/device-utility';
import { convertMultiTypeSprite } from '../utils/image-utility';
import useGameProps from './useGameProps';
import useMyNavigate from './useMyNavigate';
import { INTERFACE_DATA_USE_QUEY_KEY } from './useQueryInterface';

export default function useNQTRDetector() {
    const { data: currentRoomId } = useQueryCurrentRoomId();
    const { data: currentRoom } = useQueryRoom(currentRoomId);
    const { data: hour } = useQueryTime();
    const gameProps = useGameProps();
    const queryClient = useQueryClient();
    const navigate = useMyNavigate();
    const setDisable = useNqtrScreenStore(state => state.setDisabled);

    useEffect(() => {
        const { background } = currentRoom || {};
        canvas.removeAll();
        if (background) {
            let image = convertMultiTypeSprite(background, gameProps);
            let layer = canvas.getLayer(CANVAS_UI_LAYER_NAME);
            if (layer) {
                if (typeof image === 'string') {
                    let sprite = new ImageSprite({}, image);
                    sprite.load();
                    image = sprite;
                }
                layer.addChild(image);

                currentRoom?.activities.forEach(({ sprite }) => {
                    if (sprite) {
                        let icon = convertMultiTypeSprite(sprite, gameProps);
                        if (typeof icon === 'string') {
                            let sprite = new ImageSprite({}, icon);
                            sprite.load();
                            icon = sprite;
                        }
                        layer.addChild(icon);
                    }
                });
                currentRoom?.routine.forEach(({ sprite }) => {
                    if (sprite) {
                        let icon = convertMultiTypeSprite(sprite, gameProps);
                        if (typeof icon === 'string') {
                            let sprite = new ImageSprite({}, icon);
                            sprite.load();
                            icon = sprite;
                        }
                        layer.addChild(icon);
                    }
                });

                // 渲染房间热点（可点击的门窗等）
                const room = navigator.currentRoom;
                if (room && 'hotspots' in room && (room as any).hotspots) {
                    console.log('hotspots', (room as any).hotspots);
                    const hotspots = (room as any).hotspots as Array<{
                        targetRoomId: string;
                        sprite?: any;
                        x: number | { align: number };
                        y: number | { align: number };
                        width?: number;
                        height?: number;
                        disabled?: boolean | (() => boolean);
                    }>;

                    hotspots.forEach(hotspot => {
                        // 检查是否禁用
                        let disabled = false;
                        if (typeof hotspot.disabled === 'function') {
                            disabled = hotspot.disabled();
                        } else if (hotspot.disabled !== undefined) {
                            disabled = hotspot.disabled;
                        }

                        if (disabled) return;

                        // 获取目标房间
                        const targetRoom = RegisteredRooms.get(hotspot.targetRoomId);
                        if (!targetRoom) return;
                        console.log('targetRoom', targetRoom);
                        // 计算位置
                        const canvasDimensions = getCanvasDimensions();
                        let x: number;
                        let y: number;

                        if (typeof hotspot.x === 'object' && hotspot.x.align !== undefined) {
                            x = canvasDimensions.width * hotspot.x.align;
                        } else {
                            x = hotspot.x as number;
                        }

                        if (typeof hotspot.y === 'object' && hotspot.y.align !== undefined) {
                            y = canvasDimensions.height * hotspot.y.align;
                        } else {
                            y = hotspot.y as number;
                        }

                        // 创建热点 sprite
                        let hotspotSprite: ImageSprite;

                        if (hotspot.sprite) {
                            // 如果有图片，使用图片
                            const sprite = convertMultiTypeSprite(hotspot.sprite, gameProps);
                            if (typeof sprite === 'string') {
                                hotspotSprite = new ImageSprite(
                                    {
                                        x,
                                        y,
                                        width: hotspot.width,
                                        height: hotspot.height,
                                        eventMode: 'static',
                                        cursor: 'pointer',
                                    },
                                    sprite,
                                );
                            } else {
                                hotspotSprite = sprite as ImageSprite;
                                hotspotSprite.x = x;
                                hotspotSprite.y = y;
                                if (hotspot.width) hotspotSprite.width = hotspot.width;
                                if (hotspot.height) hotspotSprite.height = hotspot.height;
                                hotspotSprite.eventMode = 'static';
                                hotspotSprite.cursor = 'pointer';
                            }
                        } else {
                            // 如果没有图片，创建透明的点击区域
                            hotspotSprite = new ImageSprite(
                                {
                                    x,
                                    y,
                                    width: hotspot.width || 100,
                                    height: hotspot.height || 100,
                                    eventMode: 'static',
                                    cursor: 'pointer',
                                    alpha: 0, // 完全透明
                                },
                                '', // 空图片
                            );
                        }

                        // 添加点击事件
                        hotspotSprite.on('pointerdown', () => {
                            navigator.currentRoom = hotspot.targetRoomId;
                            queryClient.setQueryData(
                                [INTERFACE_DATA_USE_QUEY_KEY, CURRENT_ROOM_USE_QUEY_KEY],
                                hotspot.targetRoomId,
                            );
                            navigate(NAVIGATION_ROUTE);
                        });

                        hotspotSprite.load();
                        layer.addChild(hotspotSprite);
                    });
                }
            }
        }

        let automaticFunctions = navigator.currentRoom?.automaticFunctions || [];
        if (automaticFunctions.length > 0) {
            let automaticFunction = automaticFunctions[0];
            setDisable(true);
            automaticFunction(gameProps).finally(() => {
                queryClient.invalidateQueries({ queryKey: [INTERFACE_DATA_USE_QUEY_KEY] });
                setDisable(false);
            });
        }

        return () => {
            canvas.getLayer(CANVAS_UI_LAYER_NAME)?.removeChildren();
        };
    }, [currentRoom, hour]);

    return null;
}
