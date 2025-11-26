import FolderZipIcon from '@mui/icons-material/FolderZip';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    AspectRatio,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Table,
    Tab,
    TabList,
    TabPanel,
    Tabs,
    Typography,
} from '@mui/joy';
import { useState } from 'react';
import ModalDialogCustom from '../../components/ModalDialog';
import { ScriptPackageAnalysis } from '../../utils/script-package-importer';
import {
    CharacterJSON,
    MapJSON,
    LocationJSON,
    RoomJSON,
    LabelJSON,
    ActivityJSON,
    QuestJSON,
    CommitmentJSON,
} from '../../types/json-schema';

interface ScriptPackageAnalysisProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    analysis: ScriptPackageAnalysis | null;
}

// 大图预览组件
function LargeImagePreview({ src, alt }: { src?: string; alt?: string }) {
    if (!src) return null;

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
        return (
            <AspectRatio ratio='16/9' sx={{ borderRadius: 'md', overflow: 'hidden' }}>
                <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </AspectRatio>
        );
    }

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '300px',
                borderRadius: 'md',
                bgcolor: 'background.level1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Typography level='body-md'>{src}</Typography>
        </Box>
    );
}

export default function ScriptPackageAnalysisModal({ open, setOpen, analysis }: ScriptPackageAnalysisProps) {
    const [tabValue, setTabValue] = useState(0);
    const [selectedDataType, setSelectedDataType] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (!analysis) {
        return null;
    }

    // 统计数据
    const stats = [
        { label: '角色', value: analysis.characters, icon: '👤', data: analysis.charactersData },
        { label: '地图', value: analysis.maps, icon: '🗺️', data: analysis.mapsData },
        { label: '地点', value: analysis.locations, icon: '📍', data: analysis.locationsData },
        { label: '房间', value: analysis.rooms, icon: '🏠', data: analysis.roomsData },
        { label: '标签', value: analysis.labels, icon: '🏷️', data: analysis.labelsData },
        { label: '活动', value: analysis.activities, icon: '🎮', data: analysis.activitiesData },
        { label: '任务', value: analysis.quests, icon: '📋', data: analysis.questsData },
        { label: '日常安排', value: analysis.commitments, icon: '📅', data: analysis.commitmentsData },
        { label: 'Ink 文件', value: analysis.inkFiles, icon: '📝', data: analysis.inkFilesData },
    ];

    const handleRowClick = (dataType: string, index: number | null = null) => {
        setSelectedDataType(dataType);
        setSelectedIndex(index);
        setTabValue(3); // 切换到详情标签页
    };

    const handleBack = () => {
        setSelectedDataType(null);
        setSelectedIndex(null);
        setTabValue(2); // 返回数据统计
    };

    // 获取当前选中的数据
    const getSelectedData = (): CharacterJSON | MapJSON | LocationJSON | RoomJSON | LabelJSON | ActivityJSON | QuestJSON | CommitmentJSON | string | null => {
        if (!selectedDataType || selectedIndex === null) return null;
        const stat = stats.find(s => s.label === selectedDataType);
        if (!stat || !stat.data) return null;
        return stat.data[selectedIndex];
    };

    const selectedData = getSelectedData();

    // 类型守卫函数
    const isMapJSON = (data: any): data is MapJSON => {
        return data && typeof data === 'object' && 'id' in data && 'name' in data && 'background' in data && selectedDataType === '地图';
    };

    const isLocationJSON = (data: any): data is LocationJSON => {
        return data && typeof data === 'object' && 'id' in data && 'name' in data && 'mapId' in data && 'sprite' in data && selectedDataType === '地点';
    };

    const isRoomJSON = (data: any): data is RoomJSON => {
        return data && typeof data === 'object' && 'id' in data && 'name' in data && 'locationId' in data && 'background' in data && selectedDataType === '房间';
    };

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
                maxWidth: '1400px',
                maxHeight: '90vh',
            }}
        >
            <Tabs value={tabValue} onChange={(_, value) => setTabValue(value as number)}>
                <TabList sx={{ flexWrap: 'wrap', mb: 2 }}>
                    <Tab>概览</Tab>
                    <Tab>包信息</Tab>
                    <Tab>数据统计</Tab>
                    {selectedDataType && <Tab>详情</Tab>}
                    {analysis.errors && analysis.errors.length > 0 && (
                        <Tab>
                            错误
                            <Chip size='sm' color='danger' sx={{ ml: 1 }}>
                                {analysis.errors.length}
                            </Chip>
                        </Tab>
                    )}
                </TabList>

                {/* 概览标签页 */}
                <TabPanel value={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* 包信息卡片 */}
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                    包信息
                                </Typography>
                                <Table>
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '120px', fontWeight: 600, padding: '8px' }}>名称</td>
                                            <td style={{ padding: '8px' }}>{analysis.metadata.name}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 600, padding: '8px' }}>版本</td>
                                            <td style={{ padding: '8px' }}>
                                                <Chip size='sm' variant='soft' color='primary'>
                                                    {analysis.metadata.version}
                                                </Chip>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 600, padding: '8px' }}>作者</td>
                                            <td style={{ padding: '8px' }}>{analysis.metadata.author}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 600, padding: '8px' }}>游戏版本</td>
                                            <td style={{ padding: '8px' }}>{analysis.metadata.gameVersion}</td>
                                        </tr>
                                        {analysis.metadata.description && (
                                            <tr>
                                                <td style={{ fontWeight: 600, padding: '8px' }}>描述</td>
                                                <td style={{ padding: '8px' }}>{analysis.metadata.description}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td style={{ fontWeight: 600, padding: '8px' }}>资源清单</td>
                                            <td style={{ padding: '8px' }}>
                                                {analysis.hasManifest ? (
                                                    <Chip size='sm' color='success' variant='soft'>
                                                        ✓ 已包含
                                                    </Chip>
                                                ) : (
                                                    <Chip size='sm' color='neutral' variant='soft'>
                                                        ✗ 未包含
                                                    </Chip>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* 数据统计卡片 */}
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                    数据统计
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, 1fr)',
                                            sm: 'repeat(3, 1fr)',
                                            md: 'repeat(4, 1fr)',
                                        },
                                        gap: 2,
                                    }}
                                >
                                    {stats.map((stat, index) => (
                                        <Card key={index} variant='soft' size='sm'>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                    <Typography level='h2'>{stat.icon}</Typography>
                                                    <Typography level='h3'>{stat.value}</Typography>
                                                    <Typography level='body-sm'>{stat.label}</Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* 包信息标签页 */}
                <TabPanel value={1}>
                    <Card variant='outlined'>
                        <CardContent>
                            <Typography level='title-lg' sx={{ mb: 2 }}>
                                包信息详情
                            </Typography>
                            <Table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '150px' }}>属性</th>
                                        <th>值</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>名称</td>
                                        <td>{analysis.metadata.name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>版本</td>
                                        <td>
                                            <Chip size='sm' variant='soft' color='primary'>
                                                {analysis.metadata.version}
                                            </Chip>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>作者</td>
                                        <td>{analysis.metadata.author}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>游戏版本</td>
                                        <td>{analysis.metadata.gameVersion}</td>
                                    </tr>
                                    {analysis.metadata.description && (
                                        <tr>
                                            <td style={{ fontWeight: 600 }}>描述</td>
                                            <td>{analysis.metadata.description}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>资源清单</td>
                                        <td>
                                            {analysis.hasManifest ? (
                                                <Chip size='sm' color='success' variant='soft'>
                                                    ✓ 已包含
                                                </Chip>
                                            ) : (
                                                <Chip size='sm' color='neutral' variant='soft'>
                                                    ✗ 未包含
                                                </Chip>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* 数据统计标签页 */}
                <TabPanel value={2}>
                    <Card variant='outlined'>
                        <CardContent>
                            <Typography level='title-lg' sx={{ mb: 2 }}>
                                数据统计详情
                            </Typography>
                            <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '150px' }}>数据类型</th>
                                            <th>数量</th>
                                            <th>状态</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.map((stat, index) => (
                                            <tr
                                                key={index}
                                                style={{
                                                    cursor: stat.data && stat.data.length > 0 ? 'pointer' : 'default',
                                                }}
                                                onClick={() => {
                                                    if (stat.data && stat.data.length > 0) {
                                                        // 如果只有一个数据，直接显示；否则显示列表
                                                        if (stat.data.length === 1) {
                                                            handleRowClick(stat.label, 0);
                                                        } else {
                                                            // 显示列表让用户选择
                                                            handleRowClick(stat.label, null);
                                                        }
                                                    }
                                                }}
                                            >
                                                <td>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography level='h4'>{stat.icon}</Typography>
                                                        <Typography>{stat.label}</Typography>
                                                    </Box>
                                                </td>
                                                <td>
                                                    <Typography level='h4'>{stat.value}</Typography>
                                                </td>
                                                <td>
                                                    {stat.value > 0 ? (
                                                        <Chip size='sm' color='success' variant='soft'>
                                                            已加载
                                                        </Chip>
                                                    ) : (
                                                        <Chip size='sm' color='neutral' variant='soft'>
                                                            无数据
                                                        </Chip>
                                                    )}
                                                </td>
                                                <td>
                                                    {stat.data && stat.data.length > 0 ? (
                                                        <Chip size='sm' variant='outlined' color='primary'>
                                                            查看列表 ({stat.data.length})
                                                        </Chip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Box>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* 详情标签页 */}
                <TabPanel value={3}>
                    {selectedDataType && (
                        <Box>
                            <Button
                                variant='outlined'
                                startDecorator={<ArrowBackIcon />}
                                onClick={handleBack}
                                sx={{ mb: 2 }}
                            >
                                返回
                            </Button>

                            {/* 如果有多条数据，显示列表 */}
                            {(() => {
                                const stat = stats.find(s => s.label === selectedDataType);
                                if (stat && stat.data && stat.data.length > 1 && selectedIndex === null) {
                                    return (
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                                    {selectedDataType}列表 ({stat.data.length} 个)
                                                </Typography>
                                                <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                                                    <Table>
                                                        <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>名称</th>
                                                                <th>操作</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {stat.data.map((item: any, index: number) => (
                                                                <tr
                                                                    key={index}
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => setSelectedIndex(index)}
                                                                >
                                                                    <td>
                                                                        <Chip size='sm' variant='soft'>
                                                                            {item.id || item.key || index}
                                                                        </Chip>
                                                                    </td>
                                                                    <td>{item.name || item.key || `项目 ${index + 1}`}</td>
                                                                    <td>
                                                                        <Chip size='sm' variant='outlined' color='primary'>
                                                                            查看详情
                                                                        </Chip>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    );
                                }
                                return null;
                            })()}

                            {/* 显示具体数据详情 */}
                            {selectedData && selectedIndex !== null && (
                                <>

                            {/* 地图详情 */}
                            {isMapJSON(selectedData) && (
                                <Grid container spacing={2}>
                                    <Grid xs={12} md={5}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-md' sx={{ mb: 2 }}>
                                                    背景图片
                                                </Typography>
                                                {typeof selectedData.background === 'string' ? (
                                                    <LargeImagePreview src={selectedData.background} alt={selectedData.name} />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                早晨
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.morning} alt='早晨' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                下午
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.afternoon} alt='下午' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                晚上
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.evening} alt='晚上' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                夜晚
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.night} alt='夜晚' />
                                                        </Box>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid xs={12} md={7}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                                    {selectedData.name}
                                                </Typography>
                                                <Table>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ width: '120px', fontWeight: 600 }}>ID</td>
                                                            <td>
                                                                <Chip size='sm' variant='soft'>
                                                                    {selectedData.id}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>名称</td>
                                                            <td>{selectedData.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>背景类型</td>
                                                            <td>
                                                                {typeof selectedData.background === 'string' ? (
                                                                    <Chip size='sm' variant='outlined'>
                                                                        单背景
                                                                    </Chip>
                                                                ) : (
                                                                    <Chip size='sm' variant='outlined' color='primary'>
                                                                        时段背景
                                                                    </Chip>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {selectedData.neighboringMaps && (
                                                            <tr>
                                                                <td style={{ fontWeight: 600 }}>相邻地图</td>
                                                                <td>
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                        {Object.entries(selectedData.neighboringMaps).map(([dir, id]) => (
                                                                            <Chip key={dir} size='sm' variant='soft'>
                                                                                {dir}: {id as string}
                                                                            </Chip>
                                                                        ))}
                                                                    </Box>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}

                            {/* 地点详情 */}
                            {isLocationJSON(selectedData) && (
                                <Grid container spacing={2}>
                                    <Grid xs={12} md={5}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-md' sx={{ mb: 2 }}>
                                                    精灵图片
                                                </Typography>
                                                {selectedData.sprite.alias ? (
                                                    <LargeImagePreview src={selectedData.sprite.alias} alt={selectedData.name} />
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            width: '100%',
                                                            minHeight: '300px',
                                                            borderRadius: 'md',
                                                            bgcolor: 'background.level1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        <Typography level='body-md'>无图片</Typography>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid xs={12} md={7}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                                    {selectedData.name}
                                                </Typography>
                                                <Table>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ width: '120px', fontWeight: 600 }}>ID</td>
                                                            <td>
                                                                <Chip size='sm' variant='soft'>
                                                                    {selectedData.id}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>名称</td>
                                                            <td>{selectedData.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>地图ID</td>
                                                            <td>
                                                                <Chip size='sm' variant='outlined'>
                                                                    {selectedData.mapId}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>精灵类型</td>
                                                            <td>
                                                                <Chip size='sm' variant={selectedData.sprite.type === 'image' ? 'soft' : 'outlined'}>
                                                                    {selectedData.sprite.type}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        {selectedData.sprite.alias && (
                                                            <tr>
                                                                <td style={{ fontWeight: 600 }}>精灵别名</td>
                                                                <td>{selectedData.sprite.alias}</td>
                                                            </tr>
                                                        )}
                                                        {selectedData.sprite.width && (
                                                            <tr>
                                                                <td style={{ fontWeight: 600 }}>宽度</td>
                                                                <td>{selectedData.sprite.width}</td>
                                                            </tr>
                                                        )}
                                                        {selectedData.sprite.height && (
                                                            <tr>
                                                                <td style={{ fontWeight: 600 }}>高度</td>
                                                                <td>{selectedData.sprite.height}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}

                            {/* 房间详情 */}
                            {isRoomJSON(selectedData) && (
                                <Grid container spacing={2}>
                                    <Grid xs={12} md={5}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-md' sx={{ mb: 2 }}>
                                                    背景图片
                                                </Typography>
                                                {typeof selectedData.background === 'string' ? (
                                                    <LargeImagePreview src={selectedData.background} alt={selectedData.name} />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                早晨
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.morning} alt='早晨' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                下午
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.afternoon} alt='下午' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                晚上
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.evening} alt='晚上' />
                                                        </Box>
                                                        <Box>
                                                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                夜晚
                                                            </Typography>
                                                            <LargeImagePreview src={selectedData.background.night} alt='夜晚' />
                                                        </Box>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid xs={12} md={7}>
                                        <Card variant='outlined'>
                                            <CardContent>
                                                <Typography level='title-lg' sx={{ mb: 2 }}>
                                                    {selectedData.name}
                                                </Typography>
                                                <Table>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ width: '120px', fontWeight: 600 }}>ID</td>
                                                            <td>
                                                                <Chip size='sm' variant='outlined'>
                                                                    {selectedData.id}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>名称</td>
                                                            <td>{selectedData.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>地点ID</td>
                                                            <td>
                                                                <Chip size='sm' variant='outlined'>
                                                                    {selectedData.locationId}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>背景类型</td>
                                                            <td>
                                                                {typeof selectedData.background === 'string' ? (
                                                                    <Chip size='sm' variant='outlined'>
                                                                        单背景
                                                                    </Chip>
                                                                ) : (
                                                                    <Chip size='sm' variant='outlined' color='primary'>
                                                                        时段背景
                                                                    </Chip>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>活动数量</td>
                                                            <td>
                                                                <Chip size='sm' variant='soft'>
                                                                    {selectedData.activities?.length || 0}
                                                                </Chip>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ fontWeight: 600 }}>入口</td>
                                                            <td>
                                                                {selectedData.isEntrance ? (
                                                                    <Chip size='sm' color='success' variant='soft'>
                                                                        ✓ 是
                                                                    </Chip>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}

                            {/* 其他数据类型 */}
                            {!['地图', '地点', '房间'].includes(selectedDataType) && (
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography level='title-lg' sx={{ mb: 2 }}>
                                            {selectedDataType}详情
                                        </Typography>
                                        <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {JSON.stringify(selectedData, null, 2)}
                                            </pre>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}
                                </>
                            )}
                        </Box>
                    )}
                </TabPanel>

                {/* 错误标签页 */}
                {analysis.errors && analysis.errors.length > 0 && (
                    <TabPanel value={selectedDataType ? 4 : 3}>
                        <Card variant='outlined' color='danger'>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <ErrorIcon color='error' />
                                    <Typography level='title-lg' color='danger'>
                                        解析错误 ({analysis.errors.length} 个)
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {analysis.errors.map((error, index) => (
                                        <Card key={index} variant='soft' color='danger' size='sm'>
                                            <CardContent>
                                                <Typography level='body-sm' color='danger'>
                                                    {error}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </TabPanel>
                )}
            </Tabs>
        </ModalDialogCustom>
    );
}
