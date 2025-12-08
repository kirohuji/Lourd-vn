import { ResourceResponseDto, UpdateResourceDto } from '@lourd-game/shared';
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
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Sheet,
    Table,
    Typography,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import ModalConfirmation from '../../components/ModalConfirmation';
import { apiClient } from '../../utils/api-client';
import { validateFile } from '../../utils/file-hash-utility';

export default function ResourcesManagement() {
    const { enqueueSnackbar } = useSnackbar();

    // 状态管理
    const [resources, setResources] = useState<ResourceResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedBundle, setSelectedBundle] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceResponseDto | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [bundleFilter, setBundleFilter] = useState<string>('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState<ResourceResponseDto | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editResource, setEditResource] = useState<ResourceResponseDto | null>(null);
    const [editAlias, setEditAlias] = useState('');
    const [editBundle, setEditBundle] = useState('');
    const [editOriginalName, setEditOriginalName] = useState('');
    const [editFileType, setEditFileType] = useState('');
    const [migratingId, setMigratingId] = useState<number | null>(null);
    const [expandedBundles, setExpandedBundles] = useState<string[]>([]);

    // 动态计算当前已有的 bundle 列表（不再写死）
    const bundleOptions = useMemo(() => {
        const set = new Set<string>();
        resources.forEach(r => {
            if (r.bundle) set.add(r.bundle);
        });
        return Array.from(set).sort();
    }, [resources]);

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

        if (!selectedBundle.trim()) {
            enqueueSnackbar('请选择或输入 bundle', { variant: 'warning' });
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
                    await apiClient.uploadResource(file, alias, selectedBundle.trim());

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

    // 判断是否为图片资源（用于预览）
    const isImageResource = (resource: ResourceResponseDto): boolean => {
        const type = resource.fileType?.toLowerCase() || '';
        if (type.startsWith('image')) return true;
        const src = resource.src || '';
        const urlWithoutQuery = src.split('?')[0];
        const ext = urlWithoutQuery.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
    };

    // 计算下载文件名
    const getDownloadFileName = (resource: ResourceResponseDto): string => {
        if (resource.originalName) {
            return resource.originalName;
        }
        const src = resource.src || '';
        if (src.startsWith('data:')) {
            const match = src.match(/^data:(.*?);/);
            const mime = match?.[1] || '';
            if (mime.startsWith('image/')) {
                const ext = mime.split('/')[1];
                return `${resource.alias}.${ext}`;
            }
            return `${resource.alias}`;
        }
        const urlWithoutQuery = src.split('?')[0];
        const namePart = urlWithoutQuery.split('/').pop();
        if (namePart) return namePart;
        return resource.alias;
    };

    const handleDownload = () => {
        if (!previewResource?.src) return;
        const link = document.createElement('a');
        link.href = previewResource.src;
        link.download = getDownloadFileName(previewResource);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openEditDialog = (resource: ResourceResponseDto) => {
        setEditResource(resource);
        setEditAlias(resource.alias);
        setEditBundle(resource.bundle);
        setEditOriginalName(resource.originalName || '');
        setEditFileType(resource.fileType || '');
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editResource) return;

        const dto: UpdateResourceDto = {
            alias: editAlias.trim() || editResource.alias,
            bundle: editBundle.trim() || editResource.bundle,
            originalName: editOriginalName.trim() || undefined,
            fileType: editFileType.trim() || undefined,
        };

        try {
            await apiClient.updateResource(editResource.id, dto);
            enqueueSnackbar('资源更新成功', { variant: 'success' });
            setEditOpen(false);
            setEditResource(null);
            loadResources();
        } catch (error: any) {
            console.error('更新资源失败:', error);
            enqueueSnackbar(`更新失败: ${error.message}`, { variant: 'error' });
        }
    };

    const handleMigrateToCos = async (resource: ResourceResponseDto) => {
        setMigratingId(resource.id);
        try {
            await apiClient.migrateResourceToCos(resource.id);
            enqueueSnackbar('迁移到腾讯云成功', { variant: 'success' });
            loadResources();
        } catch (error: any) {
            console.error('迁移到腾讯云失败:', error);
            enqueueSnackbar(`迁移失败: ${error.message}`, { variant: 'error' });
        } finally {
            setMigratingId(null);
        }
    };

    // 切换某个 bundle 的折叠展开状态
    const toggleBundle = (bundle: string) => {
        setExpandedBundles(prev => (prev.includes(bundle) ? prev.filter(b => b !== bundle) : [...prev, bundle]));
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

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Input
                                placeholder='输入或选择 bundle（资源分组键）'
                                value={selectedBundle}
                                onChange={e => setSelectedBundle(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

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

                        {bundleOptions.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Typography level='body-xs' color='neutral'>
                                    已有 bundle：
                                </Typography>
                                {bundleOptions.map(bundle => (
                                    <Chip
                                        key={bundle}
                                        size='sm'
                                        variant={bundle === selectedBundle ? 'solid' : 'outlined'}
                                        color='primary'
                                        onClick={() => setSelectedBundle(bundle)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        {bundle}
                                    </Chip>
                                ))}
                            </Box>
                        )}
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
                <Sheet
                    variant='outlined'
                    sx={{
                        p: 2,
                        borderRadius: 'sm',
                    }}
                >
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
                                {bundleOptions.map(bundle => (
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
                            <Box
                                sx={{
                                    maxHeight: 'calc(100vh - 320px)',
                                    overflowY: 'auto',
                                }}
                            >
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
                                        {Array.from(
                                            resources
                                                .reduce<Map<string, ResourceResponseDto[]>>((map, res) => {
                                                    const key = res.bundle || '未分组';
                                                    if (!map.has(key)) {
                                                        map.set(key, []);
                                                    }
                                                    map.get(key)!.push(res);
                                                    return map;
                                                }, new Map())
                                                .entries(),
                                        ).map(([bundle, bundleResources]) => {
                                            const isExpanded = expandedBundles.includes(bundle);
                                            return (
                                                <React.Fragment key={bundle}>
                                                    <tr
                                                        onClick={() => toggleBundle(bundle)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td colSpan={6}>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    py: 0.5,
                                                                }}
                                                            >
                                                                <Typography level='title-sm'>
                                                                    {isExpanded ? '▼' : '▶'} Bundle: {bundle}（
                                                                    {bundleResources.length}）
                                                                </Typography>
                                                                <Typography level='body-xs' color='neutral'>
                                                                    点击折叠 / 展开
                                                                </Typography>
                                                            </Box>
                                                        </td>
                                                    </tr>
                                                    {isExpanded &&
                                                        bundleResources.map(resource => (
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
                                                                            onClick={() => {
                                                                                setPreviewResource(resource);
                                                                                setPreviewOpen(true);
                                                                            }}
                                                                        >
                                                                            查看
                                                                        </Button>
                                                                        <Button
                                                                            size='sm'
                                                                            variant='outlined'
                                                                            color='primary'
                                                                            onClick={() => openEditDialog(resource)}
                                                                        >
                                                                            编辑
                                                                        </Button>
                                                                        <Button
                                                                            size='sm'
                                                                            variant='outlined'
                                                                            color='warning'
                                                                            loading={migratingId === resource.id}
                                                                            onClick={() => handleMigrateToCos(resource)}
                                                                        >
                                                                            迁移到腾讯云
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
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Box>
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

            {/* 查看详情对话框 */}
            <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
                <ModalDialog
                    size='lg'
                    sx={{
                        maxWidth: 900,
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }}
                >
                    <ModalClose />
                    {previewResource && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography level='h4'>资源详情</Typography>
                            <Box>
                                <Typography level='body-sm'>
                                    别名: <b>{previewResource.alias}</b>
                                </Typography>
                                <Typography level='body-sm'>
                                    Bundle: <b>{previewResource.bundle}</b>
                                </Typography>
                                <Typography level='body-sm'>文件名: {previewResource.originalName || 'N/A'}</Typography>
                                <Typography level='body-sm'>类型: {previewResource.fileType || '未知类型'}</Typography>
                                <Typography level='body-sm'>
                                    大小: {formatFileSize(previewResource.fileSize)}
                                </Typography>
                                <Typography level='body-sm'>
                                    创建时间: {formatDate(previewResource.createdAt)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography level='body-sm' sx={{ mb: 0.5 }}>
                                    资源地址:
                                </Typography>
                                <Input
                                    readOnly
                                    value={previewResource.src}
                                    sx={{ fontSize: '12px' }}
                                    slotProps={{
                                        input: {
                                            style: {
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            },
                                        },
                                    }}
                                    endDecorator={
                                        <Button
                                            size='sm'
                                            variant='plain'
                                            onClick={() => {
                                                navigator.clipboard
                                                    .writeText(previewResource.src)
                                                    .then(() => enqueueSnackbar('已复制地址', { variant: 'success' }))
                                                    .catch(() =>
                                                        enqueueSnackbar('复制失败', {
                                                            variant: 'error',
                                                        }),
                                                    );
                                            }}
                                        >
                                            复制
                                        </Button>
                                    }
                                />
                            </Box>

                            {isImageResource(previewResource) ? (
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <img
                                        src={previewResource.src}
                                        alt={previewResource.alias}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '50vh',
                                            objectFit: 'contain',
                                            borderRadius: 4,
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Typography level='body-sm' color='neutral'>
                                    当前资源不是图片，无法预览。你可以点击下面按钮在新标签页打开。
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                                <Button variant='outlined' onClick={handleDownload}>
                                    下载
                                </Button>
                                <Button
                                    variant='outlined'
                                    onClick={() => {
                                        if (previewResource?.src) {
                                            window.open(previewResource.src, '_blank');
                                        }
                                    }}
                                >
                                    在新标签页打开
                                </Button>
                                <Button variant='solid' color='primary' onClick={() => setPreviewOpen(false)}>
                                    关闭
                                </Button>
                            </Box>
                        </Box>
                    )}
                </ModalDialog>
            </Modal>

            {/* 编辑资源对话框 */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)}>
                <ModalDialog
                    sx={{
                        maxWidth: 600,
                    }}
                >
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        编辑资源
                    </Typography>
                    {editResource && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography level='body-sm'>ID: {editResource.id}</Typography>
                            <Typography level='body-sm'>当前地址: {editResource.src}</Typography>
                            <Input
                                placeholder='别名 alias'
                                value={editAlias}
                                onChange={e => setEditAlias(e.target.value)}
                            />
                            <Input
                                placeholder='Bundle'
                                value={editBundle}
                                onChange={e => setEditBundle(e.target.value)}
                            />
                            <Input
                                placeholder='原始文件名 originalName'
                                value={editOriginalName}
                                onChange={e => setEditOriginalName(e.target.value)}
                            />
                            <Input
                                placeholder='文件类型 fileType（例如 image/webp 或 webp）'
                                value={editFileType}
                                onChange={e => setEditFileType(e.target.value)}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button variant='outlined' onClick={() => setEditOpen(false)}>
                                    取消
                                </Button>
                                <Button variant='solid' color='primary' onClick={handleSaveEdit}>
                                    保存
                                </Button>
                            </Box>
                        </Box>
                    )}
                </ModalDialog>
            </Modal>

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
