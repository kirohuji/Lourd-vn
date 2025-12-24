import { InkResourcePreviewPanel } from '@/components/features/ink-resource-preview-panel';
import { InkSyntaxHelpDialog } from '@/components/features/ink-syntax-help-dialog';
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
import { useAllResources, useBundleList } from '@/lib/hooks/use-resources';
import { parseResourceReference } from '@/lib/utils/ink-parser';
import { ResourceResponseDto } from '@lourd-game/shared';
import Editor, { loader } from '@monaco-editor/react';
import { HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Monaco Editor 类型 - 使用 any 类型避免类型检查问题，运行时类型由 loader 提供
type MonacoEditor = any;
type IStandaloneCodeEditor = any;
type ITextModel = any;
type IPosition = { lineNumber: number; column: number };
type IDisposable = { dispose: () => void };

interface ChapterInkContentProps {
    chapterId: number;
}

export default function ChapterInkContent({ chapterId }: ChapterInkContentProps) {
    const cid = chapterId;
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

    // 资源预览相关状态
    const [showPreviewPanel, setShowPreviewPanel] = useState(false);
    const [previewType, setPreviewType] = useState<'bundle' | 'resource' | 'resourceGroup'>('resource');
    const [previewResources, setPreviewResources] = useState<ResourceResponseDto[]>([]);
    const [previewBundleName, setPreviewBundleName] = useState<string | undefined>();
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<MonacoEditor | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastHoverPositionRef = useRef<{ line: number; column: number } | null>(null);

    // 获取所有资源数据（用于搜索）
    const { data: allResourcesData } = useAllResources();
    const { data: bundleListData } = useBundleList({ limit: 1000 });

    // 资源缓存
    const resourcesCache = useMemo(() => {
        if (!allResourcesData?.data) return new Map<string, ResourceResponseDto[]>();
        const cache = new Map<string, ResourceResponseDto[]>();
        allResourcesData.data.forEach(resource => {
            const alias = resource.alias.toLowerCase();
            if (!cache.has(alias)) {
                cache.set(alias, []);
            }
            cache.get(alias)!.push(resource);
        });
        return cache;
    }, [allResourcesData]);

    // Bundle缓存
    const bundleCache = useMemo(() => {
        if (!bundleListData?.data) return new Map<string, any>();
        const cache = new Map<string, any>();
        bundleListData.data.forEach((bundle: any) => {
            cache.set(bundle.name.toLowerCase(), bundle);
        });
        return cache;
    }, [bundleListData]);

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
            setShowPreviewPanel(false);
        }
    }, [selectedInk]);

    // 处理资源悬停
    const handleResourceHover = useMemo(
        () => (parsed: ReturnType<typeof parseResourceReference>) => {
            if (!parsed) return;

            if (parsed.type === 'bundle') {
                // 查找Bundle信息
                const bundleInfo = bundleCache.get(parsed.value.toLowerCase());
                if (bundleInfo) {
                    // 获取该Bundle的所有资源
                    const bundleResources =
                        allResourcesData?.data?.filter(r => r.bundle?.toLowerCase() === parsed.value.toLowerCase()) ||
                        [];
                    setPreviewType('bundle');
                    setPreviewBundleName(parsed.value);
                    setPreviewResources(bundleResources);
                    setShowPreviewPanel(true);
                }
            } else if (parsed.type === 'resource') {
                // 查找单个资源
                const resources = resourcesCache.get(parsed.value.toLowerCase()) || [];
                if (resources.length > 0) {
                    setPreviewType('resource');
                    setPreviewBundleName(resources[0].bundle);
                    setPreviewResources(resources);
                    setShowPreviewPanel(true);
                }
            } else if (parsed.type === 'resourceGroup' && parsed.resources) {
                // 查找资源组合（保持顺序）
                const foundResources: ResourceResponseDto[] = [];
                parsed.resources.forEach(resourceName => {
                    const resources = resourcesCache.get(resourceName.toLowerCase()) || [];
                    // 只取第一个匹配的资源，保持顺序
                    if (resources.length > 0) {
                        foundResources.push(resources[0]);
                    }
                });
                if (foundResources.length > 0) {
                    setPreviewType('resourceGroup');
                    setPreviewBundleName(foundResources[0]?.bundle);
                    setPreviewResources(foundResources);
                    setShowPreviewPanel(true);
                }
            }
        },
        [resourcesCache, bundleCache, allResourcesData],
    );

    // 注册Monaco Editor hover provider和鼠标移动监听
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;

        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!monaco) return;

        let hoverDisposable: IDisposable | null = null;
        let mouseMoveDisposable: IDisposable | null = null;

        // 注册hover provider
        hoverDisposable = monaco.languages.registerHoverProvider('ink', {
            provideHover: (model: ITextModel, position: IPosition) => {
                // 清除之前的定时器
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }

                const lineNumber = position.lineNumber;
                const column = position.column;

                // 检查是否在同一位置
                if (
                    lastHoverPositionRef.current?.line === lineNumber &&
                    lastHoverPositionRef.current?.column === column
                ) {
                    return null;
                }

                lastHoverPositionRef.current = { line: lineNumber, column };

                // 延迟2秒后触发预览
                hoverTimeoutRef.current = setTimeout(() => {
                    const parsed = parseResourceReference(model.getValue(), lineNumber, column);
                    if (parsed) {
                        handleResourceHover(parsed);
                    }
                    hoverTimeoutRef.current = null;
                }, 2000);

                return null;
            },
        });

        // 监听鼠标移动，清除定时器
        mouseMoveDisposable = editor.onMouseMove(() => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
                lastHoverPositionRef.current = null;
            }
        });

        return () => {
            hoverDisposable?.dispose();
            mouseMoveDisposable?.dispose();
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, [handleResourceHover, monacoRef.current]);

    // 编辑器加载完成回调
    const handleEditorDidMount = async (editorInstance: IStandaloneCodeEditor) => {
        editorRef.current = editorInstance;
        // 加载 monaco 实例
        const monaco = await loader.init();
        monacoRef.current = monaco as MonacoEditor;

        // 注册 Ink 语言
        monaco.languages.register({ id: 'ink' });

        // 设置语法高亮规则
        monaco.languages.setMonarchTokensProvider('ink', {
            tokenizer: {
                root: [
                    // 注释
                    [/\/\/.*$/, 'comment'],
                    // 关键字
                    [/#\s*(lazyload|show|remove|edit|pause|request)/, 'keyword'],
                    [/(INCLUDE|->|===)/, 'keyword'],
                    // 命令类型
                    [/\b(bundle|image|imagecontainer|text|bg|input)\b/, 'type'],
                    // 标签定义
                    [/===.*===/, 'tag'],
                    // 跳转标签
                    [/->\s*\w+/, 'tag'],
                    // 资源组合
                    [/\[[^\]]+\]/, 'string'],
                    // 字符串（对话内容）
                    [/"[^"]*"/, 'string'],
                    // 角色对话
                    [/^\s*\w+:/, 'variable'],
                    // 资源名称（单词）
                    [/\b[a-zA-Z0-9_-]+\b/, 'identifier'],
                ],
            },
        });

        // 设置主题颜色
        monaco.editor.defineTheme('ink-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '0066CC', fontStyle: 'bold' },
                { token: 'type', foreground: '7C3AED' },
                { token: 'string', foreground: 'D97706' },
                { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
                { token: 'tag', foreground: '059669', fontStyle: 'bold' },
                { token: 'variable', foreground: 'DC2626' },
                { token: 'identifier', foreground: '16A34A' },
            ],
            colors: {
                'editor.background': '#ffffff',
            },
        });
    };

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
            const msg =
                e?.response?.data?.message ||
                (Array.isArray(e?.response?.data?.errors) ? e.response.data.errors.join('\n') : String(e));
            toast({ title: '编译失败', description: msg });
        }
    };

    return (
        <div className='flex flex-col h-full space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>章节 Ink 管理</h1>
                    <p className='text-sm text-muted-foreground'>
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
                    <Button variant='outline' onClick={() => setHelpDialogOpen(true)}>
                        <HelpCircle className='h-4 w-4 mr-2' />
                        语法帮助
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
                            defaultLanguage='ink'
                            theme='ink-light'
                            value={content}
                            onChange={v => setContent(v || '')}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                            }}
                        />
                    </div>
                    {showPreviewPanel && (
                        <InkResourcePreviewPanel
                            type={previewType}
                            bundleName={previewBundleName}
                            resources={previewResources}
                            onClose={() => {
                                setShowPreviewPanel(false);
                                lastHoverPositionRef.current = null;
                            }}
                        />
                    )}
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
            <InkSyntaxHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
        </div>
    );
}
