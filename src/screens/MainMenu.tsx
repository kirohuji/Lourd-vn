import { canvas, ImageSprite, narration } from '@drincs/pixi-vn';
import { Box, CircularProgress } from '@mui/joy';
import Stack from '@mui/joy/Stack';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import MenuButton from '../components/MenuButton';
import { CANVAS_UI_LAYER_NAME } from '../constans';
import useGameProps from '../hooks/useGameProps';
import useIsMobile from '../hooks/useIsMobile';
import { INTERFACE_DATA_USE_QUEY_KEY } from '../hooks/useQueryInterface';
import useQueryLastSave from '../hooks/useQueryLastSave';
import useGameSaveScreenStore from '../stores/useGameSaveScreenStore';
import useInterfaceStore from '../stores/useInterfaceStore';
import useSettingsScreenStore from '../stores/useSettingsScreenStore';
import { getCanvasDimensions } from '../utils/device-utility';
import { loadSave } from '../utils/save-utility';
import { analyzeScriptPackage, ScriptPackageAnalysis } from '../utils/script-package-importer';
import ScriptPackageAnalysisModal from './modals/ScriptPackageAnalysis';

export default function MainMenu() {
    const setOpenSettings = useSettingsScreenStore(state => state.setOpen);
    const editHideInterface = useInterfaceStore(state => state.setHidden);
    const editSaveScreen = useGameSaveScreenStore(state => state.editOpen);
    const queryClient = useQueryClient();
    const { data: lastSave = null, isLoading } = useQueryLastSave();
    const gameProps = useGameProps();
    const { uiTransition: t, navigate, notify } = gameProps;
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(false);
    const [analysisOpen, setAnalysisOpen] = useState(false);
    const [analysis, setAnalysis] = useState<ScriptPackageAnalysis | null>(null);
    const [packageFile, setPackageFile] = useState<File | null>(null);

    useEffect(() => {
        editHideInterface(false);

        // 获取画布尺寸
        const canvasDimensions = getCanvasDimensions();

        // 创建背景图 - 尝试方法一：直接在配置中设置 width 和 height
        let bg = new ImageSprite(
            {
                width: canvasDimensions.width,
                height: canvasDimensions.height,
            },
            'background_main_menu',
        );

        // 先添加到图层
        let layer = canvas.getLayer(CANVAS_UI_LAYER_NAME);
        if (layer) {
            layer.addChild(bg);
        }

        // 等待图片加载完成后，如果方法一不行，使用方法二：手动缩放
        bg.load()
            .then(() => {
                // 检查图片是否已经正确显示（通过检查实际尺寸）
                const texture = (bg as any).texture;
                if (texture) {
                    const imageWidth = texture.width;
                    const imageHeight = texture.height;

                    // 如果图片尺寸和配置的尺寸不一致，说明需要手动缩放
                    if (
                        Math.abs(bg.width - canvasDimensions.width) > 1 ||
                        Math.abs(bg.height - canvasDimensions.height) > 1
                    ) {
                        // 使用方法二：计算缩放比例（cover 模式）
                        const scaleX = canvasDimensions.width / imageWidth;
                        const scaleY = canvasDimensions.height / imageHeight;
                        const scale = Math.max(scaleX, scaleY);

                        // 设置缩放
                        bg.scale.set(scale);

                        // 设置位置为 (0, 0)，从左上角开始
                        bg.x = 0;
                        bg.y = 0;

                        // 如果缩放后超出画布，调整位置居中显示
                        const scaledWidth = imageWidth * scale;
                        const scaledHeight = imageHeight * scale;
                        if (scaledWidth > canvasDimensions.width) {
                            bg.x = (canvasDimensions.width - scaledWidth) / 2;
                        }
                        if (scaledHeight > canvasDimensions.height) {
                            bg.y = (canvasDimensions.height - scaledHeight) / 2;
                        }
                    }
                }
            })
            .catch(error => {
                console.error('背景图加载失败:', error);
            });

        return () => {
            canvas.getLayer(CANVAS_UI_LAYER_NAME)?.removeChildren();
        };
    }, [isMobile]);

    return (
        <Stack
            direction='column'
            justifyContent='center'
            alignItems={isMobile ? 'center' : 'flex-start'}
            spacing={isMobile ? 2.5 : { xs: 1, sm: 2, lg: 3 }}
            sx={{
                height: '100%',
                width: '100%',
                px: isMobile ? 3 : { xs: 1, sm: 2, md: 4, lg: 6, xl: 8 },
                py: isMobile ? 3 : 0,
                boxSizing: 'border-box',
            }}
            component={motion.div}
            initial='closed'
            animate={'open'}
            exit='closed'
        >
            <MenuButton
                onClick={() => {
                    if (!lastSave) {
                        return;
                    }
                    setLoading(true);
                    loadSave(lastSave, navigate)
                        .then(() => queryClient.invalidateQueries({ queryKey: [INTERFACE_DATA_USE_QUEY_KEY] }))
                        .catch(e => {
                            notify(t('fail_load'), { variant: 'error' });
                            console.error(e);
                        })
                        .finally(() => setLoading(false));
                }}
                transitionDelay={0.1}
                loading={isLoading}
                disabled={(!isLoading && !lastSave) || loading}
                sx={
                    isMobile
                        ? {
                              width: '100%',
                              maxWidth: '400px',
                              minHeight: '48px',
                              fontSize: '1rem',
                              fontWeight: 500,
                          }
                        : undefined
                }
            >
                {t('continue')}
            </MenuButton>
            <MenuButton
                onClick={async () => {
                    setLoading(true);
                    canvas.removeAll();
                    narration
                        .call('start', gameProps)
                        .then(() => queryClient.invalidateQueries({ queryKey: [INTERFACE_DATA_USE_QUEY_KEY] }))
                        .finally(() => setLoading(false));
                }}
                transitionDelay={0.2}
                disabled={loading}
                sx={
                    isMobile
                        ? {
                              width: '100%',
                              maxWidth: '400px',
                              minHeight: '48px',
                              fontSize: '1rem',
                              fontWeight: 500,
                          }
                        : undefined
                }
            >
                {t('start')}
            </MenuButton>
            <MenuButton
                onClick={editSaveScreen}
                transitionDelay={0.3}
                disabled={loading}
                sx={
                    isMobile
                        ? {
                              width: '100%',
                              maxWidth: '400px',
                              minHeight: '48px',
                              fontSize: '1rem',
                              fontWeight: 500,
                          }
                        : undefined
                }
            >
                {t('load')}
            </MenuButton>
            <MenuButton
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.zip,application/zip';
                    input.onchange = async e => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            setPackageFile(file);
                            setLoading(true);
                            try {
                                const analysisResult = await analyzeScriptPackage(file);
                                setAnalysis(analysisResult);
                                setAnalysisOpen(true);
                            } catch (error) {
                                notify(`分析失败: ${error}`, { variant: 'error' });
                                console.error(error);
                            } finally {
                                setLoading(false);
                            }
                        }
                    };
                    input.click();
                }}
                transitionDelay={0.4}
                disabled={loading}
                sx={
                    isMobile
                        ? {
                              width: '100%',
                              maxWidth: '400px',
                              minHeight: '48px',
                              fontSize: '1rem',
                              fontWeight: 500,
                          }
                        : undefined
                }
            >
                导入剧本包
            </MenuButton>
            <MenuButton
                onClick={() => setOpenSettings(true)}
                transitionDelay={0.5}
                sx={
                    isMobile
                        ? {
                              width: '100%',
                              maxWidth: '400px',
                              minHeight: '48px',
                              fontSize: '1rem',
                              fontWeight: 500,
                          }
                        : undefined
                }
            >
                {t('settings')}
            </MenuButton>
            {loading && (
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        padding: 0.5,
                    }}
                    className='motion-preset-pop'
                >
                    <CircularProgress />
                </Box>
            )}
            <ScriptPackageAnalysisModal
                open={analysisOpen}
                setOpen={setAnalysisOpen}
                analysis={analysis}
                packageFile={packageFile}
            />
        </Stack>
    );
}
