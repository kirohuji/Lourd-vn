import { ResourceResponseDto } from '@lourd-game/shared';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Input,
    LinearProgress,
    Option,
    Select,
    Sheet,
    Table,
    Typography,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import ModalConfirmation from '../../components/ModalConfirmation';
import { apiClient } from '../../utils/api-client';
import { validateFile } from '../../utils/file-hash-utility';

// 支持的 bundle 列表
const SUPPORTED_BUNDLES = [
    'main_menu',
    'map',
    'map-nightcity',
    'mc_room',
    'alice_room',
    'ann_room',
    'bathroom',
    'lounge',
    'terrace',
    'gym_room',
    'alice',
    'navigation_icons',
    'custom',
];

export default function ResourcesManagement() {
    const { enqueueSnackbar } = useSnackbar();

    // 状态管理
    const [resources, setResources] = useState<ResourceResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedBundle, setSelectedBundle] = useState<string>('custom');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceResponseDto | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [bundleFilter, setBundleFilter] = useState<string>('');

    // 加载资源列表
    const loadResources = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getResources({
                page,
                limit: 20,
                bundle: bundleFilter || undefined,
                search: searchQuery || undefined,
            });
            setResources(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error: any) {
            console.error('加载资源失败:', error);
            enqueueSnackbar(`加载失败: ${error.message}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 初始化加载
    useEffect(() => {
        loadResources();
    }, [page, bundleFilter, searchQuery]);

    // 处理文件选择
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        // 验证文件
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        files.forEach(file => {
            const validation = validateFile(file, {
                maxSize: 100 * 1024 * 1024, // 100MB
                allowedTypes: [
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.webp',
                    '.gif',
                    '.svg',
                    '.mp3',
                    '.wav',
                    '.ogg',
                    '.mp4',
                    '.webm',
                ],
            });

            if (validation.valid) {
                validFiles.push(file);
            } else {
                invalidFiles.push(`${file.name}: ${validation.error}`);
            }
        });

        if (invalidFiles.length > 0) {
            enqueueSnackbar(`${invalidFiles.length} 个文件无效:\n${invalidFiles.join('\n')}`, {
                variant: 'warning',
                autoHideDuration: 5000,
            });
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            enqueueSnackbar(`已选择 ${validFiles.length} 个文件`, { variant: 'success' });
        }

        // 重置文件输入
        event.target.value = '';
    };

    // 处理文件上传
    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            enqueueSnackbar('请先选择文件', { variant: 'warning' });
            return;
        }

        if (!selectedBundle) {
            enqueueSnackbar('请选择 bundle', { variant: 'warning' });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const totalFiles = selectedFiles.length;
            let uploadedCount = 0;

            for (const file of selectedFiles) {
                try {
                    const alias = file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名
                    await apiClient.uploadResource(file, alias, selectedBundle);

                    uploadedCount++;
                    const progress = (uploadedCount / totalFiles) * 100;
                    setUploadProgress(Math.round(progress));

                    enqueueSnackbar(`已上传: ${file.name}`, { variant: 'success' });
                } catch (error: any) {
                    console.error(`上传文件失败 ${file.name}:`, error);
                    enqueueSnackbar(`上传失败: ${file.name} - ${error.message}`, { variant: 'error' });
                }
            }

            setSelectedFiles([]);
            enqueueSnackbar(`成功上传 ${uploadedCount}/${totalFiles} 个文件`, { variant: 'success' });
            loadResources();
        } catch (error: any) {
            console.error('上传过程出错:', error);
            enqueueSnackbar('上传过程出错', { variant: 'error' });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // 处理删除资源
    const handleDeleteResource = async (resource: ResourceResponseDto) => {
        try {
            await apiClient.deleteResource(resource.id);
            enqueueSnackbar(`已删除: ${resource.alias}`, { variant: 'success' });
            loadResources();
        } catch (error: any) {
            console.error('删除资源失败:', error);
            enqueueSnackbar(`删除失败: ${error.message}`, { variant: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
        }
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (date: Date | string): string => {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography level='h3'>资源管理</Typography>

                {/* 上传区域 */}
                <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                    <Typography level='title-lg' sx={{ mb: 2 }}>
                        上传资源
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                        <Select
                            value={selectedBundle}
                            onChange={(_, value) => setSelectedBundle(value || 'custom')}
                            sx={{ minWidth: 150 }}
                            placeholder='选择 bundle'
                        >
                            {SUPPORTED_BUNDLES.map(bundle => (
                                <Option key={bundle} value={bundle}>
                                    {bundle === 'custom' ? '自定义' : bundle}
                                </Option>
                            ))}
                        </Select>

                        <Button
                            component='label'
                            variant='outlined'
                            startDecorator={<CloudUploadIcon />}
                            sx={{ flexGrow: 1 }}
                        >
                            选择文件
                            <input
                                type='file'
                                multiple
                                hidden
                                onChange={handleFileSelect}
                                accept='.png,.jpg,.jpeg,.webp,.gif,.svg,.mp3,.wav,.ogg,.mp4,.webm'
                            />
                        </Button>

                        <Button
                            variant='solid'
                            color='primary'
                            startDecorator={<CloudUploadIcon />}
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading || !selectedBundle}
                            loading={uploading}
                        >
                            上传
                        </Button>
                    </Box>

                    {/* 上传进度 */}
                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                上传进度: {uploadProgress}%
                            </Typography>
                            <LinearProgress determinate value={uploadProgress} />
                        </Box>
                    )}

                    {/* 已选文件列表 */}
                    {selectedFiles.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography level='body-sm' sx={{ mb: 1 }}>
                                已选择 {selectedFiles.length} 个文件:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {selectedFiles.map((file, index) => (
                                    <Chip
                                        key={index}
                                        variant='outlined'
                                        color='neutral'
                                        endDecorator={
                                            <Box
                                                component='span'
                                                sx={{ cursor: 'pointer', ml: 0.5 }}
                                                onClick={() => {
                                                    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                                }}
                                            >
                                                ×
                                            </Box>
                                        }
                                    >
                                        {file.name} ({formatFileSize(file.size)})
                                    </Chip>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Sheet>

                {/* 资源列表区域 */}
                <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography level='title-lg'>资源列表 ({total})</Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Input
                                placeholder='搜索资源'
                                startDecorator={<SearchIcon />}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                sx={{ width: 200 }}
                            />
                            <Select
                                value={bundleFilter}
                                onChange={(_, value) => {
                                    setBundleFilter(value || '');
                                    setPage(1);
                                }}
                                sx={{ minWidth: 150 }}
                                placeholder='筛选 bundle'
                            >
                                <Option value=''>全部</Option>
                                {SUPPORTED_BUNDLES.map(bundle => (
                                    <Option key={bundle} value={bundle}>
                                        {bundle}
                                    </Option>
                                ))}
                            </Select>
                            <IconButton variant='outlined' onClick={loadResources} loading={loading} title='刷新'>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : resources.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography level='body-lg' color='neutral'>
                                暂无资源
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Table hoverRow sx={{ '& thead th': { fontWeight: 'lg' } }}>
                                <thead>
                                    <tr>
                                        <th>别名</th>
                                        <th>Bundle</th>
                                        <th>文件</th>
                                        <th>大小</th>
                                        <th>上传时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resources.map(resource => (
                                        <tr key={resource.id}>
                                            <td>
                                                <Typography level='body-sm' fontWeight='lg'>
                                                    {resource.alias}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Chip size='sm' variant='outlined' color='primary'>
                                                    {resource.bundle}
                                                </Chip>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>
                                                    {resource.originalName || 'N/A'}
                                                </Typography>
                                                <Typography level='body-xs' color='neutral'>
                                                    {resource.fileType || '未知类型'}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>
                                                    {formatFileSize(resource.fileSize)}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>
                                                    {formatDate(resource.createdAt)}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size='sm'
                                                        variant='outlined'
                                                        color='neutral'
                                                        onClick={() => window.open(resource.src, '_blank')}
                                                    >
                                                        查看
                                                    </Button>
                                                    <IconButton
                                                        size='sm'
                                                        variant='outlined'
                                                        color='danger'
                                                        onClick={() => {
                                                            setResourceToDelete(resource);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                                    <Button variant='outlined' disabled={page === 1} onClick={() => setPage(page - 1)}>
                                        上一页
                                    </Button>
                                    <Typography level='body-sm' sx={{ alignSelf: 'center' }}>
                                        第 {page} / {totalPages} 页
                                    </Typography>
                                    <Button
                                        variant='outlined'
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        下一页
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Sheet>
            </Box>

            {/* 删除确认对话框 */}
            <ModalConfirmation
                open={deleteConfirmOpen}
                setOpen={setDeleteConfirmOpen}
                color='danger'
                head={
                    <Typography level='h4' startDecorator={<DeleteIcon />}>
                        确认删除
                    </Typography>
                }
                onConfirm={() => {
                    if (resourceToDelete) {
                        handleDeleteResource(resourceToDelete);
                    }
                    return true;
                }}
                disabledConfirm={false}
                startDecorator={<DeleteIcon />}
            >
                {resourceToDelete && (
                    <Typography>
                        确定要删除资源 "{resourceToDelete.alias}" 吗？
                        <br />
                        <Typography level='body-sm' color='neutral'>
                            文件: {resourceToDelete.originalName || 'N/A'}
                            <br />
                            Bundle: {resourceToDelete.bundle}
                            <br />
                            此操作将从服务器和 COS 中删除该资源。
                        </Typography>
                    </Typography>
                )}
            </ModalConfirmation>
        </>
    );
}
