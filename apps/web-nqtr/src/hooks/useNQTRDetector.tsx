import { navigator, RegisteredRooms } from '@drincs/nqtr';
import { Assets, canvas, ImageSprite } from '@drincs/pixi-vn';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CANVAS_UI_LAYER_NAME, NAVIGATION_ROUTE } from '../constans';
import { CURRENT_ROOM_USE_QUEY_KEY, useQueryCurrentRoomId, useQueryRoom, useQueryTime } from '../hooks/useQueryNQTR';
import useHotspotsStore from '../stores/useHotspotsStore';
import useNqtrScreenStore from '../stores/useNqtrScreenStore';
import { getCanvasDimensions } from '../utils/device-utility';
import { convertMultiTypeSprite } from '../utils/image-utility';
import useGameProps from './useGameProps';
import useMyNavigate from './useMyNavigate';
import { INTERFACE_DATA_USE_QUEY_KEY } from './useQueryInterface';

/**
 * 根据位置判断箭头方向
 */
function getArrowDirection(
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number,
): 'left' | 'right' | 'up' | 'down' {
    // 计算相对于 canvas 的位置比例
    const xRatio = x / canvasWidth;
    const yRatio = y / canvasHeight;

    // 计算到各边缘的距离
    const distToLeft = xRatio;
    const distToRight = 1 - xRatio;
    const distToTop = yRatio;
    const distToBottom = 1 - yRatio;

    // 找到最接近的边缘
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) {
        return 'left'; // 在左侧边缘，显示左箭头（指向左）
    } else if (minDist === distToRight) {
        return 'right'; // 在右侧边缘，显示右箭头（指向右）
    } else if (minDist === distToTop) {
        return 'up'; // 在上侧边缘，显示上箭头（指向上）
    } else {
        return 'down'; // 在下侧边缘，显示下箭头（指向下）
    }
}

/**
 * 获取图标资源名称
 */
function getIconAssetName(direction: 'left' | 'right' | 'up' | 'down', iconType?: 'arrow' | 'hand'): string {
    if (iconType === 'hand') {
        return 'hand_pointer';
    }
    // 默认使用箭头
    return `arrow_${direction}`;
}

export default function useNQTRDetector() {
    const { data: currentRoomId } = useQueryCurrentRoomId();
    const { data: currentRoom } = useQueryRoom(currentRoomId);
    const { data: hour } = useQueryTime();
    const gameProps = useGameProps();
    const queryClient = useQueryClient();
    const navigate = useMyNavigate();
    const setDisable = useNqtrScreenStore(state => state.setDisabled);
    const showHotspots = useHotspotsStore(state => state.showHotspots);
    const setShowHotspots = useHotspotsStore(state => state.setShowHotspots);

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
                        iconType?: 'arrow' | 'hand';
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
                        let hotspotElement: ImageSprite;

                        if (hotspot.sprite) {
                            // 如果有自定义图片，使用图片
                            const sprite = convertMultiTypeSprite(hotspot.sprite, gameProps);
                            if (typeof sprite === 'string') {
                                hotspotElement = new ImageSprite(
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
                                hotspotElement = sprite as ImageSprite;
                                hotspotElement.x = x;
                                hotspotElement.y = y;
                                if (hotspot.width) hotspotElement.width = hotspot.width;
                                if (hotspot.height) hotspotElement.height = hotspot.height;
                                hotspotElement.eventMode = 'static';
                                hotspotElement.cursor = 'pointer';
                            }
                        } else {
                            // 如果没有自定义图片，根据显示状态决定是否显示图标
                            if (showHotspots) {
                                // 显示图标（箭头或手套）
                                const iconWidth = hotspot.width || 60;
                                const iconHeight = hotspot.height || 60;
                                const direction = getArrowDirection(
                                    x,
                                    y,
                                    canvasDimensions.width,
                                    canvasDimensions.height,
                                );
                                const iconType = hotspot.iconType || 'arrow';
                                const iconAssetName = getIconAssetName(direction, iconType);

                                // 预加载图标资源并等待加载完成
                                Assets.backgroundLoadBundle('navigation_icons');

                                hotspotElement = new ImageSprite(
                                    {
                                        x: x - iconWidth / 2,
                                        y: y - iconHeight / 2,
                                        width: iconWidth,
                                        height: iconHeight,
                                        eventMode: 'static',
                                        cursor: 'pointer',
                                    },
                                    iconAssetName,
                                );

                                // 确保图标加载完成
                                hotspotElement.load().catch(err => {
                                    console.warn(`Failed to load icon ${iconAssetName}:`, err);
                                    console.log(`Trying to load icon: ${iconAssetName}`);
                                });
                            } else {
                                // 不显示图标，创建透明的点击区域
                                hotspotElement = new ImageSprite(
                                    {
                                        x: x - (hotspot.width || 60) / 2,
                                        y: y - (hotspot.height || 60) / 2,
                                        width: hotspot.width || 60,
                                        height: hotspot.height || 60,
                                        eventMode: 'static',
                                        cursor: 'pointer',
                                        alpha: 0, // 完全透明
                                    },
                                    '', // 空图片
                                );
                            }
                        }

                        // 添加点击事件
                        hotspotElement.on('pointerdown', () => {
                            navigator.currentRoom = hotspot.targetRoomId;
                            queryClient.setQueryData(
                                [INTERFACE_DATA_USE_QUEY_KEY, CURRENT_ROOM_USE_QUEY_KEY],
                                hotspot.targetRoomId,
                            );
                            // 移动后自动隐藏热点
                            setShowHotspots(false);
                            navigate(NAVIGATION_ROUTE);
                        });

                        // 如果是 ImageSprite，需要调用 load
                        if (hotspotElement instanceof ImageSprite) {
                            hotspotElement.load();
                        }
                        layer.addChild(hotspotElement);
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
    }, [currentRoom, hour, showHotspots]);

    return null;
}
