import { ResourceUpload } from '@/components/features/resource-upload';
import { SearchBar } from '@/components/features/search-bar';
import { BundleResourceGroup } from '@/components/features/bundle-resource-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useAllResources,
  useDeleteResource,
  useMigrateResourceToCos,
  useUpdateResource,
} from '@/lib/hooks/use-resources';
import { ResourceResponseDto, UpdateResourceDto } from '@lourd-game/shared';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

export function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [bundleFilter, setBundleFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceResponseDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<ResourceResponseDto | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [editBundle, setEditBundle] = useState('');
  const [editBundleType, setEditBundleType] = useState<string>('chapter');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadBundle, setUploadBundle] = useState<string | undefined>(undefined);
  const [migratingId, setMigratingId] = useState<number | null>(null);

  const { toast } = useToast();
  const { data, isLoading, refetch } = useAllResources({
    bundle: bundleFilter === 'all' ? undefined : bundleFilter,
    search: searchQuery || undefined,
  });
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const migrateToCos = useMigrateResourceToCos();

  const resources = data?.data || [];

  // 按 Bundle 分组
  const groupedResources = useMemo(() => {
    const groups = new Map<string, ResourceResponseDto[]>();
    resources.forEach(resource => {
      const bundle = resource.bundle || '未分类';
      if (!groups.has(bundle)) {
        groups.set(bundle, []);
      }
      groups.get(bundle)!.push(resource);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [resources]);

  // 获取所有 Bundle 选项
  const bundleOptions = useMemo(() => {
    const set = new Set<string>();
    resources.forEach(r => {
      if (r.bundle) set.add(r.bundle);
    });
    return Array.from(set).sort();
  }, [resources]);

  const handleEdit = (resource: ResourceResponseDto) => {
    setResourceToEdit(resource);
    setEditAlias(resource.alias);
    setEditBundle(resource.bundle || '');
    setEditBundleType(resource.bundleType || 'chapter');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!resourceToEdit || !editAlias.trim()) {
      toast({
        title: '错误',
        description: '请输入别名',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dto: UpdateResourceDto = {
        alias: editAlias.trim(),
        bundle: editBundle.trim() || undefined,
        bundleType: editBundleType,
      };
      await updateResource.mutateAsync({ id: resourceToEdit.id, dto });
      toast({
        title: '成功',
        description: '资源更新成功',
      });
      setEditDialogOpen(false);
      setResourceToEdit(null);
      refetch();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新资源失败',
        variant: 'destructive',
      });
    }
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
      refetch();
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
      refetch();
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

  const handleUpload = (bundle?: string) => {
    setUploadBundle(bundle);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    refetch();
    setUploadDialogOpen(false);
    setUploadBundle(undefined);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>资源管理</h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            刷新
          </Button>
          <Button onClick={() => handleUpload()}>
            <Plus className='mr-2 h-4 w-4' />
            上传资源
          </Button>
        </div>
      </div>

      <div className='flex gap-2'>
        <SearchBar
          placeholder='搜索资源别名...'
          value={searchQuery}
          onChange={setSearchQuery}
          className='flex-1'
        />
        <Select
          value={bundleFilter}
          onValueChange={value => {
            setBundleFilter(value);
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

      {isLoading ? (
        <div className='flex justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : groupedResources.length === 0 ? (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <p className='text-muted-foreground'>暂无资源</p>
          <Button onClick={() => handleUpload()} className='mt-4'>
            <Plus className='mr-2 h-4 w-4' />
            上传第一个资源
          </Button>
        </div>
      ) : (
        <Accordion type='multiple' className='w-full' defaultValue={groupedResources.map(([bundle]) => bundle)}>
          {groupedResources.map(([bundle, bundleResources]) => (
            <AccordionItem key={bundle} value={bundle}>
              <AccordionTrigger className='hover:no-underline'>
                <div className='flex items-center justify-between w-full pr-4'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{bundle}</span>
                    <span className='text-sm text-muted-foreground'>({bundleResources.length} 个资源)</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <BundleResourceGroup
                  bundle={bundle}
                  resources={bundleResources}
                  onUpload={handleUpload}
                  onEdit={handleEdit}
                  onDelete={resource => {
                    setResourceToDelete(resource);
                    setDeleteConfirmOpen(true);
                  }}
                  onMigrateToCos={handleMigrateToCos}
                  migratingId={migratingId}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑资源</DialogTitle>
            <DialogDescription>修改资源信息</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-alias'>别名 *</Label>
              <Input id='edit-alias' value={editAlias} onChange={e => setEditAlias(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-bundle'>Bundle</Label>
              <Input id='edit-bundle' value={editBundle} onChange={e => setEditBundle(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-bundle-type'>资源包类型</Label>
              <Select value={editBundleType} onValueChange={setEditBundleType}>
                <SelectTrigger>
                  <SelectValue placeholder='选择资源包类型' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='common'>共通资源包</SelectItem>
                  <SelectItem value='chapter'>章节资源包</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateResource.isPending}>
              {updateResource.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResourceUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        bundleOptions={bundleOptions}
        defaultBundle={uploadBundle}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
