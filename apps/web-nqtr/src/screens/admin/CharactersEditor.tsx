import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Sheet,
    Typography,
    Table,
    Input,
    Modal,
    ModalDialog,
    ModalClose,
    FormControl,
    FormLabel,
    Switch,
} from '@mui/joy';
import { useSnackbar } from 'notistack';
import { CharacterConfig } from '@lourd-game/shared';
import { apiClient } from '../../utils/api-client';

export default function CharactersEditor() {
    const { enqueueSnackbar } = useSnackbar();
    const [characters, setCharacters] = useState<CharacterConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [editChar, setEditChar] = useState<CharacterConfig | null>(null);
    const [name, setName] = useState('');
    const [age, setAge] = useState<string>('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [order, setOrder] = useState<string>('0');

    const loadCharacters = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getCharacters();
            setCharacters(res.data);
        } catch (e: any) {
            console.error(e);
            enqueueSnackbar(`加载角色失败: ${e.message || e}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCharacters();
    }, []);

    const openEdit = (c?: CharacterConfig) => {
        const char =
            c ||
            ({
                id: '',
                name: '',
                enabled: true,
                order: 0,
            } as CharacterConfig);
        setEditChar(char);
        setName(char.name);
        setAge(char.age != null ? String(char.age) : '');
        setIcon(char.icon || '');
        setColor(char.color || '');
        setEnabled(char.enabled);
        setOrder(String(char.order ?? 0));
    };

    const save = async () => {
        if (!editChar) return;
        if (!editChar.id) {
            enqueueSnackbar('当前简化版暂不支持新建 ID，请先在后端 seed 或数据库中创建 ID', {
                variant: 'warning',
            });
            return;
        }
        try {
            const dto: any = {
                name,
                age: age ? Number(age) : null,
                icon: icon || null,
                color: color || null,
                enabled,
                order: order ? Number(order) : 0,
            };
            await apiClient.upsertCharacter(editChar.id, dto);
            enqueueSnackbar('角色已保存', { variant: 'success' });
            setEditChar(null);
            void loadCharacters();
        } catch (e: any) {
            enqueueSnackbar(`保存失败: ${e.message || e}`, { variant: 'error' });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography level="h3">角色编辑（卡片列表）</Typography>
            <Typography level="body-sm" color="neutral">
                这里可以查看和编辑角色的名称、头像、颜色、排序等基础信息。当前版本同样要求 ID 由后端或数据库预先创建。
            </Typography>

            <Sheet variant="outlined" sx={{ p: 2, borderRadius: 'sm' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="title-lg">角色列表</Typography>
                    <Button size="sm" onClick={() => openEdit()}>
                        编辑/新建角色
                    </Button>
                </Box>
                <Table size="sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>名称</th>
                            <th>年龄</th>
                            <th>启用</th>
                            <th>排序</th>
                            <th>颜色</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {characters.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.name}</td>
                                <td>{c.age ?? '-'}</td>
                                <td>{c.enabled ? '是' : '否'}</td>
                                <td>{c.order}</td>
                                <td>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: c.color || 'neutral.softColor',
                                            border: '1px solid rgba(0,0,0,0.2)',
                                        }}
                                    />
                                </td>
                                <td>
                                    <Button size="sm" variant="outlined" onClick={() => openEdit(c)}>
                                        编辑
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>

            <Modal open={!!editChar} onClose={() => setEditChar(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 2 }}>
                        编辑角色
                    </Typography>
                    <FormControl sx={{ mb: 1 }}>
                        <FormLabel>名称</FormLabel>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </FormControl>
                    <FormControl sx={{ mb: 1 }}>
                        <FormLabel>年龄</FormLabel>
                        <Input
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            type="number"
                            placeholder="可选"
                        />
                    </FormControl>
                    <FormControl sx={{ mb: 1 }}>
                        <FormLabel>头像地址</FormLabel>
                        <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="例如 https://xxx/xxx.webp" />
                    </FormControl>
                    <FormControl sx={{ mb: 1 }}>
                        <FormLabel>主题颜色</FormLabel>
                        <Input value={color} onChange={e => setColor(e.target.value)} placeholder="#RRGGBB 或 CSS 颜色值" />
                    </FormControl>
                    <FormControl sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FormLabel>启用</FormLabel>
                        <Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                    </FormControl>
                    <FormControl sx={{ mb: 1 }}>
                        <FormLabel>排序（数字越小越靠前）</FormLabel>
                        <Input value={order} onChange={e => setOrder(e.target.value)} type="number" />
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button variant="outlined" onClick={() => setEditChar(null)}>
                            取消
                        </Button>
                        <Button variant="solid" onClick={save} loading={loading}>
                            保存
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>
        </Box>
    );
}


