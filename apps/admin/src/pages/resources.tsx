import { BundleDialog } from '@/components/features/bundle-dialog';
import { BundleResourceGroup } from '@/components/features/bundle-resource-group';
import { BundleInfo as BundleInfoType, BundleTable } from '@/components/features/bundle-table';
import { Pagination } from '@/components/features/pagination';
import { ResourceUpload } from '@/components/features/resource-upload';
import { SearchBar } from '@/components/features/search-bar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import {
    useBundleList,
    useDeleteResource,
    useMigrateResourceToCos,
    useResources,
    useUpdateBundle,
} from '@/lib/hooks/use-resources';
import { ResourceResponseDto } from '@lourd-game/shared';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BundleInfo extends BundleInfoType {
    resources: ResourceResponseDto[];
}

export function ResourcesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [bundleFilter, setBundleFilter] = useState<string>('all');
    const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<ResourceResponseDto | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [resourceToEdit, setResourceToEdit] = useState<ResourceResponseDto | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadBundle, setUploadBundle] = useState<string | undefined>(undefined);
    const [migratingId, setMigratingId] = useState<number | null>(null);
    const [migratingBundle, setMigratingBundle] = useState<string | null>(null);
    const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState<{ name: string; type: 'common' | 'chapter' } | null>(null);
    const [page, setPage] = useState(1);
    const limit = 20;
    const [bundlePage, setBundlePage] = useState(1);
    const bundleLimit = 10;

    const { toast } = useToast();
    // 获取 Bundle 列表（包含统计信息）
    const {
        data: bundleListData,
        isLoading: isLoadingBundles,
        refetch: refetchBundles,
    } = useBundleList({
        bundleType: bundleFilter === 'all' ? undefined : bundleFilter,
        search: searchQuery || undefined,
        page: bundlePage,
        limit: bundleLimit,
    });
    // 获取选中 Bundle 的资源（分页）
    const { data: resourcesData, refetch: refetchResources } = useResources({
        page,
        limit,
        bundle: selectedBundle || undefined,
        search: searchQuery || undefined,
    });
    const deleteResource = useDeleteResource();
    const migrateToCos = useMigrateResourceToCos();
    const updateBundle = useUpdateBundle();

    // Bundle 信息
    const bundleInfo: BundleInfo[] = useMemo(() => {
        if (!bundleListData) return [];
        return bundleListData.data.map(bundle => ({
            ...bundle,
            resources: [], // Bundle 列表 API 不返回资源详情
        }));
    }, [bundleListData]);

    // Bundle 分页信息
    const bundleTotalPages = bundleListData?.totalPages || 1;
    const bundleTotal = bundleListData?.total || 0;

    // 当前页的资源
    const paginatedResources = resourcesData?.data || [];
    const totalPages = resourcesData?.totalPages || 1;
    const total = resourcesData?.total || 0;

    // 默认选中第一个 Bundle
    useEffect(() => {
        if (!selectedBundle && bundleInfo.length > 0) {
            setSelectedBundle(bundleInfo[0].name);
            setPage(1); // 重置到第一页
        }
    }, [bundleInfo, selectedBundle]);

    // 当选中 Bundle 改变时，重置到第一页
    useEffect(() => {
        if (selectedBundle) {
            setPage(1);
        }
    }, [selectedBundle]);

    // 获取选中 Bundle 的资源（已分页）
    const selectedBundleResources = paginatedResources;

    // 获取选中 Bundle 的资源总数
    const selectedBundleTotal = total;
    const selectedBundleTotalPages = totalPages;

    // 获取所有 Bundle 选项
    const bundleOptions = useMemo(() => {
        return bundleInfo.map(b => b.name).sort();
    }, [bundleInfo]);

    // 创建 Bundle 名称到类型的映射
    const bundleTypeMap = useMemo(() => {
        const map = new Map<string, 'common' | 'chapter' | 'mixed'>();
        bundleInfo.forEach(bundle => {
            map.set(bundle.name, bundle.bundleType);
        });
        return map;
    }, [bundleInfo]);

    const handleEdit = (resource: ResourceResponseDto) => {
        setResourceToEdit(resource);
        setEditDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!resourceToDelete) return;

        try {
            await deleteResource.mutateAsync(resourceToDelete.id);
            toast({
                title: '成功',
                description: `已删除资源: ${resourceToDelete.alias}`,
            });
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
            refetchResources();
            refetchBundles();
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除资源失败',
                variant: 'destructive',
            });
        }
    };

    const handleMigrateToCos = async (id: number) => {
        setMigratingId(id);
        try {
            await migrateToCos.mutateAsync(id);
            toast({
                title: '成功',
                description: '资源已迁移到 COS',
            });
            refetchResources();
            refetchBundles();
        } catch (error: any) {
            toast({
                title: '迁移失败',
                description: error.message || '迁移资源失败',
                variant: 'destructive',
            });
        } finally {
            setMigratingId(null);
        }
    };

    const handleMigrateBundleToCos = async (bundleName: string) => {
        const bundle = bundleInfo.find(b => b.name === bundleName);
        if (!bundle || bundle.resourceCount === 0) {
            toast({
                title: '错误',
                description: '该 Bundle 没有资源',
                variant: 'destructive',
            });
            return;
        }

        setMigratingBundle(bundleName);
        let successCount = 0;
        let failCount = 0;

        try {
            // 获取该 Bundle 的所有资源
            const allBundleResources = await apiClient.getResources({ bundle: bundleName, limit: 1000, page: 1 });

            for (const resource of allBundleResources.data) {
                try {
                    await migrateToCos.mutateAsync(resource.id);
                    successCount++;
                } catch (error: any) {
                    console.error(`迁移资源 ${resource.alias} 失败:`, error);
                    failCount++;
                }
            }

            toast({
                title: '迁移完成',
                description: `成功: ${successCount}, 失败: ${failCount}`,
                variant: successCount > 0 && failCount === 0 ? 'default' : 'destructive',
            });
            refetchResources();
            refetchBundles();
        } catch (error: any) {
            toast({
                title: '迁移失败',
                description: error.message || '批量迁移资源失败',
                variant: 'destructive',
            });
        } finally {
            setMigratingBundle(null);
        }
    };

    const handleUpload = (bundle?: string) => {
        setUploadBundle(bundle);
        setUploadDialogOpen(true);
    };

    const handleUploadSuccess = () => {
        refetchResources();
        refetchBundles();
        setUploadDialogOpen(false);
        setUploadBundle(undefined);
        setPage(1); // 重置到第一页
    };

    const handleEditSuccess = () => {
        refetchResources();
        refetchBundles();
        setEditDialogOpen(false);
        setResourceToEdit(null);
    };

    const getBundleTypeLabel = (type: 'common' | 'chapter' | 'mixed') => {
        switch (type) {
            case 'common':
                return '共通资源包';
            case 'chapter':
                return '章节资源包';
            case 'mixed':
                return '混合';
            default:
                return '-';
        }
    };

    const handleEditBundle = (bundleName: string) => {
        const bundle = bundleInfo.find(b => b.name === bundleName);
        if (bundle) {
            // 如果 Bundle 类型是 mixed，默认选择 chapter
            const bundleType = bundle.bundleType === 'mixed' ? 'chapter' : bundle.bundleType;
            setEditingBundle({ name: bundleName, type: bundleType as 'common' | 'chapter' });
            setBundleDialogOpen(true);
        }
    };

    const handleSaveBundle = async (name: string, type: 'common' | 'chapter') => {
        if (editingBundle) {
            // 编辑模式：更新现有 Bundle
            const newBundleName = name !== editingBundle.name ? name : undefined;
            const newBundleType = type !== editingBundle.type ? type : undefined;

            if (!newBundleName && !newBundleType) {
                // 没有变化，直接关闭
                setBundleDialogOpen(false);
                setEditingBundle(null);
                return;
            }

            await updateBundle.mutateAsync({
                bundleName: editingBundle.name,
                newBundleName,
                newBundleType,
            });
        } else {
            // 创建模式：目前不支持创建空 Bundle，提示用户先上传资源
            toast({
                title: '提示',
                description: '请先上传资源到新 Bundle，系统会自动创建 Bundle',
            });
            setBundleDialogOpen(false);
            return;
        }

        setBundleDialogOpen(false);
        setEditingBundle(null);
        refetchResources();
        refetchBundles();
    };

    return (
        <div className='flex flex-col h-full space-y-4'>
            {/* 顶部操作栏 */}
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>资源管理</h1>
                <div className='flex gap-2'>
                    <Button
                        variant='outline'
                        onClick={() => {
                            refetchResources();
                            refetchBundles();
                        }}
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        刷新
                    </Button>
                    <Button onClick={() => handleUpload()}>
                        <Plus className='mr-2 h-4 w-4' />
                        上传资源
                    </Button>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className='flex gap-2'>
                <SearchBar
                    placeholder='搜索资源别名...'
                    value={searchQuery}
                    onChange={value => {
                        setSearchQuery(value);
                        setPage(1); // 搜索时重置到第一页
                        setBundlePage(1); // 搜索时重置 Bundle 分页到第一页
                    }}
                    className='flex-1'
                />
                <Select
                    value={bundleFilter}
                    onValueChange={value => {
                        setBundleFilter(value);
                        setPage(1); // 筛选时重置到第一页
                        setBundlePage(1); // 筛选时重置 Bundle 分页到第一页
                    }}
                >
                    <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder='筛选 Bundle' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>全部</SelectItem>
                        {bundleOptions.map(bundle => (
                            <SelectItem key={bundle} value={bundle}>
                                {bundle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Bundle 表格 */}
            {isLoadingBundles ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : bundleInfo.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-8 text-center'>
                    <p className='text-muted-foreground'>暂无资源</p>
                    <Button onClick={() => handleUpload()} className='mt-4'>
                        <Plus className='mr-2 h-4 w-4' />
                        上传第一个资源
                    </Button>
                </div>
            ) : (
                <>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold'>Bundle 列表</h2>
                    </div>
                    <BundleTable
                        bundles={bundleInfo}
                        selectedBundle={selectedBundle}
                        onSelectBundle={setSelectedBundle}
                        onUpload={handleUpload}
                        onEdit={handleEditBundle}
                        onMigrateToCos={handleMigrateBundleToCos}
                        migratingBundle={migratingBundle}
                        getBundleTypeLabel={getBundleTypeLabel}
                    />
                    {/* Bundle 分页 */}
                    {bundleTotalPages > 1 && (
                        <div className='mt-4'>
                            <Pagination
                                page={bundlePage}
                                totalPages={bundleTotalPages}
                                total={bundleTotal}
                                onPageChange={setBundlePage}
                            />
                        </div>
                    )}

                    {/* 资源卡片列表 */}
                    {selectedBundle && (
                        <div className='border-t pt-4'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold'>
                                    {selectedBundle} 的资源 ({selectedBundleTotal} 个)
                                </h3>
                                <Button variant='outline' size='sm' onClick={() => handleUpload(selectedBundle)}>
                                    <Plus className='mr-2 h-4 w-4' />
                                    上传资源到此 Bundle
                                </Button>
                            </div>
                            {selectedBundleResources.length > 0 ? (
                                <>
                                    <BundleResourceGroup
                                        bundle={selectedBundle}
                                        resources={selectedBundleResources}
                                        onUpload={handleUpload}
                                        onEdit={handleEdit}
                                        onDelete={resource => {
                                            setResourceToDelete(resource);
                                            setDeleteConfirmOpen(true);
                                        }}
                                        onMigrateToCos={handleMigrateToCos}
                                        migratingId={migratingId}
                                    />
                                    {/* 分页 */}
                                    {selectedBundleTotalPages > 1 && (
                                        <div className='mt-4'>
                                            <Pagination
                                                page={page}
                                                totalPages={selectedBundleTotalPages}
                                                total={selectedBundleTotal}
                                                onPageChange={setPage}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='text-center text-muted-foreground py-8'>
                                    <p>该 Bundle 暂无资源</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除资源 "{resourceToDelete?.alias}" 吗？此操作不可恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 上传对话框 */}
            <ResourceUpload
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                bundleOptions={bundleOptions}
                bundleTypeMap={bundleTypeMap}
                defaultBundle={uploadBundle}
                onSuccess={handleUploadSuccess}
            />

            {/* 编辑对话框 */}
            <ResourceUpload
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                bundleOptions={bundleOptions}
                bundleTypeMap={bundleTypeMap}
                defaultBundle={resourceToEdit?.bundle}
                defaultBundleType={resourceToEdit?.bundleType}
                defaultAlias={resourceToEdit?.alias}
                resourceToEdit={resourceToEdit}
                onSuccess={handleEditSuccess}
            />

            {/* Bundle 管理对话框 */}
            <BundleDialog
                open={bundleDialogOpen}
                onOpenChange={setBundleDialogOpen}
                bundleName={editingBundle?.name}
                bundleType={editingBundle?.type}
                onSave={handleSaveBundle}
            />
        </div>
    );
}
