import FolderZipIcon from '@mui/icons-material/FolderZip';
import { Box, Divider, List, ListItem, ListItemContent, Typography } from '@mui/joy';
import ModalDialogCustom from '../../components/ModalDialog';
import { ScriptPackageAnalysis } from '../../utils/script-package-importer';

interface ScriptPackageAnalysisProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    analysis: ScriptPackageAnalysis | null;
}

export default function ScriptPackageAnalysisModal({ open, setOpen, analysis }: ScriptPackageAnalysisProps) {
    if (!analysis) {
        return null;
    }

    return (
        <ModalDialogCustom
            open={open}
            setOpen={setOpen}
            color='primary'
            head={
                <Typography level='h4' startDecorator={<FolderZipIcon />}>
                    剧本包分析结果
                </Typography>
            }
            sx={{
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 元数据信息 */}
                <Box>
                    <Typography level='title-md' sx={{ mb: 1 }}>
                        包信息
                    </Typography>
                    <List size='sm'>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>名称</Typography>
                                <Typography level='body-md'>{analysis.metadata.name}</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>版本</Typography>
                                <Typography level='body-md'>{analysis.metadata.version}</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>作者</Typography>
                                <Typography level='body-md'>{analysis.metadata.author}</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>游戏版本</Typography>
                                <Typography level='body-md'>{analysis.metadata.gameVersion}</Typography>
                            </ListItemContent>
                        </ListItem>
                        {analysis.metadata.description && (
                            <ListItem>
                                <ListItemContent>
                                    <Typography level='body-sm'>描述</Typography>
                                    <Typography level='body-md'>{analysis.metadata.description}</Typography>
                                </ListItemContent>
                            </ListItem>
                        )}
                    </List>
                </Box>

                <Divider />

                {/* 数据统计 */}
                <Box>
                    <Typography level='title-md' sx={{ mb: 1 }}>
                        数据统计
                    </Typography>
                    <List size='sm'>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>资源清单</Typography>
                                <Typography level='body-md'>{analysis.hasManifest ? '✓ 已包含' : '✗ 未包含'}</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>角色</Typography>
                                <Typography level='body-md'>{analysis.characters} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>地图</Typography>
                                <Typography level='body-md'>{analysis.maps} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>地点</Typography>
                                <Typography level='body-md'>{analysis.locations} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>房间</Typography>
                                <Typography level='body-md'>{analysis.rooms} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>标签</Typography>
                                <Typography level='body-md'>{analysis.labels} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>活动</Typography>
                                <Typography level='body-md'>{analysis.activities} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>任务</Typography>
                                <Typography level='body-md'>{analysis.quests} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>日常安排</Typography>
                                <Typography level='body-md'>{analysis.commitments} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                        <ListItem>
                            <ListItemContent>
                                <Typography level='body-sm'>Ink 文件</Typography>
                                <Typography level='body-md'>{analysis.inkFiles} 个</Typography>
                            </ListItemContent>
                        </ListItem>
                    </List>
                </Box>

                {/* 错误信息 */}
                {analysis.errors && analysis.errors.length > 0 && (
                    <>
                        <Divider />
                        <Box>
                            <Typography level='title-md' color='danger' sx={{ mb: 1 }}>
                                解析错误
                            </Typography>
                            <List size='sm'>
                                {analysis.errors.map((error, index) => (
                                    <ListItem key={index}>
                                        <ListItemContent>
                                            <Typography level='body-sm' color='danger'>
                                                {error}
                                            </Typography>
                                        </ListItemContent>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </>
                )}
            </Box>
        </ModalDialogCustom>
    );
}

