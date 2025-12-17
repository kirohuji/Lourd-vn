import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useChapter } from '@/lib/hooks/use-chapters';
import {
    useCompileInkFile,
    useCreateInkFile,
    useDeleteInkFile,
    useInkFiles,
    useUpdateInkFile,
} from '@/lib/hooks/use-ink-files';
import Editor from '@monaco-editor/react';
// import JsonViewer from '@andypf/json-viewer';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ChapterInkPage() {
    const { chapterId } = useParams<{ chapterId: string }>();
    const cid = Number(chapterId);
    const { data: chapter } = useChapter(cid);
    const { data: inkFiles = [], isLoading, refetch } = useInkFiles(cid);
    const { toast } = useToast();

    const createMutation = useCreateInkFile();
    const updateMutation = useUpdateInkFile();
    const deleteMutation = useDeleteInkFile();
    const compileMutation = useCompileInkFile();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selectedInk = useMemo(() => inkFiles.find(f => f.id === selectedId), [inkFiles, selectedId]);
    const [filename, setFilename] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [content, setContent] = useState('');
    const [compiled, setCompiled] = useState<string>('');

    useEffect(() => {
        if (!selectedId && inkFiles.length > 0) {
            setSelectedId(inkFiles[0].id);
        }
    }, [inkFiles, selectedId]);

    useEffect(() => {
        if (selectedInk) {
            setFilename(selectedInk.filename);
            setDisplayName(selectedInk.displayName || '');
            setContent(selectedInk.content || '');
            setCompiled('');
        }
    }, [selectedInk]);

    const handleCreate = async () => {
        try {
            const name = prompt('新建 Ink 文件名（不含后缀）', 'new-chapter');
            if (!name) return;
            const res = await createMutation.mutateAsync({
                chapterId: cid,
                dto: { filename: name.endsWith('.ink') ? name : `${name}.ink` },
            });
            setSelectedId(res.id);
            toast({ title: '创建成功' });
        } catch (e: any) {
            toast({ title: '创建失败', description: String(e) });
        }
    };

    const handleSave = async () => {
        if (!selectedId) return;
        try {
            await updateMutation.mutateAsync({
                chapterId: cid,
                inkId: selectedId,
                dto: { filename, displayName, content },
            });
            await refetch();
            toast({ title: '保存成功' });
        } catch (e: any) {
            toast({ title: '保存失败', description: String(e) });
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!confirm('确定删除该 Ink 文件？')) return;
        try {
            await deleteMutation.mutateAsync({ chapterId: cid, inkId: selectedId });
            setSelectedId(null);
            setContent('');
            await refetch();
            toast({ title: '删除成功' });
        } catch (e: any) {
            toast({ title: '删除失败', description: String(e) });
        }
    };

    const handleSetStart = async () => {
        if (!selectedId) return;
        try {
            await updateMutation.mutateAsync({
                chapterId: cid,
                inkId: selectedId,
                dto: { isStart: true },
            });
            await refetch();
            toast({ title: '已设为起始 Ink' });
        } catch (e: any) {
            toast({ title: '设置失败', description: String(e) });
        }
    };

    const handleCompile = async () => {
        if (!selectedId) return;
        try {
            const res = await compileMutation.mutateAsync({ chapterId: cid, inkId: selectedId });
            setCompiled(res.compiledContent);
            toast({ title: '编译成功' });
        } catch (e: any) {
            // 尝试从后端错误对象中提取 message/errors
            const msg =
                e?.response?.data?.message ||
                (Array.isArray(e?.response?.data?.errors) ? e.response.data.errors.join('\n') : String(e));
            toast({ title: '编译失败', description: msg });
        }
    };

    return (
        <div className='p-4 space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-xl font-semibold'>章节 Ink 管理</h2>
                    <p className='text-sm text-gray-500'>
                        章节：{chapter?.name}（ID: {cid}），当前起始 Ink：{chapter?.startInkId ?? '未设置'}
                    </p>
                </div>
                <div className='space-x-2'>
                    <Button onClick={handleCreate}>新建 Ink</Button>
                    <Button variant='secondary' onClick={handleSetStart} disabled={!selectedId}>
                        设为起始
                    </Button>
                    <Button variant='outline' onClick={handleDelete} disabled={!selectedId}>
                        删除
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-4 gap-4'>
                <div className='col-span-1 border rounded p-2 h-[70vh] overflow-auto'>
                    {isLoading ? (
                        <div>加载中...</div>
                    ) : (
                        <ul className='space-y-2'>
                            {inkFiles.map(file => (
                                <li
                                    key={file.id}
                                    className={`p-2 border rounded cursor-pointer ${
                                        selectedId === file.id ? 'bg-gray-100' : ''
                                    }`}
                                    onClick={() => setSelectedId(file.id)}
                                >
                                    <div className='font-medium'>{file.filename}</div>
                                    <div className='text-xs text-gray-500'>
                                        {file.displayName || '无显示名'}
                                        {file.isStart ? ' · 起始' : ''}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className='col-span-3 space-y-3'>
                    <div className='grid grid-cols-2 gap-2'>
                        <Input placeholder='文件名' value={filename} onChange={e => setFilename(e.target.value)} />
                        <Input
                            placeholder='显示名（可选）'
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className='border rounded'>
                        <Editor
                            height='40vh'
                            defaultLanguage='plaintext'
                            theme='vs-dark'
                            value={content}
                            onChange={v => setContent(v || '')}
                            options={{ minimap: { enabled: false } }}
                        />
                    </div>
                    <div className='space-x-2'>
                        <Button onClick={handleSave} disabled={!selectedId}>
                            保存
                        </Button>
                        <Button variant='secondary' onClick={handleCompile} disabled={!selectedId}>
                            编译
                        </Button>
                    </div>
                    <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>编译结果</p>
                        <div className='grid grid-cols-2 gap-4'>
                            <Textarea
                                className='font-mono text-xs'
                                value={compiled}
                                readOnly
                                rows={10}
                                placeholder='JSON 文本'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
