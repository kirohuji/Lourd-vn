import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useMaps } from '@/lib/hooks/use-maps';
import { apiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapConfig } from '@lourd-game/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function ProjectMapsPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = projectId ? Number(projectId) : 0;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [mapToRemove, setMapToRemove] = useState<MapConfig | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 获取项目使用的地图
    const { data: projectMaps, isLoading: isLoadingProjectMaps } = useQuery({
        queryKey: ['project-maps', projectIdNum],
        queryFn: () => apiClient.getProjectMaps(projectIdNum),
        enabled: !!projectIdNum,
    });

    // 获取所有可用地图
    const { data: allMaps, isLoading: isLoadingAllMaps } = useMaps();

    // 过滤出未添加到项目的地图
    const availableMaps = allMaps?.filter(
        map => !projectMaps?.some(pm => pm.id === map.id)
    ) || [];

    const addMapMutation = useMutation({
        mutationFn: (mapId: string) => apiClient.addMapToProject(projectIdNum, mapId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-maps', projectIdNum] });
            queryClient.invalidateQueries({ queryKey: ['maps'] });
            toast({
                title: '成功',
                description: '地图已添加到项目',
            });
            setAddDialogOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: '错误',
                description: error.message || '添加地图失败',
                variant: 'destructive',
            });
        },
    });

    const removeMapMutation = useMutation({
        mutationFn: (mapId: string) => apiClient.removeMapFromProject(projectIdNum, mapId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-maps', projectIdNum] });
            queryClient.invalidateQueries({ queryKey: ['maps'] });
            toast({
                title: '成功',
                description: '地图已从项目移除',
            });
            setRemoveConfirmOpen(false);
            setMapToRemove(null);
        },
        onError: (error: any) => {
            toast({
                title: '错误',
                description: error.message || '移除地图失败',
                variant: 'destructive',
            });
        },
    });

    if (!projectIdNum) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">无效的项目 ID</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">项目地图视图</h1>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加地图
                </Button>
            </div>

            {isLoadingProjectMaps ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>Bundle</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectMaps && projectMaps.length > 0 ? (
                                projectMaps.map((map) => (
                                    <TableRow key={map.id}>
                                        <TableCell className="font-medium">{map.id}</TableCell>
                                        <TableCell>{map.name}</TableCell>
                                        <TableCell>{map.bundle || '-'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setMapToRemove(map);
                                                    setRemoveConfirmOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        暂无地图
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* 添加地图对话框 */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>添加地图到项目</DialogTitle>
                        <DialogDescription>从全局地图池中选择地图添加到当前项目</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        {isLoadingAllMaps ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>名称</TableHead>
                                        <TableHead>Bundle</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableMaps.length > 0 ? (
                                        availableMaps.map((map) => (
                                            <TableRow key={map.id}>
                                                <TableCell className="font-medium">{map.id}</TableCell>
                                                <TableCell>{map.name}</TableCell>
                                                <TableCell>{map.bundle || '-'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addMapMutation.mutate(map.id)}
                                                        disabled={addMapMutation.isPending}
                                                    >
                                                        {addMapMutation.isPending ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Plus className="mr-2 h-4 w-4" />
                                                        )}
                                                        添加
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                所有地图已添加到项目
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 移除确认对话框 */}
            {mapToRemove && (
                <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认移除</DialogTitle>
                            <DialogDescription>
                                确定要从项目中移除地图 "{mapToRemove.name}" 吗？这不会删除地图本身，只是移除项目与地图的关联。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>
                                取消
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => removeMapMutation.mutate(mapToRemove.id)}
                                disabled={removeMapMutation.isPending}
                            >
                                {removeMapMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                确认移除
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

