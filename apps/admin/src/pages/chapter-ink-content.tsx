import { InkResourcePreviewPanel } from '@/components/features/ink-resource-preview-panel';
import { InkSyntaxHelpDialog } from '@/components/features/ink-syntax-help-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { useChapter } from '@/lib/hooks/use-chapters';
import {
    useCompileInkFile,
    useCreateInkFile,
    useDeleteInkFile,
    useInkFiles,
    useUpdateInkFile,
} from '@/lib/hooks/use-ink-files';
import { parseResourceReference } from '@/lib/utils/ink-parser';
import { ResourceResponseDto } from '@lourd-game/shared';
import Editor, { loader } from '@monaco-editor/react';
import { HelpCircle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Monaco Editor 类型 - 使用 any 类型避免类型检查问题，运行时类型由 loader 提供
type MonacoEditor = any;
type IStandaloneCodeEditor = any;
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
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [debugStatus, setDebugStatus] = useState<{
        editorReady: boolean;
        listenerActive: boolean;
        currentPosition: { line: number; column: number } | null;
    }>({
        editorReady: false,
        listenerActive: false,
        currentPosition: null,
    });
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<MonacoEditor | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastHoverPositionRef = useRef<{ line: number; column: number } | null>(null);
    const cursorListenerRef = useRef<IDisposable | null>(null);

    // 获取项目ID（用于查询项目资源）
    const projectId = chapter?.projectId;

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

    // 处理资源悬停 - 按需查询
    const handleResourceHover = useCallback(
        async (parsed: ReturnType<typeof parseResourceReference>) => {
            console.log('[Preview] handleResourceHover called', { parsed });

            if (!parsed) {
                console.log('[Preview] No parsed result, hiding preview');
                setIsLoadingPreview(false);
                setShowPreviewPanel(false);
                return;
            }

            setIsLoadingPreview(true);
            setShowPreviewPanel(true);

            try {
                if (parsed.type === 'bundle') {
                    // 查询 Bundle 下的所有资源
                    const bundleName = parsed.value;
                    console.log('[Preview] Querying bundle:', bundleName);

                    const [chapterRes, projectRes] = await Promise.all([
                        apiClient.getChapterResources(cid, { bundle: bundleName, limit: 1000 }),
                        projectId && projectId > 0
                            ? apiClient.getProjectResources(projectId, { bundle: bundleName, limit: 1000 })
                            : Promise.resolve({ data: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
                    ]);

                    // 合并并去重
                    const chapterResourceIds = new Set(chapterRes.data.map((r: ResourceResponseDto) => r.id));
                    const allResources = [
                        ...chapterRes.data,
                        ...projectRes.data.filter((r: ResourceResponseDto) => !chapterResourceIds.has(r.id)),
                    ];

                    console.log('[Preview] Bundle query result:', {
                        bundleName,
                        chapterResources: chapterRes.data.length,
                        projectResources: projectRes.data.length,
                        total: allResources.length,
                    });

                    if (allResources.length > 0) {
                        setPreviewType('bundle');
                        setPreviewBundleName(bundleName);
                        setPreviewResources(allResources);
                        setIsLoadingPreview(false);
                    } else {
                        console.log('[Preview] Bundle not found');
                        setPreviewType('bundle');
                        setPreviewBundleName(bundleName);
                        setPreviewResources([]);
                        setIsLoadingPreview(false);
                    }
                } else if (parsed.type === 'resource') {
                    // 查询单个资源（精确匹配 alias）
                    const resourceName = parsed.value;
                    console.log('[Preview] Querying resource:', resourceName);

                    const [chapterRes, projectRes] = await Promise.all([
                        apiClient.getChapterResources(cid, { search: resourceName, limit: 1000 }),
                        projectId && projectId > 0
                            ? apiClient.getProjectResources(projectId, { search: resourceName, limit: 1000 })
                            : Promise.resolve({ data: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
                    ]);

                    // 合并并过滤精确匹配（不区分大小写）
                    const allResources = [...chapterRes.data, ...projectRes.data];
                    const exactMatch = allResources.filter(
                        (r: ResourceResponseDto) => r.alias.toLowerCase() === resourceName.toLowerCase(),
                    );

                    // 去重
                    const uniqueResources = Array.from(
                        new Map(exactMatch.map((r: ResourceResponseDto) => [r.id, r])).values(),
                    );

                    console.log('[Preview] Resource query result:', {
                        resourceName,
                        totalFound: allResources.length,
                        exactMatch: uniqueResources.length,
                    });

                    if (uniqueResources.length > 0) {
                        setPreviewType('resource');
                        setPreviewBundleName(uniqueResources[0].bundle);
                        setPreviewResources(uniqueResources);
                        setIsLoadingPreview(false);
                    } else {
                        console.log('[Preview] Resource not found');
                        setPreviewType('resource');
                        setPreviewBundleName(undefined);
                        setPreviewResources([]);
                        setIsLoadingPreview(false);
                    }
                } else if (parsed.type === 'resourceGroup' && parsed.resources) {
                    // 并行查询资源组合中的所有资源
                    console.log('[Preview] Querying resource group:', parsed.resources);

                    const queries = parsed.resources.map(resourceName =>
                        Promise.all([
                            apiClient.getChapterResources(cid, { search: resourceName, limit: 1000 }),
                            projectId && projectId > 0
                                ? apiClient.getProjectResources(projectId, { search: resourceName, limit: 1000 })
                                : Promise.resolve({ data: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
                        ]),
                    );

                    const results = await Promise.all(queries);

                    // 对每个资源过滤精确匹配，保持顺序
                    const foundResources: ResourceResponseDto[] = [];
                    const missingResources: string[] = [];

                    parsed.resources.forEach((resourceName, index) => {
                        const [chapterRes, projectRes] = results[index];
                        const allResources = [...chapterRes.data, ...projectRes.data];
                        const exactMatch = allResources.filter(
                            (r: ResourceResponseDto) => r.alias.toLowerCase() === resourceName.toLowerCase(),
                        );

                        // 去重
                        const uniqueResources = Array.from(
                            new Map(exactMatch.map((r: ResourceResponseDto) => [r.id, r])).values(),
                        );

                        if (uniqueResources.length > 0) {
                            foundResources.push(uniqueResources[0]); // 只取第一个匹配的资源
                        } else {
                            missingResources.push(resourceName);
                        }
                    });

                    console.log('[Preview] ResourceGroup query result:', {
                        resources: parsed.resources,
                        found: foundResources.length,
                        missing: missingResources,
                    });

                    if (foundResources.length > 0) {
                        setPreviewType('resourceGroup');
                        setPreviewBundleName(foundResources[0]?.bundle);
                        setPreviewResources(foundResources);
                        setIsLoadingPreview(false);
                    } else {
                        console.log('[Preview] No resources found in group');
                        setPreviewType('resourceGroup');
                        setPreviewBundleName(undefined);
                        setPreviewResources([]);
                        setIsLoadingPreview(false);
                    }
                } else {
                    console.log('[Preview] Unknown parsed type or missing resources');
                    setIsLoadingPreview(false);
                    setShowPreviewPanel(false);
                }
            } catch (error) {
                console.error('[Preview] Query failed:', error);
                toast({
                    title: '查询失败',
                    description: error instanceof Error ? error.message : String(error),
                    variant: 'destructive',
                });
                setIsLoadingPreview(false);
                setShowPreviewPanel(true);
                setPreviewResources([]);
            }
        },
        [cid, projectId, toast],
    );

    // 设置光标监听器的辅助函数
    const setupCursorListener = () => {
        console.log('[Preview] setupCursorListener called', {
            editorReady: !!editorRef.current,
        });

        if (!editorRef.current) {
            console.log('[Preview] ❌ Editor not ready');
            setDebugStatus(prev => ({ ...prev, editorReady: false, listenerActive: false }));
            return;
        }

        // 如果已经设置了监听器，先清理
        if (cursorListenerRef.current) {
            console.log('[Preview] 🔄 Replacing existing listener');
            cursorListenerRef.current.dispose();
            cursorListenerRef.current = null;
        }

        const editor = editorRef.current;
        console.log('[Preview] ✅ Setting up cursor listener');

        // 监听光标位置变化
        cursorListenerRef.current = editor.onDidChangeCursorPosition((e: any) => {
            // 清除之前的定时器
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
                setIsLoadingPreview(false);
                setShowPreviewPanel(false);
            }

            const position = e.position;
            if (!position) return;

            const lineNumber = position.lineNumber;
            const column = position.column;

            // 更新调试状态
            setDebugStatus(prev => ({
                ...prev,
                currentPosition: { line: lineNumber, column },
            }));

            // 检查是否在同一位置
            if (lastHoverPositionRef.current?.line === lineNumber && lastHoverPositionRef.current?.column === column) {
                return;
            }

            console.log('[Preview] 📍 Cursor moved to', { line: lineNumber, column });
            lastHoverPositionRef.current = { line: lineNumber, column };

            // 立即显示加载状态
            setIsLoadingPreview(true);
            setShowPreviewPanel(true);

            // 延迟2秒后触发预览（光标停止移动2秒后）
            console.log('[Preview] ⏱️ Starting 2s timer for position', { line: lineNumber, column });
            hoverTimeoutRef.current = setTimeout(() => {
                console.log('[Preview] ⏱️ Timer expired, checking resource reference');
                const model = editor.getModel();
                if (!model || !editorRef.current) {
                    console.log('[Preview] ❌ Model or editor not available');
                    setIsLoadingPreview(false);
                    setShowPreviewPanel(false);
                    hoverTimeoutRef.current = null;
                    return;
                }

                const text = model.getValue();
                const currentLine = text.split('\n')[lineNumber - 1] || '';
                const parsed = parseResourceReference(text, lineNumber, column);

                console.log('[Preview] 🔍 Parsed result:', {
                    parsed,
                    lineNumber,
                    column,
                    currentLine,
                    cursorChar: currentLine[column - 1] || '',
                });

                if (parsed) {
                    console.log('[Preview] ✅ Found resource reference:', parsed);
                    handleResourceHover(parsed).catch(error => {
                        console.error('[Preview] handleResourceHover error:', error);
                    });
                } else {
                    console.log('[Preview] ❌ No resource reference found at position');
                    setIsLoadingPreview(false);
                    setShowPreviewPanel(false);
                }
                hoverTimeoutRef.current = null;
            }, 2000);
        });

        // 更新调试状态：监听器已激活
        setDebugStatus(prev => ({
            ...prev,
            editorReady: true,
            listenerActive: true,
        }));
        console.log('[Preview] ✅ Cursor listener setup complete');
    };

    // 设置光标监听器
    useEffect(() => {
        console.log('[Preview] 🔄 useEffect triggered for cursor listener setup');
        setupCursorListener();

        return () => {
            console.log('[Preview] 🧹 Cleaning up cursor listener');
            if (cursorListenerRef.current) {
                cursorListenerRef.current.dispose();
                cursorListenerRef.current = null;
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
            setIsLoadingPreview(false);
            setDebugStatus(prev => ({ ...prev, listenerActive: false }));
        };
    }, [handleResourceHover]);

    // 编辑器加载完成回调
    const handleEditorDidMount = async (editorInstance: IStandaloneCodeEditor) => {
        console.log('[Preview] 🎯 Editor mounted');
        editorRef.current = editorInstance;
        setDebugStatus(prev => ({ ...prev, editorReady: true }));

        // 加载 monaco 实例
        const monaco = await loader.init();
        monacoRef.current = monaco as MonacoEditor;
        console.log('[Preview] ✅ Monaco loaded');

        // 编辑器准备好后，尝试设置光标监听器
        // 使用 setTimeout 确保在下一个事件循环中执行，此时资源数据可能已经准备好
        setTimeout(() => {
            console.log('[Preview] 🔄 Attempting to setup cursor listener after editor mount');
            setupCursorListener();
        }, 100);

        // 注册 Ink 语言（如果还没注册）
        const languages = monaco.languages.getLanguages();
        if (!languages.find((lang: any) => lang.id === 'ink')) {
            monaco.languages.register({ id: 'ink' });
        }

        // 设置语法高亮规则 - 不同关键字使用不同颜色
        monaco.languages.setMonarchTokensProvider('ink', {
            tokenizer: {
                root: [
                    // 注释
                    [/\/\/.*$/, 'comment'],
                    // 标签定义
                    [/===.*===/, 'tag'],
                    // 跳转标签
                    [/->\s*\w+/, 'tag'],
                    // INCLUDE 关键字 - 深蓝色
                    [/INCLUDE\s+/, 'include-keyword'],
                    // # lazyload 关键字 - 蓝色
                    [/#\s+lazyload\s+/, 'lazyload-keyword'],
                    // # show 关键字 - 绿色
                    [/#\s+show\s+/, 'show-keyword'],
                    // # remove 关键字 - 红色
                    [/#\s+remove\s+/, 'remove-keyword'],
                    // # edit 关键字 - 橙色
                    [/#\s+edit\s+/, 'edit-keyword'],
                    // # pause 关键字 - 紫色
                    [/#\s+pause/, 'pause-keyword'],
                    // # request 关键字 - 青色
                    [/#\s+request\s+/, 'request-keyword'],
                    // bundle 命令 - 紫色
                    [/\bbundle\b/, 'bundle-type'],
                    // image 命令 - 粉色
                    [/\bimage\b/, 'image-type'],
                    // imagecontainer 命令 - 深粉色
                    [/\bimagecontainer\b/, 'imagecontainer-type'],
                    // text 命令 - 黄色
                    [/\btext\b/, 'text-type'],
                    // bg 命令 - 绿色
                    [/\bbg\b/, 'bg-type'],
                    // input 命令 - 青色
                    [/\binput\b/, 'input-type'],
                    // 资源组合 - 橙色加粗
                    [/\[[^\]]+\]/, 'resource-group'],
                    // 字符串（对话内容）
                    [/"[^"]*"/, 'string'],
                    // 角色对话 - 红色
                    [/^\s*\w+:/, 'dialogue-character'],
                    // 资源名称（单词）- 绿色
                    [/\b[a-zA-Z0-9_-]+\b/, 'identifier'],
                ],
            },
        });

        // 设置主题颜色 - 不同关键字使用不同颜色
        monaco.editor.defineTheme('ink-light', {
            base: 'vs',
            inherit: true,
            rules: [
                // 注释
                { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
                // 标签相关
                { token: 'tag', foreground: '059669', fontStyle: 'bold' },
                // INCLUDE 关键字 - 深蓝色
                { token: 'include-keyword', foreground: '1E40AF', fontStyle: 'bold' },
                // lazyload 关键字 - 蓝色
                { token: 'lazyload-keyword', foreground: '2563EB', fontStyle: 'bold' },
                // show 关键字 - 绿色
                { token: 'show-keyword', foreground: '16A34A', fontStyle: 'bold' },
                // remove 关键字 - 红色
                { token: 'remove-keyword', foreground: 'DC2626', fontStyle: 'bold' },
                // edit 关键字 - 橙色
                { token: 'edit-keyword', foreground: 'EA580C', fontStyle: 'bold' },
                // pause 关键字 - 紫色
                { token: 'pause-keyword', foreground: '9333EA', fontStyle: 'bold' },
                // request 关键字 - 青色
                { token: 'request-keyword', foreground: '0891B2', fontStyle: 'bold' },
                // 命令类型
                { token: 'bundle-type', foreground: '7C3AED', fontStyle: 'bold' },
                { token: 'image-type', foreground: 'EC4899', fontStyle: 'bold' },
                { token: 'imagecontainer-type', foreground: 'DB2777', fontStyle: 'bold' },
                { token: 'text-type', foreground: 'F59E0B', fontStyle: 'bold' },
                { token: 'bg-type', foreground: '10B981', fontStyle: 'bold' },
                { token: 'input-type', foreground: '06B6D4', fontStyle: 'bold' },
                // 资源组合
                { token: 'resource-group', foreground: 'D97706', fontStyle: 'bold' },
                // 字符串
                { token: 'string', foreground: 'D97706' },
                // 角色对话
                { token: 'dialogue-character', foreground: 'DC2626', fontStyle: 'bold' },
                // 资源名称
                { token: 'identifier', foreground: '16A34A' },
            ],
            colors: {
                'editor.background': '#ffffff',
            },
        });

        // 应用主题
        monaco.editor.setTheme('ink-light');
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

            <div className='grid grid-cols-12 gap-4 flex-1 min-h-0'>
                {/* 左侧：文件列表 */}
                <div className='col-span-2 border rounded p-2 overflow-auto'>
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

                {/* 中间：编辑器区域 */}
                <div className='col-span-6 flex flex-col space-y-3 min-h-0'>
                    <div className='grid grid-cols-2 gap-2'>
                        <Input placeholder='文件名' value={filename} onChange={e => setFilename(e.target.value)} />
                        <Input
                            placeholder='显示名（可选）'
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className='border rounded flex-1 min-h-0'>
                        <Editor
                            height='100%'
                            defaultLanguage='ink'
                            theme='ink-light'
                            value={content}
                            onChange={v => setContent(v || '')}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                automaticLayout: true,
                            }}
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
                    {compiled && (
                        <div className='space-y-2'>
                            <p className='text-sm text-gray-600'>编译结果</p>
                            <Textarea
                                className='font-mono text-xs'
                                value={compiled}
                                readOnly
                                rows={8}
                                placeholder='JSON 文本'
                            />
                        </div>
                    )}
                </div>

                {/* 右侧：预览面板 */}
                <div className='col-span-4 flex flex-col min-h-0 space-y-2'>
                    {/* 调试状态面板 */}
                    <div className='border rounded-lg p-3 bg-muted/30 text-xs space-y-1'>
                        <div className='font-semibold mb-2'>系统状态</div>
                        <div className='flex items-center gap-2'>
                            <span className={debugStatus.editorReady ? 'text-green-600' : 'text-red-600'}>
                                {debugStatus.editorReady ? '✓' : '✗'}
                            </span>
                            <span>编辑器: {debugStatus.editorReady ? '已就绪' : '未就绪'}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className={debugStatus.listenerActive ? 'text-green-600' : 'text-red-600'}>
                                {debugStatus.listenerActive ? '✓' : '✗'}
                            </span>
                            <span>光标监听: {debugStatus.listenerActive ? '已激活' : '未激活'}</span>
                        </div>
                        {debugStatus.currentPosition && (
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <span>📍</span>
                                <span>
                                    位置: 第 {debugStatus.currentPosition.line} 行, 第{' '}
                                    {debugStatus.currentPosition.column} 列
                                </span>
                            </div>
                        )}
                        {isLoadingPreview && (
                            <div className='flex items-center gap-2 text-blue-600'>
                                <span>⏱️</span>
                                <span>等待 2 秒后解析资源引用...</span>
                            </div>
                        )}
                    </div>

                    {showPreviewPanel || isLoadingPreview ? (
                        <div className='border rounded-lg p-4 bg-card shadow-lg h-full overflow-auto flex flex-col'>
                            {isLoadingPreview ? (
                                <div className='flex flex-col items-center justify-center p-8 flex-1'>
                                    <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
                                    <span className='text-sm font-medium text-foreground mb-2'>
                                        正在解析资源引用...
                                    </span>
                                    <span className='text-xs text-muted-foreground text-center'>
                                        请将光标停留在资源引用上 2 秒
                                        <br />
                                        {lastHoverPositionRef.current && (
                                            <>
                                                当前位置：第 {lastHoverPositionRef.current.line} 行，第{' '}
                                                {lastHoverPositionRef.current.column} 列
                                            </>
                                        )}
                                    </span>
                                </div>
                            ) : previewResources.length > 0 ? (
                                <InkResourcePreviewPanel
                                    type={previewType}
                                    bundleName={previewBundleName}
                                    resources={previewResources}
                                    onClose={() => {
                                        setShowPreviewPanel(false);
                                        setIsLoadingPreview(false);
                                        lastHoverPositionRef.current = null;
                                    }}
                                />
                            ) : (
                                <div className='flex flex-col items-center justify-center p-8 flex-1'>
                                    <div className='text-sm text-muted-foreground text-center space-y-2'>
                                        <p className='font-medium'>未找到匹配的资源</p>
                                        <p className='text-xs'>
                                            {lastHoverPositionRef.current && (
                                                <>
                                                    位置：第 {lastHoverPositionRef.current.line} 行，第{' '}
                                                    {lastHoverPositionRef.current.column} 列
                                                    <br />
                                                </>
                                            )}
                                            请确保资源已添加到章节或项目中
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='border rounded-lg p-4 bg-muted/30 h-full flex flex-col items-center justify-center'>
                            <div className='text-sm text-muted-foreground text-center space-y-2'>
                                <p className='font-medium'>资源预览</p>
                                <p className='text-xs'>
                                    将光标移动到资源引用上
                                    <br />
                                    停留 2 秒查看预览
                                </p>
                                <div className='mt-4 text-xs text-muted-foreground/70 space-y-1'>
                                    <p>支持的资源引用：</p>
                                    <ul className='list-disc list-inside space-y-1'>
                                        <li>
                                            Bundle: <code className='bg-muted px-1 rounded'>m01</code>
                                        </li>
                                        <li>
                                            单个资源: <code className='bg-muted px-1 rounded'>bg01-hallway</code>
                                        </li>
                                        <li>
                                            资源组合:{' '}
                                            <code className='bg-muted px-1 rounded'>[m01-body m01-eyes-smile]</code>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <InkSyntaxHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
        </div>
    );
}
