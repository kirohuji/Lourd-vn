import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
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
import { useTranslation } from 'react-i18next';
import ModalConfirmation from '../../components/ModalConfirmation';
import { validateFile } from '../../utils/file-hash-utility';
import { ResourceRecord } from '../../utils/indexedDB-utility';
import { manifestManager } from '../../utils/manifest-manager';

interface ResourceManagementModalProps {
    open: boolean;
    onClose: () => void;
}

// 支持的 bundle 列表（可以从现有 manifest 中获取或手动定义）
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
    'custom', // 自定义 bundle
];

export default function ResourceManagementModal({ open, onClose }: ResourceManagementModalProps) {
    const { t } = useTranslation(['ui']);
    const { enqueueSnackbar } = useSnackbar();

    // 状态管理
    const [resources, setResources] = useState<ResourceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedBundle, setSelectedBundle] = useState<string>('custom');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceRecord | null>(null);

    // 加载资源列表
    const loadResources = async () => {
        setLoading(true);
        try {
            const allResources = await manifestManager.getAllResources();
            setResources(allResources);
        } catch (error) {
            console.error('加载资源失败:', error);
            enqueueSnackbar(t('resource.loadFailed'), { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 初始化加载
    useEffect(() => {
        if (open) {
            loadResources();
        }
    }, [open]);

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
            const uploadedResources: ResourceRecord[] = [];

            for (const file of selectedFiles) {
                try {
                    const resource = await manifestManager.uploadAndAddResource(
                        file,
                        selectedBundle,
                        undefined,
                        progress => {
                            // 计算总体进度
                            const fileProgress = progress.percent / 100;
                            const overallProgress = (uploadedCount + fileProgress) / totalFiles;
                            setUploadProgress(Math.round(overallProgress * 100));
                        },
                    );

                    uploadedResources.push(resource);
                    uploadedCount++;

                    enqueueSnackbar(`已上传: ${file.name}`, { variant: 'success' });
                } catch (error: any) {
                    console.error(`上传文件失败 ${file.name}:`, error);
                    enqueueSnackbar(`上传失败: ${file.name} - ${error.message}`, { variant: 'error' });
                }
            }

            // 更新资源列表
            setResources(prev => [...uploadedResources, ...prev]);
            setSelectedFiles([]);

            enqueueSnackbar(`成功上传 ${uploadedCount}/${totalFiles} 个文件`, { variant: 'success' });
        } catch (error: any) {
            console.error('上传过程出错:', error);
            enqueueSnackbar('上传过程出错', { variant: 'error' });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // 处理删除资源
    const handleDeleteResource = async (resource: ResourceRecord) => {
        if (!resource.id) return;

        try {
            await manifestManager.deleteResource(resource.id);

            // 更新资源列表
            setResources(prev => prev.filter(r => r.id !== resource.id));

            enqueueSnackbar(t('resource.deleteSuccess', { alias: resource.alias }), { variant: 'success' });
        } catch (error: any) {
            console.error('删除资源失败:', error);
            enqueueSnackbar(t('resource.deleteFailed'), { variant: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
        }
    };

    // 导出 manifest
    const handleExportManifest = async () => {
        try {
            const manifest = await manifestManager.generateManifestFromIndexedDB();
            manifestManager.exportManifestToFile(manifest, 'dynamic-manifest.json');
            enqueueSnackbar(t('resource.exportSuccess'), { variant: 'success' });
        } catch (error) {
            console.error('导出 manifest 失败:', error);
            enqueueSnackbar(t('resource.exportFailed'), { variant: 'error' });
        }
    };

    // 过滤资源
    const filteredResources = resources.filter(resource => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        return (
            resource.alias.toLowerCase().includes(query) ||
            resource.bundle.toLowerCase().includes(query) ||
            resource.originalName?.toLowerCase().includes(query) ||
            resource.hash.toLowerCase().includes(query)
        );
    });

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (date: Date): string => {
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
            <ModalConfirmation
                open={open}
                setOpen={onClose}
                color='primary'
                head={
                    <Typography level='h4' startDecorator={<CloudUploadIcon />}>
                        {t('resource_management')}
                    </Typography>
                }
                onConfirm={() => {
                    onClose();
                    return true;
                }}
                disabledConfirm={uploading}
                startDecorator={null}
                maxWidth='lg'
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 上传区域 */}
                    <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                        <Typography level='title-lg' sx={{ mb: 2 }}>
                            {t('resource_upload')}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <Select
                                value={selectedBundle}
                                onChange={(_, value) => setSelectedBundle(value || 'custom')}
                                sx={{ minWidth: 150 }}
                                placeholder={t('resource_selectBundle')}
                            >
                                {SUPPORTED_BUNDLES.map(bundle => (
                                    <Option key={bundle} value={bundle}>
                                        {bundle === 'custom' ? t('resource_customBundle') : bundle}
                                    </Option>
                                ))}
                            </Select>

                            <Button
                                component='label'
                                variant='outlined'
                                startDecorator={<FolderIcon />}
                                sx={{ flexGrow: 1 }}
                            >
                                {t('resource_select_files')}
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
                                {t('resource_upload_button')}
                            </Button>
                        </Box>

                        {/* 上传进度 */}
                        {uploading && (
                            <Box sx={{ mt: 2 }}>
                                <Typography level='body-sm' sx={{ mb: 1 }}>
                                    {t('resource_uploadProgress')}: {uploadProgress}%
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

                    <Divider />

                    {/* 资源列表区域 */}
                    <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography level='title-lg'>
                                {t('resource_list')} ({filteredResources.length})
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Input
                                    placeholder={t('resource_search')}
                                    startDecorator={<SearchIcon />}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    sx={{ width: 200 }}
                                />

                                <IconButton
                                    variant='outlined'
                                    onClick={loadResources}
                                    loading={loading}
                                    title={t('resource_refresh')}
                                >
                                    <RefreshIcon />
                                </IconButton>

                                <Button
                                    variant='outlined'
                                    startDecorator={<DownloadIcon />}
                                    onClick={handleExportManifest}
                                >
                                    {t('resource_export_manifest')}
                                </Button>
                            </Box>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredResources.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography level='body-lg' color='neutral'>
                                    {searchQuery ? t('resource_noMatch') : t('resource_noResources')}
                                </Typography>
                            </Box>
                        ) : (
                            <Table hoverRow sx={{ '& thead th': { fontWeight: 'lg' } }}>
                                <thead>
                                    <tr>
                                        <th>{t('resource_alias')}</th>
                                        <th>{t('resource_bundle')}</th>
                                        <th>{t('resource_file')}</th>
                                        <th>{t('resource_size')}</th>
                                        <th>{t('resource_upload_time')}</th>
                                        <th>{t('resource_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResources.map(resource => (
                                        <tr key={resource.id}>
                                            <td>
                                                <Typography level='body-sm' fontWeight='lg'>
                                                    {resource.alias}
                                                </Typography>
                                                {resource.hash && (
                                                    <Typography level='body-xs' color='neutral'>
                                                        {resource.hash.substring(0, 8)}...
                                                    </Typography>
                                                )}
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
                                                    {formatFileSize(resource.fileSize || 0)}
                                                </Typography>
                                            </td>
                                            <td>
                                                <Typography level='body-sm'>
                                                    {formatDate(resource.uploadDate)}
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
                                                        {t('resource_view')}
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
                        )}
                    </Sheet>
                </Box>
            </ModalConfirmation>

            {/* 删除确认对话框 */}
            <ModalConfirmation
                open={deleteConfirmOpen}
                setOpen={setDeleteConfirmOpen}
                color='danger'
                head={
                    <Typography level='h4' startDecorator={<DeleteIcon />}>
                        {t('resource_delete_confirm')}
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
                        {t('resource_delete_message', { alias: resourceToDelete.alias })}
                        <br />
                        <Typography level='body-sm' color='neutral'>
                            文件: {resourceToDelete.originalName || 'N/A'}
                            <br />
                            Bundle: {resourceToDelete.bundle}
                            <br />
                            此操作将从 IndexedDB 和 COS 中删除该资源。
                        </Typography>
                    </Typography>
                )}
            </ModalConfirmation>
        </>
    );
}
