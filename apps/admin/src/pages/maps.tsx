import { useState } from 'react';
import * as React from 'react';
import { MapConfig, LocationConfig, RoomConfig } from '@lourd-game/shared';
import { useMaps, useUpsertMap, useDeleteMap } from '@/lib/hooks/use-maps';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Plus, Edit, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export function MapsPage() {
    const [maps, setMaps] = useState<MapConfig[]>([]);
    const [locations, setLocations] = useState<LocationConfig[]>([]);
    const [rooms, setRooms] = useState<RoomConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
    const [editMapDialogOpen, setEditMapDialogOpen] = useState(false);
    const [_editLocationDialogOpen, setEditLocationDialogOpen] = useState(false);
    const [_editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);
    const [editMap, setEditMap] = useState<MapConfig | null>(null);
    const [_editLocation, setEditLocation] = useState<LocationConfig | null>(null);
    const [_editRoom, setEditRoom] = useState<RoomConfig | null>(null);

    const { toast } = useToast();
    const { isLoading: mapsLoading } = useMaps();
    const upsertMap = useUpsertMap();
    const deleteMap = useDeleteMap();

    const loadAll = async () => {
        try {
            setLoading(true);
            const [m, l, r] = await Promise.all([
                apiClient.getMaps(),
                apiClient.getLocations(),
                apiClient.getRooms(),
            ]);
            setMaps(m);
            setLocations(l);
            setRooms(r);
        } catch (error: any) {
            toast({
                title: '加载失败',
                description: error.message || '加载地图配置失败',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadAll();
    }, []);

    const generateId = (prefix: string) => {
        if (typeof window !== 'undefined' && (window.crypto as any)?.randomUUID) {
            return `${prefix}_${(window.crypto as any).randomUUID()}`;
        }
        return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    };

    const toggleLocation = (locationId: string) => {
        setExpandedLocations(prev => {
            const next = new Set(prev);
            if (next.has(locationId)) {
                next.delete(locationId);
            } else {
                next.add(locationId);
            }
            return next;
        });
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>地图编辑</h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        这里可以像 `values/maps.tsx`、`values/locations.tsx`、`values/rooms.tsx`
                        一样，编辑地图/地点/房间的基础字段与资源 alias（TimeSlots 背景、图标等）。
                    </p>
                </div>
                <Button variant='outline' onClick={loadAll}>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    刷新
                </Button>
            </div>

            {loading || mapsLoading ? (
                <div className='flex justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : (
                <Tabs defaultValue='maps' className='space-y-4'>
                    <TabsList>
                        <TabsTrigger value='maps'>地图</TabsTrigger>
                        <TabsTrigger value='locations'>地点</TabsTrigger>
                        <TabsTrigger value='rooms'>房间</TabsTrigger>
                    </TabsList>

                    <TabsContent value='maps' className='space-y-4'>
                        <div className='flex justify-end'>
                            <Button onClick={() => {
                                setEditMap({
                                    id: generateId('map'),
                                    name: '',
                                    bundle: '',
                                    backgroundType: 'timeSlots',
                                    backgroundJson: {},
                                } as MapConfig);
                                setEditMapDialogOpen(true);
                            }}>
                                <Plus className='mr-2 h-4 w-4' />
                                新建地图
                            </Button>
                        </div>
                        <div className='rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>名称</TableHead>
                                        <TableHead>背景类型</TableHead>
                                        <TableHead>Bundle</TableHead>
                                        <TableHead className='text-right'>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {maps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                                                暂无地图
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        maps.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell>{m.id}</TableCell>
                                                <TableCell className='font-medium'>{m.name}</TableCell>
                                                <TableCell>{m.backgroundType}</TableCell>
                                                <TableCell>{m.bundle || '-'}</TableCell>
                                                <TableCell className='text-right'>
                                                    <div className='flex justify-end gap-2'>
                                                        <Button variant='ghost' size='icon' onClick={() => {
                                                            setEditMap(m);
                                                            setEditMapDialogOpen(true);
                                                        }}>
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                        <Button variant='ghost' size='icon' onClick={async () => {
                                                            try {
                                                                await deleteMap.mutateAsync(m.id);
                                                                toast({ title: '成功', description: '地图已删除' });
                                                                loadAll();
                                                            } catch (error: any) {
                                                                toast({
                                                                    title: '删除失败',
                                                                    description: error.message,
                                                                    variant: 'destructive',
                                                                });
                                                            }
                                                        }}>
                                                            <Trash2 className='h-4 w-4 text-destructive' />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value='locations' className='space-y-4'>
                        <div className='rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>地图</TableHead>
                                        <TableHead>名称</TableHead>
                                        <TableHead>Icon Alias</TableHead>
                                        <TableHead>排序</TableHead>
                                        <TableHead className='text-right'>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {locations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                                                暂无地点
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        locations.map(loc => {
                                            const map = maps.find(m => m.id === loc.mapId);
                                            return (
                                                <TableRow key={loc.id}>
                                                    <TableCell>{loc.id}</TableCell>
                                                    <TableCell>{map?.name || loc.mapId}</TableCell>
                                                    <TableCell className='font-medium'>{loc.name}</TableCell>
                                                    <TableCell>{loc.iconAlias || '-'}</TableCell>
                                                    <TableCell>{loc.order}</TableCell>
                                                    <TableCell className='text-right'>
                                                        <Button variant='ghost' size='icon' onClick={() => {
                                                            setEditLocation(loc);
                                                            setEditLocationDialogOpen(true);
                                                        }}>
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value='rooms' className='space-y-4'>
                        <div className='space-y-4'>
                            {maps.map(map => {
                                const mapLocations = locations.filter(l => l.mapId === map.id);
                                if (mapLocations.length === 0) return null;

                                return (
                                    <div key={map.id} className='rounded-md border p-4'>
                                        <h3 className='mb-2 font-semibold'>地图: {map.name} ({map.id})</h3>
                                        {mapLocations.map(loc => {
                                            const locRooms = rooms.filter(r => r.locationId === loc.id);
                                            const isExpanded = expandedLocations.has(loc.id);

                                            return (
                                                <div key={loc.id} className='mt-2'>
                                                    <div className='flex items-center gap-2'>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => toggleLocation(loc.id)}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className='h-4 w-4' />
                                                            ) : (
                                                                <ChevronRight className='h-4 w-4' />
                                                            )}
                                                        </Button>
                                                        <span className='font-medium'>
                                                            地点: {loc.name} ({loc.id}) - {locRooms.length} 个房间
                                                        </span>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className='ml-8 mt-2'>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>房间 ID</TableHead>
                                                                        <TableHead>名称</TableHead>
                                                                        <TableHead>入口</TableHead>
                                                                        <TableHead>背景类型</TableHead>
                                                                        <TableHead className='text-right'>操作</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {locRooms.map(room => (
                                                                        <TableRow key={room.id}>
                                                                            <TableCell>{room.id}</TableCell>
                                                                            <TableCell>{room.name}</TableCell>
                                                                            <TableCell>{room.isEntrance ? '是' : '否'}</TableCell>
                                                                            <TableCell>{room.backgroundType}</TableCell>
                                                                            <TableCell className='text-right'>
                                                                                <Button
                                                                                    variant='ghost'
                                                                                    size='icon'
                                                                                    onClick={() => {
                                                                                        setEditRoom(room);
                                                                                        setEditRoomDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Edit className='h-4 w-4' />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* 地图编辑对话框 - 简化版，实际应该更复杂 */}
            <Dialog open={editMapDialogOpen} onOpenChange={setEditMapDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editMap?.id ? '编辑地图' : '新建地图'}</DialogTitle>
                        <DialogDescription>
                            {editMap?.id ? '修改地图配置信息' : '创建新的地图配置'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label>ID</Label>
                            <Input value={editMap?.id || ''} disabled />
                        </div>
                        <div className='space-y-2'>
                            <Label>名称</Label>
                            <Input
                                value={editMap?.name || ''}
                                onChange={e => setEditMap(prev => prev ? { ...prev, name: e.target.value } : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditMapDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={async () => {
                            if (!editMap) return;
                            try {
                                await upsertMap.mutateAsync({
                                    id: editMap.id,
                                    dto: {
                                        name: editMap.name,
                                        bundle: editMap.bundle || '',
                                        backgroundType: editMap.backgroundType || 'timeSlots',
                                        backgroundJson: editMap.backgroundJson || {},
                                    },
                                });
                                toast({ title: '成功', description: '地图已保存' });
                                setEditMapDialogOpen(false);
                                loadAll();
                            } catch (error: any) {
                                toast({
                                    title: '保存失败',
                                    description: error.message,
                                    variant: 'destructive',
                                });
                            }
                        }}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

