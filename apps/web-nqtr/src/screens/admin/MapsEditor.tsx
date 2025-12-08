import { LocationConfig, MapConfig, RoomConfig } from '@lourd-game/shared';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Sheet,
    Switch,
    Table,
    Typography,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useResourcesStore } from '../../stores/resources-store';
import { apiClient } from '../../utils/api-client';

export default function MapsEditor() {
    const { enqueueSnackbar } = useSnackbar();
    const [maps, setMaps] = useState<MapConfig[]>([]);
    const [locations, setLocations] = useState<LocationConfig[]>([]);
    const [rooms, setRooms] = useState<RoomConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

    // 使用资源 store
    const { loadAllResources, findResourceByAlias, getImageResources, getBundleOptions } = useResourcesStore();

    // map 编辑
    const [editMap, setEditMap] = useState<MapConfig | null>(null);
    const [mapId, setMapId] = useState('');
    const [mapName, setMapName] = useState('');
    const [mapBundle, setMapBundle] = useState('');
    const [mapBgType, setMapBgType] = useState<'timeSlots' | 'single'>('timeSlots');
    const [mapMorning, setMapMorning] = useState('');
    const [mapAfternoon, setMapAfternoon] = useState('');
    const [mapEvening, setMapEvening] = useState('');
    const [mapNight, setMapNight] = useState('');
    const [mapSingleSrc, setMapSingleSrc] = useState('');

    // location 编辑
    const [editLocation, setEditLocation] = useState<LocationConfig | null>(null);
    const [locId, setLocId] = useState('');
    const [locName, setLocName] = useState('');
    const [locIconAlias, setLocIconAlias] = useState('');
    const [locOrder, setLocOrder] = useState('0');

    // room 编辑
    const [editRoom, setEditRoom] = useState<RoomConfig | null>(null);
    const [roomId, setRoomId] = useState('');
    const [roomName, setRoomName] = useState('');
    const [roomIsEntrance, setRoomIsEntrance] = useState(false);
    const [roomBgType, setRoomBgType] = useState<'timeSlots' | 'single'>('timeSlots');
    const [roomMorning, setRoomMorning] = useState('');
    const [roomAfternoon, setRoomAfternoon] = useState('');
    const [roomEvening, setRoomEvening] = useState('');
    const [roomNight, setRoomNight] = useState('');
    const [roomSingleSrc, setRoomSingleSrc] = useState('');

    // 通用资源选择对话框
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [resourceDialogTitle, setResourceDialogTitle] = useState('');
    const [resourceDialogSearch, setResourceDialogSearch] = useState('');
    const [resourceDialogBundle, setResourceDialogBundle] = useState<string | null>(null);
    const [resourceDialogOnSelect, setResourceDialogOnSelect] = useState<((alias: string) => void) | null>(null);

    const loadAll = async () => {
        try {
            setLoading(true);
            // 先加载所有资源到 store
            await loadAllResources();
            // 然后加载地图配置
            const [m, l, r] = await Promise.all([apiClient.getMaps(), apiClient.getLocations(), apiClient.getRooms()]);
            setMaps(m);
            setLocations(l);
            setRooms(r);
        } catch (e: any) {
            console.error(e);
            enqueueSnackbar(`加载地图配置失败: ${e.message || e}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAll();
    }, []);

    const generateId = (prefix: string) => {
        if (typeof window !== 'undefined' && (window.crypto as any)?.randomUUID) {
            return `${prefix}_${(window.crypto as any).randomUUID()}`;
        }
        return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    };

    // 只在本地对「可用作图片」的资源做过滤展示（底层数据从 store 来）
    const imageResources = getImageResources();

    const filteredResources = imageResources.filter(res => {
        if (resourceDialogBundle && res.bundle !== resourceDialogBundle) {
            return false;
        }
        if (!resourceDialogSearch) {
            return true;
        }
        const q = resourceDialogSearch.toLowerCase();
        return (
            res.alias.toLowerCase().includes(q) ||
            (res.originalName?.toLowerCase().includes(q) ?? false) ||
            (res.bundle?.toLowerCase().includes(q) ?? false)
        );
    });

    const openResourceDialog = (title: string, initialAlias: string, onSelect: (alias: string) => void) => {
        setResourceDialogTitle(title);
        setResourceDialogSearch(initialAlias || '');
        setResourceDialogBundle(null);
        setResourceDialogOnSelect(() => onSelect);
        setResourceDialogOpen(true);
    };

    // ---- Map 编辑 ----
    const openEditMap = (map?: MapConfig) => {
        const m =
            map ||
            ({
                id: generateId('map'),
                name: '',
                bundle: '',
                backgroundType: 'timeSlots',
                backgroundJson: {},
            } as MapConfig);
        setEditMap(m);
        setMapId(m.id || '');
        setMapName(m.name);
        setMapBundle(m.bundle || '');
        const bgType = (m.backgroundType as 'timeSlots' | 'single') || 'timeSlots';
        setMapBgType(bgType);
        if (bgType === 'timeSlots') {
            setMapMorning(m.backgroundJson?.morning || '');
            setMapAfternoon(m.backgroundJson?.afternoon || '');
            setMapEvening(m.backgroundJson?.evening || '');
            setMapNight(m.backgroundJson?.night || '');
            setMapSingleSrc('');
        } else {
            setMapSingleSrc(m.backgroundJson?.src || '');
            setMapMorning('');
            setMapAfternoon('');
            setMapEvening('');
            setMapNight('');
        }
    };

    const saveMap = async () => {
        if (!editMap) return;
        const targetId = (editMap.id || mapId).trim();
        if (!targetId) {
            enqueueSnackbar('请先填写地图 ID', { variant: 'warning' });
            return;
        }
        try {
            const backgroundJson =
                mapBgType === 'timeSlots'
                    ? {
                          morning: mapMorning,
                          afternoon: mapAfternoon,
                          evening: mapEvening,
                          night: mapNight,
                      }
                    : {
                          src: mapSingleSrc,
                      };

            await apiClient.upsertMap(targetId, {
                name: mapName,
                bundle: mapBundle || null,
                backgroundType: mapBgType,
                backgroundJson,
            });
            enqueueSnackbar('地图已保存', { variant: 'success' });
            setEditMap(null);
            void loadAll();
        } catch (e: any) {
            enqueueSnackbar(`保存失败: ${e.message || e}`, { variant: 'error' });
        }
    };

    // ---- Location 编辑 ----
    const openEditLocation = (loc: LocationConfig) => {
        setEditLocation(loc);
        setLocId(loc.id || '');
        setLocName(loc.name);
        setLocIconAlias(loc.iconAlias || '');
        setLocOrder(String(loc.order ?? 0));
    };

    const openCreateLocation = (map: MapConfig) => {
        const newId = generateId('loc');
        const loc = {
            id: newId,
            mapId: map.id,
            name: '',
            iconAlias: null,
            order: 0,
        } as LocationConfig;
        setEditLocation(loc);
        setLocId(newId);
        setLocName('');
        setLocIconAlias('');
        setLocOrder('0');
    };

    const saveLocation = async () => {
        if (!editLocation) return;
        const targetId = (editLocation.id || locId).trim();
        if (!targetId) {
            enqueueSnackbar('请先填写地点 ID', { variant: 'warning' });
            return;
        }
        try {
            await apiClient.upsertLocation(targetId, {
                mapId: editLocation.mapId,
                name: locName,
                iconAlias: locIconAlias || null,
                order: Number(locOrder) || 0,
            });
            enqueueSnackbar('地点已保存', { variant: 'success' });
            setEditLocation(null);
            void loadAll();
        } catch (e: any) {
            enqueueSnackbar(`保存地点失败: ${e.message || e}`, { variant: 'error' });
        }
    };

    // ---- Room 编辑 ----
    const openEditRoom = (room: RoomConfig) => {
        setEditRoom(room);
        setRoomId(room.id || '');
        setRoomName(room.name);
        setRoomIsEntrance(!!room.isEntrance);
        const bgType = (room.backgroundType as 'timeSlots' | 'single') || 'timeSlots';
        setRoomBgType(bgType);
        if (bgType === 'timeSlots') {
            setRoomMorning(room.backgroundJson?.morning || '');
            setRoomAfternoon(room.backgroundJson?.afternoon || '');
            setRoomEvening(room.backgroundJson?.evening || '');
            setRoomNight(room.backgroundJson?.night || '');
            setRoomSingleSrc('');
        } else {
            setRoomSingleSrc(room.backgroundJson?.src || '');
            setRoomMorning('');
            setRoomAfternoon('');
            setRoomEvening('');
            setRoomNight('');
        }
    };

    const openCreateRoom = (loc: LocationConfig) => {
        const newId = generateId('room');
        const room = {
            id: newId,
            mapId: undefined,
            locationId: loc.id,
            name: '',
            isEntrance: false,
            backgroundType: 'timeSlots',
            backgroundJson: {},
            hotspotsJson: [],
        } as RoomConfig;
        setEditRoom(room);
        setRoomId('');
        setRoomName('');
        setRoomIsEntrance(false);
        setRoomBgType('timeSlots');
        setRoomMorning('');
        setRoomAfternoon('');
        setRoomEvening('');
        setRoomNight('');
        setRoomSingleSrc('');
    };

    const saveRoom = async () => {
        if (!editRoom) return;
        const targetId = (editRoom.id || roomId).trim();
        if (!targetId) {
            enqueueSnackbar('请先填写房间 ID', { variant: 'warning' });
            return;
        }
        try {
            const backgroundJson =
                roomBgType === 'timeSlots'
                    ? {
                          morning: roomMorning,
                          afternoon: roomAfternoon,
                          evening: roomEvening,
                          night: roomNight,
                      }
                    : {
                          src: roomSingleSrc,
                      };

            await apiClient.upsertRoom(targetId, {
                mapId: editRoom.mapId || null,
                locationId: editRoom.locationId,
                name: roomName,
                isEntrance: roomIsEntrance,
                backgroundType: roomBgType,
                backgroundJson,
                hotspotsJson: editRoom.hotspotsJson || [],
            });
            enqueueSnackbar('房间已保存', { variant: 'success' });
            setEditRoom(null);
            void loadAll();
        } catch (e: any) {
            enqueueSnackbar(`保存房间失败: ${e.message || e}`, { variant: 'error' });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography level='h3'>地图编辑（按照 values 结构）</Typography>
            <Typography level='body-sm' color='neutral'>
                这里可以像 `values/maps.tsx`、`values/locations.tsx`、`values/rooms.tsx`
                一样，编辑地图/地点/房间的基础字段与资源 alias（TimeSlots 背景、图标等）。
            </Typography>

            {/* 地图列表 */}
            <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level='title-lg'>地图列表</Typography>
                    <Button size='sm' variant='soft' onClick={() => openEditMap()}>
                        新建地图
                    </Button>
                </Box>
                <Table size='sm'>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>名称</th>
                            <th>背景类型</th>
                            <th>Bundle</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maps.map(m => (
                            <tr key={m.id}>
                                <td>{m.id}</td>
                                <td>{m.name}</td>
                                <td>{m.backgroundType}</td>
                                <td>{m.bundle || '-'}</td>
                                <td>
                                    <Button size='sm' variant='outlined' onClick={() => openEditMap(m)}>
                                        编辑
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>

            {/* 地点 / 房间列表 */}
            <Sheet variant='outlined' sx={{ p: 2, borderRadius: 'sm' }}>
                <Typography level='title-lg' sx={{ mb: 1 }}>
                    地点 / 房间
                </Typography>
                {maps.map(map => (
                    <Box key={map.id} sx={{ mb: 3 }}>
                        <Typography level='title-md'>
                            地图: {map.name} ({map.id})
                        </Typography>
                        <Table size='sm' sx={{ mt: 1 }}>
                            <thead>
                                <tr>
                                    <th>地点 ID</th>
                                    <th>名称</th>
                                    <th>Icon Alias</th>
                                    <th>房间数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations
                                    .filter(l => l.mapId === map.id)
                                    .map(loc => {
                                        const roomCount = rooms.filter(r => r.locationId === loc.id).length;
                                        const isExpanded = expandedLocations.has(loc.id);
                                        return (
                                            <tr key={loc.id}>
                                                <td>
                                                    <Button
                                                        size='sm'
                                                        variant='plain'
                                                        onClick={() => {
                                                            setExpandedLocations(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(loc.id)) {
                                                                    next.delete(loc.id);
                                                                } else {
                                                                    next.add(loc.id);
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        sx={{ minWidth: 0, mr: 1 }}
                                                    >
                                                        {isExpanded ? '▼' : '▶'}
                                                    </Button>
                                                    {loc.id}
                                                </td>
                                                <td>{loc.name}</td>
                                                <td>{loc.iconAlias || '-'}</td>
                                                <td>{roomCount}</td>
                                                <td>
                                                    <Button
                                                        size='sm'
                                                        variant='outlined'
                                                        onClick={() => openEditLocation(loc)}
                                                    >
                                                        编辑
                                                    </Button>
                                                    <Button
                                                        size='sm'
                                                        variant='soft'
                                                        sx={{ ml: 1 }}
                                                        onClick={() => openCreateLocation(map)}
                                                    >
                                                        新增
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </Table>

                        {/* 每个地点下的房间表（折叠） */}
                        {locations
                            .filter(l => l.mapId === map.id)
                            .map(loc => {
                                const isExpanded = expandedLocations.has(loc.id);
                                if (!isExpanded) return null;
                                const locRooms = rooms.filter(r => r.locationId === loc.id);
                                return (
                                    <Box key={`${map.id}-${loc.id}`} sx={{ mt: 1, ml: 2 }}>
                                        <Typography level='body-sm'>
                                            地点 {loc.name} ({loc.id}) 的房间：
                                        </Typography>
                                        <Table size='sm' sx={{ mt: 0.5 }}>
                                            <thead>
                                                <tr>
                                                    <th>房间 ID</th>
                                                    <th>名称</th>
                                                    <th>入口</th>
                                                    <th>背景类型</th>
                                                    <th>操作</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {locRooms.map(room => (
                                                    <tr key={room.id}>
                                                        <td>{room.id}</td>
                                                        <td>{room.name}</td>
                                                        <td>{room.isEntrance ? '是' : ''}</td>
                                                        <td>{room.backgroundType}</td>
                                                        <td>
                                                            <Button
                                                                size='sm'
                                                                variant='outlined'
                                                                onClick={() => openEditRoom(room)}
                                                            >
                                                                编辑
                                                            </Button>
                                                            <Button
                                                                size='sm'
                                                                variant='soft'
                                                                sx={{ ml: 1 }}
                                                                onClick={() => openCreateRoom(loc)}
                                                            >
                                                                新增
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Box>
                                );
                            })}
                    </Box>
                ))}
            </Sheet>

            {/* 编辑地图对话框 */}
            <Modal open={!!editMap} onClose={() => setEditMap(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        编辑地图
                    </Typography>
                    {editMap && (
                        <>
                            {editMap.id ? (
                                <Typography level='body-sm' sx={{ mb: 1 }}>
                                    ID: {editMap.id}
                                </Typography>
                            ) : (
                                <FormControl sx={{ mb: 1 }}>
                                    <FormLabel>地图 ID</FormLabel>
                                    <Input value={mapId} onChange={e => setMapId(e.target.value)} />
                                </FormControl>
                            )}
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>名称</FormLabel>
                                <Input value={mapName} onChange={e => setMapName(e.target.value)} />
                            </FormControl>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>Bundle（可选）</FormLabel>
                                <Input value={mapBundle} onChange={e => setMapBundle(e.target.value)} />
                            </FormControl>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>背景类型</FormLabel>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Button
                                        size='sm'
                                        variant={mapBgType === 'timeSlots' ? 'solid' : 'outlined'}
                                        onClick={() => setMapBgType('timeSlots')}
                                    >
                                        timeSlots
                                    </Button>
                                    <Button
                                        size='sm'
                                        variant={mapBgType === 'single' ? 'solid' : 'outlined'}
                                        onClick={() => setMapBgType('single')}
                                    >
                                        single
                                    </Button>
                                </Box>
                            </FormControl>
                            <Sheet variant='soft' sx={{ p: 1.5, borderRadius: 'sm', mt: 1 }}>
                                {mapBgType === 'timeSlots' ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                        <FormControl>
                                            <FormLabel>morning</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input size='sm' value={mapMorning} readOnly placeholder='请选择资源' />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog('选择 morning 背景资源', mapMorning, alias =>
                                                            setMapMorning(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(mapMorning) && (
                                                <img
                                                    src={findResourceByAlias(mapMorning)!.src}
                                                    alt={mapMorning}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>afternoon</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input
                                                    size='sm'
                                                    value={mapAfternoon}
                                                    readOnly
                                                    placeholder='请选择资源'
                                                />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog(
                                                            '选择 afternoon 背景资源',
                                                            mapAfternoon,
                                                            alias => setMapAfternoon(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(mapAfternoon) && (
                                                <img
                                                    src={findResourceByAlias(mapAfternoon)!.src}
                                                    alt={mapAfternoon}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>evening</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input size='sm' value={mapEvening} readOnly placeholder='请选择资源' />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog('选择 evening 背景资源', mapEvening, alias =>
                                                            setMapEvening(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(mapEvening) && (
                                                <img
                                                    src={findResourceByAlias(mapEvening)!.src}
                                                    alt={mapEvening}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>night</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input size='sm' value={mapNight} readOnly placeholder='请选择资源' />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog('选择 night 背景资源', mapNight, alias =>
                                                            setMapNight(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(mapNight) && (
                                                <img
                                                    src={findResourceByAlias(mapNight)!.src}
                                                    alt={mapNight}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                    </Box>
                                ) : (
                                    <FormControl>
                                        <FormLabel>单图背景资源</FormLabel>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                            <Input size='sm' value={mapSingleSrc} readOnly placeholder='请选择资源' />
                                            <Button
                                                size='sm'
                                                variant='outlined'
                                                onClick={() =>
                                                    openResourceDialog('选择单图背景资源', mapSingleSrc, alias =>
                                                        setMapSingleSrc(alias),
                                                    )
                                                }
                                            >
                                                选择
                                            </Button>
                                        </Box>
                                        {findResourceByAlias(mapSingleSrc) && (
                                            <img
                                                src={findResourceByAlias(mapSingleSrc)!.src}
                                                alt={mapSingleSrc}
                                                style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4 }}
                                            />
                                        )}
                                    </FormControl>
                                )}
                            </Sheet>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button variant='outlined' onClick={() => setEditMap(null)}>
                                    取消
                                </Button>
                                <Button variant='solid' onClick={saveMap} loading={loading}>
                                    保存
                                </Button>
                            </Box>
                        </>
                    )}
                </ModalDialog>
            </Modal>

            {/* 编辑地点对话框 */}
            <Modal open={!!editLocation} onClose={() => setEditLocation(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        编辑地点
                    </Typography>
                    {editLocation && (
                        <>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>地点 ID（自动生成，可修改）</FormLabel>
                                <Input
                                    value={locId || editLocation.id}
                                    onChange={e => setLocId(e.target.value)}
                                    placeholder='例如 mc_home / gym / school'
                                />
                            </FormControl>
                            <Typography level='body-xs' sx={{ mb: 1 }}>
                                地图: {editLocation.mapId}
                            </Typography>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>名称</FormLabel>
                                <Input value={locName} onChange={e => setLocName(e.target.value)} />
                            </FormControl>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>Icon 资源（来自 /manifest）</FormLabel>
                                <Sheet variant='soft' sx={{ p: 1.5, borderRadius: 'sm' }}>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                        <Input size='sm' value={locIconAlias} readOnly placeholder='请选择资源' />
                                        <Button
                                            size='sm'
                                            variant='outlined'
                                            onClick={() =>
                                                openResourceDialog('选择地点图标资源', locIconAlias, alias =>
                                                    setLocIconAlias(alias),
                                                )
                                            }
                                        >
                                            选择
                                        </Button>
                                    </Box>
                                    {findResourceByAlias(locIconAlias) && (
                                        <img
                                            src={findResourceByAlias(locIconAlias)!.src}
                                            alt={locIconAlias}
                                            style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                        />
                                    )}
                                </Sheet>
                            </FormControl>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>排序（数字越小越靠前）</FormLabel>
                                <Input value={locOrder} onChange={e => setLocOrder(e.target.value)} type='number' />
                            </FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button variant='outlined' onClick={() => setEditLocation(null)}>
                                    取消
                                </Button>
                                <Button variant='solid' onClick={saveLocation} loading={loading}>
                                    保存
                                </Button>
                            </Box>
                        </>
                    )}
                </ModalDialog>
            </Modal>

            {/* 编辑房间对话框 */}
            <Modal open={!!editRoom} onClose={() => setEditRoom(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        编辑房间
                    </Typography>
                    {editRoom && (
                        <>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>房间 ID（自动生成，可修改）</FormLabel>
                                <Input
                                    value={roomId || editRoom.id}
                                    onChange={e => setRoomId(e.target.value)}
                                    placeholder='例如 mc_room / lounge / gym_room'
                                />
                            </FormControl>
                            <Typography level='body-xs' sx={{ mb: 1 }}>
                                地点: {editRoom.locationId}
                            </Typography>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>名称</FormLabel>
                                <Input value={roomName} onChange={e => setRoomName(e.target.value)} />
                            </FormControl>
                            <FormControl
                                sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <FormLabel>是否入口房间（对应 values/rooms.tsx 里的 isEntrance）</FormLabel>
                                <Switch checked={roomIsEntrance} onChange={e => setRoomIsEntrance(e.target.checked)} />
                            </FormControl>
                            <FormControl sx={{ mb: 1 }}>
                                <FormLabel>背景类型</FormLabel>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Button
                                        size='sm'
                                        variant={roomBgType === 'timeSlots' ? 'solid' : 'outlined'}
                                        onClick={() => setRoomBgType('timeSlots')}
                                    >
                                        timeSlots
                                    </Button>
                                    <Button
                                        size='sm'
                                        variant={roomBgType === 'single' ? 'solid' : 'outlined'}
                                        onClick={() => setRoomBgType('single')}
                                    >
                                        single
                                    </Button>
                                </Box>
                            </FormControl>
                            <Sheet variant='soft' sx={{ p: 1.5, borderRadius: 'sm', mt: 1 }}>
                                {roomBgType === 'timeSlots' ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                        <FormControl>
                                            <FormLabel>morning</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input
                                                    size='sm'
                                                    value={roomMorning}
                                                    readOnly
                                                    placeholder='请选择资源'
                                                />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog(
                                                            '选择 morning 背景资源',
                                                            roomMorning,
                                                            alias => setRoomMorning(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(roomMorning) && (
                                                <img
                                                    src={findResourceByAlias(roomMorning)!.src}
                                                    alt={roomMorning}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>afternoon</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input
                                                    size='sm'
                                                    value={roomAfternoon}
                                                    readOnly
                                                    placeholder='请选择资源'
                                                />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog(
                                                            '选择 afternoon 背景资源',
                                                            roomAfternoon,
                                                            alias => setRoomAfternoon(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(roomAfternoon) && (
                                                <img
                                                    src={findResourceByAlias(roomAfternoon)!.src}
                                                    alt={roomAfternoon}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>evening</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input
                                                    size='sm'
                                                    value={roomEvening}
                                                    readOnly
                                                    placeholder='请选择资源'
                                                />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog(
                                                            '选择 evening 背景资源',
                                                            roomEvening,
                                                            alias => setRoomEvening(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(roomEvening) && (
                                                <img
                                                    src={findResourceByAlias(roomEvening)!.src}
                                                    alt={roomEvening}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>night</FormLabel>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                <Input size='sm' value={roomNight} readOnly placeholder='请选择资源' />
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() =>
                                                        openResourceDialog('选择 night 背景资源', roomNight, alias =>
                                                            setRoomNight(alias),
                                                        )
                                                    }
                                                >
                                                    选择
                                                </Button>
                                            </Box>
                                            {findResourceByAlias(roomNight) && (
                                                <img
                                                    src={findResourceByAlias(roomNight)!.src}
                                                    alt={roomNight}
                                                    style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
                                                />
                                            )}
                                        </FormControl>
                                    </Box>
                                ) : (
                                    <FormControl>
                                        <FormLabel>单图背景资源</FormLabel>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                            <Input size='sm' value={roomSingleSrc} readOnly placeholder='请选择资源' />
                                            <Button
                                                size='sm'
                                                variant='outlined'
                                                onClick={() =>
                                                    openResourceDialog('选择单图背景资源', roomSingleSrc, alias =>
                                                        setRoomSingleSrc(alias),
                                                    )
                                                }
                                            >
                                                选择
                                            </Button>
                                        </Box>
                                        {findResourceByAlias(roomSingleSrc) && (
                                            <img
                                                src={findResourceByAlias(roomSingleSrc)!.src}
                                                alt={roomSingleSrc}
                                                style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4 }}
                                            />
                                        )}
                                    </FormControl>
                                )}
                            </Sheet>
                            <Typography level='body-xs' color='neutral' sx={{ mt: 1, mb: 1 }}>
                                Hotspots（门、箭头等）目前在此只读显示，不在该版本中直接编辑。
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button variant='outlined' onClick={() => setEditRoom(null)}>
                                    取消
                                </Button>
                                <Button variant='solid' onClick={saveRoom} loading={loading}>
                                    保存
                                </Button>
                            </Box>
                        </>
                    )}
                </ModalDialog>
            </Modal>

            {/* 通用资源选择对话框 */}
            <Modal open={resourceDialogOpen} onClose={() => setResourceDialogOpen(false)}>
                <ModalDialog sx={{ maxWidth: 900, width: '90vw' }}>
                    <ModalClose />
                    <Typography level='h4' sx={{ mb: 2 }}>
                        {resourceDialogTitle || '选择资源'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ flex: 1 }}>
                            <FormLabel>搜索</FormLabel>
                            <Input
                                size='sm'
                                value={resourceDialogSearch}
                                onChange={e => setResourceDialogSearch(e.target.value)}
                                placeholder='按 alias / 文件名 / bundle 搜索'
                            />
                        </FormControl>
                        <FormControl sx={{ minWidth: 200 }}>
                            <FormLabel>Bundle 过滤</FormLabel>
                            <Select
                                size='sm'
                                value={resourceDialogBundle || ''}
                                onChange={(_, value) => setResourceDialogBundle(value || null)}
                            >
                                <Option value=''>全部</Option>
                                {getBundleOptions().map((b: string) => (
                                    <Option key={b} value={b}>
                                        {b}
                                    </Option>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Sheet
                        variant='outlined'
                        sx={{
                            maxHeight: 400,
                            overflow: 'auto',
                            borderRadius: 'sm',
                        }}
                    >
                        <Table size='sm' stickyHeader>
                            <thead>
                                <tr>
                                    <th>Alias</th>
                                    <th>Bundle</th>
                                    <th>文件名</th>
                                    <th>类型</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <Typography level='body-sm' sx={{ py: 1, textAlign: 'center' }}>
                                                没有匹配的资源
                                            </Typography>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResources.map(res => (
                                        <tr key={res.id}>
                                            <td>{res.alias}</td>
                                            <td>{res.bundle || '-'}</td>
                                            <td>{res.originalName || '-'}</td>
                                            <td>{res.fileType || '-'}</td>
                                            <td>
                                                <Button
                                                    size='sm'
                                                    variant='outlined'
                                                    onClick={() => {
                                                        if (resourceDialogOnSelect) {
                                                            resourceDialogOnSelect(res.alias);
                                                        }
                                                        setResourceDialogOpen(false);
                                                    }}
                                                >
                                                    选择
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Sheet>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
