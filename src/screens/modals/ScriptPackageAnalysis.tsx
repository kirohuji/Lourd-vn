import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ErrorIcon from '@mui/icons-material/Error';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import NavigationIcon from '@mui/icons-material/Navigation';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import {
    AspectRatio,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Tab,
    Table,
    TabList,
    TabPanel,
    Tabs,
    Typography,
} from '@mui/joy';
import { useState } from 'react';
import ModalDialogCustom from '../../components/ModalDialog';
import {
    ActivityJSON,
    CharacterJSON,
    CommitmentJSON,
    LabelJSON,
    LabelStepJSON,
    LocationJSON,
    MapJSON,
    QuestJSON,
    RoomJSON,
} from '../../types/json-schema';
import { ScriptPackageAnalysis, TypeScriptLabelFile } from '../../utils/script-package-importer';

interface ScriptPackageAnalysisProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    analysis: ScriptPackageAnalysis | null;
}

// 标签步骤可视化组件
function LabelStepVisualizer({
    step,
    stepIndex,
    aliasToUrlMap,
}: {
    step: LabelStepJSON;
    stepIndex: number;
    aliasToUrlMap?: { [alias: string]: string };
}) {
    const getStepIcon = () => {
        switch (step.type) {
            case 'dialogue':
                return <ChatBubbleIcon />;
            case 'choice':
                return <QuestionAnswerIcon />;
            case 'conditional':
                return <CompareArrowsIcon />;
            case 'action':
                return <CodeIcon />;
            case 'jump':
                return <NavigationIcon />;
            default:
                return null;
        }
    };

    const getStepColor = () => {
        switch (step.type) {
            case 'dialogue':
                return 'primary';
            case 'choice':
                return 'success';
            case 'conditional':
                return 'warning';
            case 'action':
                return 'primary';
            case 'jump':
                return 'neutral';
            default:
                return 'neutral';
        }
    };

    const formatCondition = (condition: any): string => {
        if (!condition) return '';
        if (condition.type === 'questStage') {
            return `任务阶段: ${condition.questId}[${condition.stageIndex}] ${condition.operator || '=='}`;
        }
        if (condition.type === 'questStarted') {
            return `任务已开始: ${condition.questId}`;
        }
        return JSON.stringify(condition, null, 2);
    };

    return (
        <Card variant='outlined' sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip size='sm' variant='soft' color={getStepColor()}>
                        {getStepIcon()}
                    </Chip>
                    <Typography level='title-sm'>
                        步骤 {stepIndex + 1}: {step.type}
                    </Typography>
                </Box>

                {step.type === 'dialogue' && (
                    <Box sx={{ mt: 2 }}>
                        {step.character && (
                            <Chip size='sm' variant='outlined' sx={{ mb: 1 }}>
                                {step.character}
                            </Chip>
                        )}
                        <Typography level='body-md' sx={{ mt: 1, fontStyle: 'italic' }}>
                            "{step.text}"
                        </Typography>
                    </Box>
                )}

                {step.type === 'choice' && step.choices && (
                    <Box sx={{ mt: 2 }}>
                        <Typography level='body-sm' sx={{ mb: 1, fontWeight: 600 }}>
                            选择项 ({step.choices.length} 个):
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {step.choices.map((choice, idx) => (
                                <Card key={idx} variant='soft' size='sm'>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography level='body-sm'>{choice.text}</Typography>
                                            {choice.labelKey && (
                                                <Chip size='sm' variant='outlined'>
                                                    跳转到: {choice.labelKey}
                                                </Chip>
                                            )}
                                            {choice.type === 'close' && (
                                                <Chip size='sm' color='neutral' variant='soft'>
                                                    关闭
                                                </Chip>
                                            )}
                                        </Box>
                                        {choice.condition && (
                                            <Typography level='body-xs' sx={{ mt: 1, color: 'text.tertiary' }}>
                                                条件: {formatCondition(choice.condition)}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}

                {step.type === 'conditional' && (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography level='body-sm' sx={{ fontWeight: 600, mb: 1 }}>
                                条件:
                            </Typography>
                            <Card variant='soft' size='sm'>
                                <CardContent>
                                    <Typography level='body-xs' sx={{ fontFamily: 'monospace' }}>
                                        {formatCondition(step.condition)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        {step.then && step.then.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography level='body-sm' sx={{ fontWeight: 600, mb: 1, color: 'success.500' }}>
                                    ✓ Then ({step.then.length} 个步骤):
                                </Typography>
                                <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'success.300' }}>
                                    {step.then.map((thenStep, idx) => (
                                        <LabelStepVisualizer
                                            key={idx}
                                            step={thenStep}
                                            stepIndex={idx}
                                            aliasToUrlMap={aliasToUrlMap}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {step.else && step.else.length > 0 && (
                            <Box>
                                <Typography level='body-sm' sx={{ fontWeight: 600, mb: 1, color: 'danger.500' }}>
                                    ✗ Else ({step.else.length} 个步骤):
                                </Typography>
                                <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'danger.300' }}>
                                    {step.else.map((elseStep, idx) => (
                                        <LabelStepVisualizer
                                            key={idx}
                                            step={elseStep}
                                            stepIndex={idx}
                                            aliasToUrlMap={aliasToUrlMap}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {step.type === 'action' && step.actions && (
                    <Box sx={{ mt: 2 }}>
                        <Typography level='body-sm' sx={{ mb: 1, fontWeight: 600 }}>
                            动作 ({step.actions.length} 个):
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {step.actions.map((action, idx) => (
                                <Card key={idx} variant='soft' size='sm'>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip size='sm' variant='outlined'>
                                                {action.type}
                                            </Chip>
                                            {action.type === 'showImage' && (
                                                <Typography level='body-xs'>
                                                    图层: {action.layerId}, 图片: {action.imageId}
                                                </Typography>
                                            )}
                                            {action.type === 'questNext' && (
                                                <Typography level='body-xs'>任务: {action.questId}</Typography>
                                            )}
                                            {action.type === 'goNext' && (
                                                <Typography level='body-xs'>继续下一步</Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}

                {step.type === 'jump' && step.jumpTo && (
                    <Box sx={{ mt: 2 }}>
                        <Chip size='sm' variant='soft' color='primary'>
                            跳转到: {step.jumpTo}
                        </Chip>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// 大图预览组件
function LargeImagePreview({
    src,
    alt,
    aliasToUrlMap,
}: {
    src?: string;
    alt?: string;
    aliasToUrlMap?: { [alias: string]: string };
}) {
    if (!src) return null;

    // 从别名映射中查找 URL
    let imageUrl = src;
    if (aliasToUrlMap && aliasToUrlMap[src]) {
        imageUrl = aliasToUrlMap[src];
    }

    // 如果是URL，直接显示
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
        return (
            <AspectRatio ratio='16/9' sx={{ borderRadius: 'md', overflow: 'hidden' }}>
                <img src={imageUrl} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </AspectRatio>
        );
    }

    // 如果是别名但没有找到 URL，显示别名信息
    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '300px',
                borderRadius: 'md',
                bgcolor: 'background.level1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
                gap: 1,
            }}
        >
            <Typography level='body-md' fontWeight={600}>
                别名: {src}
            </Typography>
            <Typography level='body-sm' color='neutral'>
                未在 manifest.json 中找到对应的 URL
            </Typography>
        </Box>
    );
}

// TypeScript 到 JavaScript 的简单转换函数
function compileTypeScriptToJavaScript(tsCode: string): { code: string; errors: string[] } {
    const errors: string[] = [];
    let jsCode = tsCode;

    try {
        // 1. 处理 import 语句
        // 检测本地文件导入（以 ./ 或 ../ 开头）
        const localImports: string[] = [];
        const importRegex = /^import\s+.*?from\s+['"](.*?)['"];?\s*$/gm;
        let importMatch;
        while ((importMatch = importRegex.exec(tsCode)) !== null) {
            const importPath = importMatch[1];
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
                localImports.push(importPath);
            }
        }
        
        // 如果有本地导入，添加警告用户
        if (localImports.length > 0) {
            errors.push(
                `警告: 检测到本地文件导入 (${localImports.join(', ')})。在实际编译时，这些文件需要一起编译。`,
            );
        }
        
        // 移除所有 import 语句（运行时通过 context 注入，本地文件需要在编译时合并）
        jsCode = jsCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');

        // 2. 移除所有 declare 语句
        jsCode = jsCode.replace(/^declare\s+.*?;?\s*$/gm, '');

        // 3. 移除类型注解（改进的处理）
        // 先处理对象字面量中的函数类型（如 onStepStart: async (stepIndex: number) => {...}）
        jsCode = jsCode.replace(/(\w+):\s*async\s*\(([^)]*):\s*[^)]*\)\s*=>/g, '$1: async ($2) =>');
        jsCode = jsCode.replace(/(\w+):\s*\(([^)]*):\s*[^)]*\)\s*=>/g, '$1: ($2) =>');
        
        // 移除函数参数类型（包括箭头函数和普通函数）
        jsCode = jsCode.replace(/\(([^)]*):\s*[^)]*\)/g, (match, params) => {
            // 处理参数列表，移除每个参数的类型注解
            const cleanedParams = params.replace(/(\w+)\s*:\s*[^,)]+/g, '$1');
            return `(${cleanedParams})`;
        });
        
        // 移除变量类型注解（更精确的匹配，包括数组类型）
        // 先处理复杂类型（如 Array<any>、StoredChoiceInterface[]）
        jsCode = jsCode.replace(/:\s*Array<[^>]*>/g, '');
        jsCode = jsCode.replace(/:\s*\w+\[\]/g, '');
        jsCode = jsCode.replace(
            /:\s*(any|string|number|boolean|object|\(.*?\)\s*=>\s*.*?)(\s*[=,;\)\]\}])/g,
            '$2',
        );
        
        // 移除类型断言
        jsCode = jsCode.replace(/\s+as\s+(any|string|number|boolean|object)/g, '');

        // 4. 转换 export const/function 为 const/function，然后在文件末尾添加 module.exports
        const exports: string[] = [];

        // 匹配 export const/function
        const exportRegex = /export\s+(const|function)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(jsCode)) !== null) {
            const exportName = match[2];
            exports.push(exportName);
        }

        // 移除 export 关键字
        jsCode = jsCode.replace(/export\s+/g, '');

        // 5. 在文件末尾添加 module.exports（如果存在导出）
        if (exports.length > 0) {
            // 检查是否已经有 module.exports
            if (!jsCode.includes('module.exports')) {
                const moduleExports = `\n\n// 导出所有 Label（CommonJS 格式）\nmodule.exports = {\n    ${exports.join(
                    ',\n    ',
                )},\n};`;
                jsCode = jsCode.trim() + moduleExports;
            }
        }

        // 6. 清理多余的空行
        jsCode = jsCode.replace(/\n{3,}/g, '\n\n');

        return { code: jsCode.trim(), errors };
    } catch (error) {
        errors.push(`编译错误: ${error instanceof Error ? error.message : String(error)}`);
        return { code: jsCode, errors };
    }
}

export default function ScriptPackageAnalysisModal({ open, setOpen, analysis }: ScriptPackageAnalysisProps) {
    const [tabValue, setTabValue] = useState(0);
    const [selectedDataType, setSelectedDataType] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [compiledCode, setCompiledCode] = useState<string | null>(null);
    const [compileErrors, setCompileErrors] = useState<string[]>([]);
    const [showCompiled, setShowCompiled] = useState(false);

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
        {
            label: 'TypeScript Labels',
            value: analysis.typescriptLabels,
            icon: '📄',
            data: analysis.typescriptLabelsData,
        },
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
        setShowCompiled(false);
        setCompiledCode(null);
        setCompileErrors([]);
    };

    const handleCompile = () => {
        if (isTypeScriptLabelFile(selectedData)) {
            const result = compileTypeScriptToJavaScript(selectedData.content);
            setCompiledCode(result.code);
            setCompileErrors(result.errors);
            setShowCompiled(true);
        }
    };

    // 获取当前选中的数据
    const getSelectedData = ():
        | CharacterJSON
        | MapJSON
        | LocationJSON
        | RoomJSON
        | LabelJSON
        | ActivityJSON
        | QuestJSON
        | CommitmentJSON
        | string
        | TypeScriptLabelFile
        | null => {
        if (!selectedDataType || selectedIndex === null) return null;
        const stat = stats.find(s => s.label === selectedDataType);
        if (!stat || !stat.data) return null;
        return stat.data[selectedIndex];
    };

    const selectedData = getSelectedData();

    // 类型守卫函数
    const isMapJSON = (data: any): data is MapJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'name' in data &&
            'background' in data &&
            selectedDataType === '地图'
        );
    };

    const isLocationJSON = (data: any): data is LocationJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'name' in data &&
            'mapId' in data &&
            'sprite' in data &&
            selectedDataType === '地点'
        );
    };

    const isRoomJSON = (data: any): data is RoomJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'name' in data &&
            'locationId' in data &&
            'background' in data &&
            selectedDataType === '房间'
        );
    };

    const isCharacterJSON = (data: any): data is CharacterJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'name' in data &&
            'name' in data &&
            selectedDataType === '角色'
        );
    };

    const isQuestJSON = (data: any): data is QuestJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'name' in data &&
            'stages' in data &&
            selectedDataType === '任务'
        );
    };

    const isCommitmentJSON = (data: any): data is CommitmentJSON => {
        return (
            data &&
            typeof data === 'object' &&
            'id' in data &&
            'characterId' in data &&
            'roomId' in data &&
            selectedDataType === '日常安排'
        );
    };

    const isLabelJSON = (data: any): data is LabelJSON => {
        return data && typeof data === 'object' && 'key' in data && 'steps' in data && selectedDataType === '标签';
    };

    const isTypeScriptLabelFile = (data: any): data is TypeScriptLabelFile => {
        return (
            data &&
            typeof data === 'object' &&
            'path' in data &&
            'content' in data &&
            selectedDataType === 'TypeScript Labels'
        );
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
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                    }}
                                                >
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
                                                            {stat.data.map((item: any, index: number) => {
                                                                // 处理 TypeScript Label 文件
                                                                if (
                                                                    selectedDataType === 'TypeScript Labels' &&
                                                                    item.path
                                                                ) {
                                                                    const fileName =
                                                                        item.path.split('/').pop() || item.path;
                                                                    return (
                                                                        <tr
                                                                            key={index}
                                                                            style={{ cursor: 'pointer' }}
                                                                            onClick={() => setSelectedIndex(index)}
                                                                        >
                                                                            <td>
                                                                                <Chip size='sm' variant='soft'>
                                                                                    {index + 1}
                                                                                </Chip>
                                                                            </td>
                                                                            <td>{fileName}</td>
                                                                            <td>
                                                                                <Chip
                                                                                    size='sm'
                                                                                    variant='outlined'
                                                                                    color='primary'
                                                                                >
                                                                                    查看源码
                                                                                </Chip>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }
                                                                // 处理其他数据类型
                                                                return (
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
                                                                        <td>
                                                                            {item.name ||
                                                                                item.key ||
                                                                                `项目 ${index + 1}`}
                                                                        </td>
                                                                        <td>
                                                                            <Chip
                                                                                size='sm'
                                                                                variant='outlined'
                                                                                color='primary'
                                                                            >
                                                                                查看详情
                                                                            </Chip>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
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
                                                            <LargeImagePreview
                                                                src={selectedData.background}
                                                                alt={selectedData.name}
                                                                aliasToUrlMap={analysis.aliasToUrlMap}
                                                            />
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 2,
                                                                }}
                                                            >
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        早晨
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.morning}
                                                                        alt='早晨'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        下午
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.afternoon}
                                                                        alt='下午'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        晚上
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.evening}
                                                                        alt='晚上'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        夜晚
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.night}
                                                                        alt='夜晚'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
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
                                                                    <td style={{ width: '120px', fontWeight: 600 }}>
                                                                        ID
                                                                    </td>
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
                                                                            <Chip
                                                                                size='sm'
                                                                                variant='outlined'
                                                                                color='primary'
                                                                            >
                                                                                时段背景
                                                                            </Chip>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                {selectedData.neighboringMaps && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>相邻地图</td>
                                                                        <td>
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    flexWrap: 'wrap',
                                                                                    gap: 1,
                                                                                }}
                                                                            >
                                                                                {Object.entries(
                                                                                    selectedData.neighboringMaps,
                                                                                ).map(([dir, id]) => (
                                                                                    <Chip
                                                                                        key={dir}
                                                                                        size='sm'
                                                                                        variant='soft'
                                                                                    >
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
                                                            <LargeImagePreview
                                                                src={selectedData.sprite.alias}
                                                                alt={selectedData.name}
                                                                aliasToUrlMap={analysis.aliasToUrlMap}
                                                            />
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
                                                                    <td style={{ width: '120px', fontWeight: 600 }}>
                                                                        ID
                                                                    </td>
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
                                                                        <Chip
                                                                            size='sm'
                                                                            variant={
                                                                                selectedData.sprite.type === 'image'
                                                                                    ? 'soft'
                                                                                    : 'outlined'
                                                                            }
                                                                        >
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
                                                            <LargeImagePreview
                                                                src={selectedData.background}
                                                                alt={selectedData.name}
                                                                aliasToUrlMap={analysis.aliasToUrlMap}
                                                            />
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 2,
                                                                }}
                                                            >
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        早晨
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.morning}
                                                                        alt='早晨'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        下午
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.afternoon}
                                                                        alt='下午'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        晚上
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.evening}
                                                                        alt='晚上'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                        夜晚
                                                                    </Typography>
                                                                    <LargeImagePreview
                                                                        src={selectedData.background.night}
                                                                        alt='夜晚'
                                                                        aliasToUrlMap={analysis.aliasToUrlMap}
                                                                    />
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
                                                                    <td style={{ width: '120px', fontWeight: 600 }}>
                                                                        ID
                                                                    </td>
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
                                                                            <Chip
                                                                                size='sm'
                                                                                variant='outlined'
                                                                                color='primary'
                                                                            >
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
                                                                            <Chip
                                                                                size='sm'
                                                                                color='success'
                                                                                variant='soft'
                                                                            >
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

                                    {/* 角色详情 */}
                                    {isCharacterJSON(selectedData) && (
                                        <Grid container spacing={2}>
                                            <Grid xs={12} md={5}>
                                                <Card variant='outlined'>
                                                    <CardContent>
                                                        <Typography level='title-md' sx={{ mb: 2 }}>
                                                            角色图标
                                                        </Typography>
                                                        {selectedData.icon ? (
                                                            <LargeImagePreview
                                                                src={selectedData.icon}
                                                                alt={selectedData.name}
                                                                aliasToUrlMap={analysis.aliasToUrlMap}
                                                            />
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
                                                                <Typography level='body-md'>无图标</Typography>
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
                                                                    <td style={{ width: '120px', fontWeight: 600 }}>
                                                                        ID
                                                                    </td>
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
                                                                {selectedData.surname && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>姓氏</td>
                                                                        <td>{selectedData.surname}</td>
                                                                    </tr>
                                                                )}
                                                                {selectedData.age && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>年龄</td>
                                                                        <td>{selectedData.age}</td>
                                                                    </tr>
                                                                )}
                                                                {selectedData.color && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>颜色</td>
                                                                        <td>
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 1,
                                                                                }}
                                                                            >
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius: '50%',
                                                                                        bgcolor: selectedData.color,
                                                                                        border: '2px solid',
                                                                                        borderColor: 'divider',
                                                                                    }}
                                                                                />
                                                                                <Typography level='body-sm'>
                                                                                    {selectedData.color}
                                                                                </Typography>
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

                                    {/* 任务详情 */}
                                    {isQuestJSON(selectedData) && (
                                        <Box>
                                            <Card variant='outlined' sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        {selectedData.image && (
                                                            <Box sx={{ width: '200px', flexShrink: 0 }}>
                                                                <LargeImagePreview
                                                                    src={selectedData.image}
                                                                    alt={selectedData.name}
                                                                    aliasToUrlMap={analysis.aliasToUrlMap}
                                                                />
                                                            </Box>
                                                        )}
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography level='title-lg' sx={{ mb: 1 }}>
                                                                {selectedData.name}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                                <Chip size='sm' variant='soft'>
                                                                    {selectedData.id}
                                                                </Chip>
                                                                {selectedData.inDevelopment && (
                                                                    <Chip size='sm' color='warning' variant='soft'>
                                                                        开发中
                                                                    </Chip>
                                                                )}
                                                            </Box>
                                                            <Typography level='body-sm'>
                                                                {selectedData.description}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                            <Card variant='outlined'>
                                                <CardContent>
                                                    <Typography level='title-md' sx={{ mb: 2 }}>
                                                        任务阶段 ({selectedData.stages.length} 个)
                                                    </Typography>
                                                    <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                                                        {selectedData.stages.map((stage, stageIndex) => (
                                                            <Card key={stageIndex} variant='soft' sx={{ mb: 1 }}>
                                                                <CardContent>
                                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                                        {stage.image && (
                                                                            <Box sx={{ width: '150px', flexShrink: 0 }}>
                                                                                <LargeImagePreview
                                                                                    src={stage.image}
                                                                                    alt={stage.name}
                                                                                    aliasToUrlMap={
                                                                                        analysis.aliasToUrlMap
                                                                                    }
                                                                                />
                                                                            </Box>
                                                                        )}
                                                                        <Box sx={{ flex: 1 }}>
                                                                            <Typography level='title-sm'>
                                                                                {stage.name}
                                                                            </Typography>
                                                                            <Chip
                                                                                size='sm'
                                                                                variant='outlined'
                                                                                sx={{ mt: 0.5, mb: 0.5 }}
                                                                            >
                                                                                {stage.id}
                                                                            </Chip>
                                                                            <Typography level='body-sm' sx={{ mt: 1 }}>
                                                                                {stage.description}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Box>
                                    )}

                                    {/* 日常安排详情 */}
                                    {isCommitmentJSON(selectedData) && (
                                        <Grid container spacing={2}>
                                            <Grid xs={12} md={5}>
                                                <Card variant='outlined'>
                                                    <CardContent>
                                                        <Typography level='title-md' sx={{ mb: 2 }}>
                                                            图片
                                                        </Typography>
                                                        {selectedData.image ? (
                                                            typeof selectedData.image === 'string' ? (
                                                                <LargeImagePreview
                                                                    src={selectedData.image}
                                                                    alt={selectedData.id}
                                                                    aliasToUrlMap={analysis.aliasToUrlMap}
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 2,
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                            早晨
                                                                        </Typography>
                                                                        <LargeImagePreview
                                                                            src={selectedData.image.morning}
                                                                            alt='早晨'
                                                                            aliasToUrlMap={analysis.aliasToUrlMap}
                                                                        />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography level='body-sm' sx={{ mb: 1 }}>
                                                                            下午
                                                                        </Typography>
                                                                        <LargeImagePreview
                                                                            src={selectedData.image.afternoon}
                                                                            alt='下午'
                                                                            aliasToUrlMap={analysis.aliasToUrlMap}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            )
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
                                                            {selectedData.id}
                                                        </Typography>
                                                        <Table>
                                                            <tbody>
                                                                <tr>
                                                                    <td style={{ width: '120px', fontWeight: 600 }}>
                                                                        ID
                                                                    </td>
                                                                    <td>
                                                                        <Chip size='sm' variant='soft'>
                                                                            {selectedData.id}
                                                                        </Chip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ fontWeight: 600 }}>角色ID</td>
                                                                    <td>
                                                                        <Chip size='sm' variant='outlined'>
                                                                            {selectedData.characterId}
                                                                        </Chip>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ fontWeight: 600 }}>房间ID</td>
                                                                    <td>
                                                                        <Chip size='sm' variant='outlined'>
                                                                            {selectedData.roomId}
                                                                        </Chip>
                                                                    </td>
                                                                </tr>
                                                                {selectedData.priority !== undefined && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>优先级</td>
                                                                        <td>{selectedData.priority}</td>
                                                                    </tr>
                                                                )}
                                                                {selectedData.timeSlot && (
                                                                    <tr>
                                                                        <td style={{ fontWeight: 600 }}>时间段</td>
                                                                        <td>
                                                                            {selectedData.timeSlot.from}:00 -{' '}
                                                                            {selectedData.timeSlot.to}:00
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                <tr>
                                                                    <td style={{ fontWeight: 600 }}>执行类型</td>
                                                                    <td>
                                                                        <Chip size='sm' variant='soft'>
                                                                            {selectedData.executionType || 'manual'}
                                                                        </Chip>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </Grid>
                                    )}

                                    {/* 标签详情 */}
                                    {isLabelJSON(selectedData) && (
                                        <Box>
                                            <Card variant='outlined' sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                        <Typography level='title-lg'>标签键</Typography>
                                                        <Chip size='lg' variant='soft' color='primary'>
                                                            {selectedData.key}
                                                        </Chip>
                                                    </Box>
                                                    {selectedData.onStepStart &&
                                                        Object.keys(selectedData.onStepStart).length > 0 && (
                                                            <Box sx={{ mt: 2 }}>
                                                                <Typography
                                                                    level='body-sm'
                                                                    sx={{ mb: 1, fontWeight: 600 }}
                                                                >
                                                                    步骤开始时的动作:
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    {Object.entries(selectedData.onStepStart).map(
                                                                        ([stepIndex, actions]) => (
                                                                            <Card
                                                                                key={stepIndex}
                                                                                variant='soft'
                                                                                size='sm'
                                                                            >
                                                                                <CardContent>
                                                                                    <Typography
                                                                                        level='body-xs'
                                                                                        sx={{ mb: 1 }}
                                                                                    >
                                                                                        步骤 {stepIndex}:
                                                                                    </Typography>
                                                                                    <Box
                                                                                        sx={{
                                                                                            display: 'flex',
                                                                                            flexWrap: 'wrap',
                                                                                            gap: 1,
                                                                                        }}
                                                                                    >
                                                                                        {actions.map(
                                                                                            (
                                                                                                action: any,
                                                                                                idx: number,
                                                                                            ) => (
                                                                                                <Chip
                                                                                                    key={idx}
                                                                                                    size='sm'
                                                                                                    variant='outlined'
                                                                                                >
                                                                                                    {action.type}
                                                                                                    {action.type ===
                                                                                                        'showImage' &&
                                                                                                        ` (${action.imageId})`}
                                                                                                    {action.type ===
                                                                                                        'questNext' &&
                                                                                                        ` (${action.questId})`}
                                                                                                </Chip>
                                                                                            ),
                                                                                        )}
                                                                                    </Box>
                                                                                </CardContent>
                                                                            </Card>
                                                                        ),
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                </CardContent>
                                            </Card>
                                            <Card variant='outlined'>
                                                <CardContent>
                                                    <Typography level='title-md' sx={{ mb: 2 }}>
                                                        步骤流程 ({selectedData.steps.length} 个)
                                                    </Typography>
                                                    <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                                                        {selectedData.steps.map((step, stepIndex) => (
                                                            <LabelStepVisualizer
                                                                key={stepIndex}
                                                                step={step}
                                                                stepIndex={stepIndex}
                                                                aliasToUrlMap={analysis.aliasToUrlMap}
                                                            />
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Box>
                                    )}

                                    {/* TypeScript Label 源码详情 */}
                                    {isTypeScriptLabelFile(selectedData) && (
                                        <Box>
                                            <Card variant='outlined' sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            mb: 2,
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <CodeIcon />
                                                            <Typography level='title-lg'>
                                                                TypeScript Label 源码
                                                            </Typography>
                                                        </Box>
                                                        <Button
                                                            variant='outlined'
                                                            color='primary'
                                                            startDecorator={<BuildIcon />}
                                                            onClick={handleCompile}
                                                        >
                                                            编译为 JavaScript
                                                        </Button>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography level='body-sm' sx={{ mb: 1, fontWeight: 600 }}>
                                                            文件路径:
                                                        </Typography>
                                                        <Chip size='sm' variant='soft' color='primary'>
                                                            {selectedData.path}
                                                        </Chip>
                                                    </Box>
                                                    {compileErrors.length > 0 && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Card variant='soft' color='danger' size='sm'>
                                                                <CardContent>
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                            mb: 1,
                                                                        }}
                                                                    >
                                                                        <ErrorIcon color='error' />
                                                                        <Typography
                                                                            level='body-sm'
                                                                            color='danger'
                                                                            fontWeight={600}
                                                                        >
                                                                            编译错误
                                                                        </Typography>
                                                                    </Box>
                                                                    {compileErrors.map((error, index) => (
                                                                        <Typography
                                                                            key={index}
                                                                            level='body-xs'
                                                                            color='danger'
                                                                        >
                                                                            {error}
                                                                        </Typography>
                                                                    ))}
                                                                </CardContent>
                                                            </Card>
                                                        </Box>
                                                    )}
                                                    {compiledCode && showCompiled && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Card variant='soft' color='success' size='sm'>
                                                                <CardContent>
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <CheckCircleIcon color='success' />
                                                                        <Typography
                                                                            level='body-sm'
                                                                            color='success'
                                                                            fontWeight={600}
                                                                        >
                                                                            编译成功！
                                                                        </Typography>
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                            {showCompiled && compiledCode ? (
                                                <Card variant='outlined' sx={{ mb: 2 }}>
                                                    <CardContent>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                mb: 2,
                                                            }}
                                                        >
                                                            <Typography level='title-md'>
                                                                编译后的 JavaScript 代码
                                                            </Typography>
                                                            <Button
                                                                variant='plain'
                                                                size='sm'
                                                                onClick={() => setShowCompiled(false)}
                                                            >
                                                                显示源码
                                                            </Button>
                                                        </Box>
                                                        <Box
                                                            sx={{
                                                                maxHeight: '70vh',
                                                                overflow: 'auto',
                                                                bgcolor: 'background.level1',
                                                                p: 2,
                                                                borderRadius: 'md',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            <pre
                                                                style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordBreak: 'break-word',
                                                                    margin: 0,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.875rem',
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                {compiledCode}
                                                            </pre>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <Card variant='outlined'>
                                                    <CardContent>
                                                        <Typography level='title-md' sx={{ mb: 2 }}>
                                                            源码内容
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                maxHeight: '70vh',
                                                                overflow: 'auto',
                                                                bgcolor: 'background.level1',
                                                                p: 2,
                                                                borderRadius: 'md',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            <pre
                                                                style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordBreak: 'break-word',
                                                                    margin: 0,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.875rem',
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                {selectedData.content}
                                                            </pre>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Box>
                                    )}

                                    {/* 其他数据类型 */}
                                    {![
                                        '地图',
                                        '地点',
                                        '房间',
                                        '角色',
                                        '任务',
                                        '日常安排',
                                        '标签',
                                        'TypeScript Labels',
                                    ].includes(selectedDataType) && (
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
