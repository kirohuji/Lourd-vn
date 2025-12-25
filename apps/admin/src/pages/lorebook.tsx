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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    useCreateLoreBookCategory,
    useCreateLoreBookEntry,
    useDeleteLoreBookCategory,
    useDeleteLoreBookEntry,
    useLoreBookCategories,
    useLoreBookEntries,
    useUpdateLoreBookCategory,
    useUpdateLoreBookEntry,
} from '@/lib/hooks/use-lorebook';
import {
    CreateLoreBookCategoryDto,
    CreateLoreBookEntryDto,
    LoreBookCategoryResponseDto,
    LoreBookEntryResponseDto,
} from '@lourd-game/shared';
import { ChevronDown, ChevronRight, Download, Edit, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function LoreBookPage() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'category' | 'entry' | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
    const [createEntryDialogOpen, setCreateEntryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newEntryCategoryId, setNewEntryCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();
    const { data: categories = [], isLoading: isLoadingCategories } = useLoreBookCategories();
    const { data: entries = [] } = useLoreBookEntries(selectedCategoryId || undefined);

    const createCategory = useCreateLoreBookCategory();
    const updateCategory = useUpdateLoreBookCategory();
    const deleteCategory = useDeleteLoreBookCategory();
    const createEntry = useCreateLoreBookEntry();
    const updateEntry = useUpdateLoreBookEntry();
    const deleteEntry = useDeleteLoreBookEntry();

    // 初始化展开状态 - 只在 categories 长度变化时更新，避免无限循环
    useEffect(() => {
        const expanded = new Set<string>();
        categories.forEach(cat => {
            if (cat.open) {
                expanded.add(cat.id);
            }
        });
        // 只在展开状态真正变化时才更新
        const currentIds = Array.from(expandedCategories).sort().join(',');
        const newIds = Array.from(expanded).sort().join(',');
        if (currentIds !== newIds) {
            setExpandedCategories(expanded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories.length]);

    // 根据 category order 排序 entries
    const sortedEntries = (categoryId: string | null) => {
        if (!categoryId) return entries;
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.order || category.order.length === 0) return entries;

        const orderedEntries: LoreBookEntryResponseDto[] = [];
        const entryMap = new Map(entries.map(e => [e.id, e]));

        // 先添加 order 中的 entries
        category.order.forEach((id: string) => {
            const entry = entryMap.get(id);
            if (entry) {
                orderedEntries.push(entry);
                entryMap.delete(id);
            }
        });

        // 再添加剩余的 entries
        entryMap.forEach(entry => orderedEntries.push(entry));

        return orderedEntries;
    };

    const handleToggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
            updateCategory.mutate({ id: categoryId, dto: { open: false } });
        } else {
            newExpanded.add(categoryId);
            updateCategory.mutate({ id: categoryId, dto: { open: true } });
        }
        setExpandedCategories(newExpanded);
    };

    const handleCreateCategory = () => {
        setNewCategoryName('');
        setCreateCategoryDialogOpen(true);
    };

    const handleSaveCreateCategory = () => {
        if (!newCategoryName.trim()) {
            toast({
                title: '错误',
                description: '请输入分类名称',
                variant: 'destructive',
            });
            return;
        }

        const dto: CreateLoreBookCategoryDto = {
            name: newCategoryName.trim(),
            enabled: true,
            open: true,
        };

        createCategory.mutate(dto, {
            onSuccess: data => {
                toast({ title: '成功', description: '分类创建成功' });
                setExpandedCategories(prev => new Set(prev).add(data.id));
                setSelectedCategoryId(data.id);
                setCreateCategoryDialogOpen(false);
                setNewCategoryName('');
            },
            onError: (error: any) => {
                toast({
                    title: '创建失败',
                    description: error.message || '创建分类失败',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleCreateEntry = (categoryId?: string) => {
        setNewEntryCategoryId(categoryId || selectedCategoryId);
        setCreateEntryDialogOpen(true);
    };

    const handleSaveCreateEntry = () => {
        const dto: CreateLoreBookEntryDto = {
            text: '',
            displayName: '新条目',
            keys: [],
            categoryId: newEntryCategoryId || undefined,
            lastUpdatedAt: Date.now(),
        };

        createEntry.mutate(dto, {
            onSuccess: data => {
                toast({ title: '成功', description: '条目创建成功' });
                setSelectedEntryId(data.id);
                if (data.categoryId) {
                    setSelectedCategoryId(data.categoryId);
                }
                setCreateEntryDialogOpen(false);
                setNewEntryCategoryId(null);
            },
            onError: (error: any) => {
                toast({
                    title: '创建失败',
                    description: error.message || '创建条目失败',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleDeleteCategory = (category: LoreBookCategoryResponseDto) => {
        setDeleteType('category');
        setItemToDelete({ id: category.id, name: category.name });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteEntry = (entry: LoreBookEntryResponseDto) => {
        setDeleteType('entry');
        setItemToDelete({ id: entry.id, name: entry.displayName });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete || !deleteType) return;

        try {
            if (deleteType === 'category') {
                await deleteCategory.mutateAsync(itemToDelete.id);
                toast({ title: '成功', description: '分类已删除' });
                if (selectedCategoryId === itemToDelete.id) {
                    setSelectedCategoryId(null);
                }
            } else if (deleteType === 'entry') {
                await deleteEntry.mutateAsync(itemToDelete.id);
                toast({ title: '成功', description: '条目已删除' });
                if (selectedEntryId === itemToDelete.id) {
                    setSelectedEntryId(null);
                }
            }
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
            setDeleteType(null);
        } catch (error: any) {
            toast({
                title: '删除失败',
                description: error.message || '删除失败',
                variant: 'destructive',
            });
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const selectedEntry = entries.find(e => e.id === selectedEntryId);

    // 搜索过滤
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const query = searchQuery.toLowerCase();
        return categories.filter(cat => {
            if (cat.name.toLowerCase().includes(query)) return true;
            const categoryEntries = entries.filter(e => e.categoryId === cat.id);
            return categoryEntries.some(e => e.displayName.toLowerCase().includes(query));
        });
    }, [categories, entries, searchQuery]);

    const filteredEntries = useMemo(() => {
        if (!searchQuery.trim()) return entries;
        const query = searchQuery.toLowerCase();
        return entries.filter(e => e.displayName.toLowerCase().includes(query) || e.text.toLowerCase().includes(query));
    }, [entries, searchQuery]);

    return (
        <div className='flex flex-col h-full space-y-4'>
            {/* 顶部工具栏 */}
            <div className='flex items-center justify-between border-b pb-4'>
                <div>
                    <h1 className='text-3xl font-bold'>LoreBook</h1>
                    <p className='text-sm text-muted-foreground mt-1'>管理知识库条目和分类</p>
                </div>
                <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                        <Upload className='mr-2 h-4 w-4' />
                        导入
                    </Button>
                    <Button variant='outline' size='sm'>
                        <Download className='mr-2 h-4 w-4' />
                        导出
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-12 gap-4 flex-1 min-h-0'>
                {/* 左侧：分类和条目菜单 */}
                <div className='col-span-4 border rounded-lg p-4 flex flex-col min-h-0 bg-card'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='font-semibold text-lg'>条目列表</div>
                        <div className='flex gap-2'>
                            <Button size='sm' variant='outline' onClick={handleCreateCategory}>
                                <Plus className='mr-2 h-4 w-4' />
                                分类
                            </Button>
                            <Button size='sm' onClick={() => handleCreateEntry()}>
                                <Plus className='mr-2 h-4 w-4' />
                                条目
                            </Button>
                        </div>
                    </div>

                    {/* 搜索框 */}
                    <div className='mb-3'>
                        <div className='relative'>
                            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                            <Input
                                placeholder='搜索条目...'
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className='pl-8'
                            />
                        </div>
                    </div>

                    {isLoadingCategories ? (
                        <div className='flex items-center justify-center flex-1'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            {searchQuery ? '未找到匹配的条目' : '暂无分类'}
                        </div>
                    ) : (
                        <div className='space-y-2 overflow-auto flex-1'>
                            {filteredCategories.map(category => {
                                const isExpanded = expandedCategories.has(category.id);
                                const categoryEntries = searchQuery
                                    ? filteredEntries.filter(e => e.categoryId === category.id)
                                    : sortedEntries(category.id);
                                const isSelected = selectedCategoryId === category.id;

                                return (
                                    <div key={category.id} className='border rounded-md overflow-hidden bg-card'>
                                        {/* Category Header */}
                                        <div
                                            className={`group px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b ${
                                                isSelected
                                                    ? 'bg-primary/5 border-l-2 border-l-primary'
                                                    : 'hover:bg-muted/50'
                                            } ${isExpanded ? 'border-b-border' : 'border-b-transparent'}`}
                                            onClick={() => {
                                                setSelectedCategoryId(category.id);
                                                setSelectedEntryId(null);
                                            }}
                                        >
                                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleToggleCategory(category.id);
                                                    }}
                                                    className='p-0.5 hover:bg-accent rounded transition-colors'
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className='h-4 w-4 text-muted-foreground' />
                                                    ) : (
                                                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                                                    )}
                                                </button>
                                                <span
                                                    className={`font-medium truncate text-sm ${
                                                        isSelected ? 'text-primary' : ''
                                                    }`}
                                                >
                                                    {category.name}
                                                </span>
                                                <span className='text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
                                                    {categoryEntries.length}
                                                </span>
                                            </div>
                                            <div
                                                className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6'
                                                    onClick={() => {
                                                        setSelectedCategoryId(category.id);
                                                        setSelectedEntryId(null);
                                                    }}
                                                >
                                                    <Edit className='h-3.5 w-3.5' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6 text-destructive hover:text-destructive'
                                                    onClick={() => handleDeleteCategory(category)}
                                                >
                                                    <Trash2 className='h-3.5 w-3.5' />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Category Entries */}
                                        {isExpanded && categoryEntries.length > 0 && (
                                            <div className='border-t bg-muted/30'>
                                                {categoryEntries.map(entry => {
                                                    const isEntrySelected = selectedEntryId === entry.id;
                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className={`group relative px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 ${
                                                                isEntrySelected
                                                                    ? 'bg-primary/5 border-l-2 border-l-primary'
                                                                    : 'hover:bg-muted/50'
                                                            }`}
                                                            onClick={() => {
                                                                setSelectedEntryId(entry.id);
                                                                setSelectedCategoryId(category.id);
                                                            }}
                                                        >
                                                            <div className='flex items-start justify-between gap-2'>
                                                                <div className='flex-1 min-w-0'>
                                                                    <div className='flex items-center gap-2 mb-1'>
                                                                        <span
                                                                            className={`text-sm font-medium truncate ${
                                                                                isEntrySelected ? 'text-primary' : ''
                                                                            }`}
                                                                        >
                                                                            {entry.displayName}
                                                                        </span>
                                                                        {!entry.enabled && (
                                                                            <span className='text-xs text-muted-foreground/60 px-1.5 py-0.5 bg-muted rounded'>
                                                                                禁用
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {entry.keys && entry.keys.length > 0 && (
                                                                        <div className='flex flex-wrap gap-1 mt-1'>
                                                                            {entry.keys.slice(0, 3).map((key, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    className='text-xs px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground'
                                                                                >
                                                                                    {key}
                                                                                </span>
                                                                            ))}
                                                                            {entry.keys.length > 3 && (
                                                                                <span className='text-xs text-muted-foreground'>
                                                                                    +{entry.keys.length - 3}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        className='h-6 w-6'
                                                                        onClick={() => {
                                                                            setSelectedEntryId(entry.id);
                                                                            setSelectedCategoryId(category.id);
                                                                        }}
                                                                    >
                                                                        <Edit className='h-3.5 w-3.5' />
                                                                    </Button>
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        className='h-6 w-6 text-destructive hover:text-destructive'
                                                                        onClick={() => handleDeleteEntry(entry)}
                                                                    >
                                                                        <Trash2 className='h-3.5 w-3.5' />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 右侧：编辑面板 */}
                <div className='col-span-8 border rounded-lg p-6 flex flex-col min-h-0 overflow-auto bg-card'>
                    {selectedEntry ? (
                        <EntryEditor
                            entry={selectedEntry}
                            categories={categories}
                            onUpdate={dto => updateEntry.mutate({ id: selectedEntry.id, dto })}
                        />
                    ) : selectedCategory ? (
                        <CategoryEditor
                            category={selectedCategory}
                            onUpdate={dto => updateCategory.mutate({ id: selectedCategory.id, dto })}
                        />
                    ) : (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            <div className='text-center'>
                                <p className='text-lg font-medium mb-2'>选择一个条目或分类开始编辑</p>
                                <p className='text-sm'>从左侧列表中选择一个条目或分类来查看和编辑其详细信息</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 创建分类对话框 */}
            <Dialog open={createCategoryDialogOpen} onOpenChange={setCreateCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>创建分类</DialogTitle>
                        <DialogDescription>创建一个新的 LoreBook 分类</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='category-name'>分类名称 *</Label>
                            <Input
                                id='category-name'
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                placeholder='请输入分类名称'
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        handleSaveCreateCategory();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setCreateCategoryDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveCreateCategory}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 创建条目对话框 */}
            <Dialog open={createEntryDialogOpen} onOpenChange={setCreateEntryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>创建条目</DialogTitle>
                        <DialogDescription>创建一个新的 LoreBook 条目</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='entry-category'>分类（可选）</Label>
                            <Select
                                value={newEntryCategoryId || 'none'}
                                onValueChange={value => setNewEntryCategoryId(value === 'none' ? null : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='选择分类' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='none'>无分类</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setCreateEntryDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveCreateEntry}>创建</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除 {deleteType === 'category' ? '分类' : '条目'} "{itemToDelete?.name}" 吗？
                            {deleteType === 'category' && '此操作将同时删除该分类下的所有条目。'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Entry 编辑器组件
function EntryEditor({
    entry,
    categories,
    onUpdate,
}: {
    entry: LoreBookEntryResponseDto;
    categories: LoreBookCategoryResponseDto[];
    onUpdate: (dto: any) => void;
}) {
    const [text, setText] = useState(entry.text);
    const [displayName, setDisplayName] = useState(entry.displayName);
    const [keys, setKeys] = useState(entry.keys.join(', '));
    const [searchRange, setSearchRange] = useState(entry.searchRange);
    const [enabled, setEnabled] = useState(entry.enabled);
    const [forceActivation, setForceActivation] = useState(entry.forceActivation);
    const [keyRelative, setKeyRelative] = useState(entry.keyRelative);
    const [nonStoryActivatable, setNonStoryActivatable] = useState(entry.nonStoryActivatable);
    const [hidden, setHidden] = useState(entry.hidden);
    const [categoryId, setCategoryId] = useState(entry.categoryId || 'none');

    // 当 entry 变化时更新状态
    useEffect(() => {
        setText(entry.text);
        setDisplayName(entry.displayName);
        setKeys(entry.keys.join(', '));
        setSearchRange(entry.searchRange);
        setEnabled(entry.enabled);
        setForceActivation(entry.forceActivation);
        setKeyRelative(entry.keyRelative);
        setNonStoryActivatable(entry.nonStoryActivatable);
        setHidden(entry.hidden);
        setCategoryId(entry.categoryId || 'none');
    }, [entry.id]);

    const handleSave = () => {
        onUpdate({
            text,
            displayName,
            keys: keys
                .split(',')
                .map((k: string) => k.trim())
                .filter((k: string) => k.length > 0),
            searchRange,
            enabled,
            forceActivation,
            keyRelative,
            nonStoryActivatable,
            hidden,
            categoryId: categoryId === 'none' ? null : categoryId,
            lastUpdatedAt: Date.now(),
        });
    };

    return (
        <div className='flex flex-col h-full'>
            <div className='flex items-center justify-between border-b pb-4 mb-6'>
                <div>
                    <h2 className='text-2xl font-bold'>{displayName || '编辑条目'}</h2>
                    <p className='text-sm text-muted-foreground mt-1'>修改条目的详细信息</p>
                </div>
                <Button onClick={handleSave} size='lg'>
                    保存更改
                </Button>
            </div>

            <Tabs defaultValue='basic' className='flex-1 overflow-auto'>
                <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='basic'>基础信息</TabsTrigger>
                    <TabsTrigger value='activation'>激活设置</TabsTrigger>
                    <TabsTrigger value='advanced'>高级选项</TabsTrigger>
                </TabsList>

                <TabsContent value='basic' className='mt-6 space-y-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='entry-display-name'>显示名称 *</Label>
                        <Input
                            id='entry-display-name'
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder='条目的显示名称'
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='entry-content'>内容 *</Label>
                        <Textarea
                            id='entry-content'
                            value={text}
                            onChange={e => setText(e.target.value)}
                            rows={12}
                            className='font-mono text-sm'
                            placeholder='输入条目的详细内容...'
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                            <Label htmlFor='entry-category'>分类</Label>
                            <Select value={categoryId} onValueChange={value => setCategoryId(value)}>
                                <SelectTrigger id='entry-category'>
                                    <SelectValue placeholder='选择分类' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='none'>无分类</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='entry-search-range'>搜索范围</Label>
                            <Input
                                id='entry-search-range'
                                type='number'
                                value={searchRange}
                                onChange={e => setSearchRange(Number(e.target.value))}
                                placeholder='1000'
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='activation' className='mt-6 space-y-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='entry-keys'>激活关键字</Label>
                        <Input
                            id='entry-keys'
                            value={keys}
                            onChange={e => setKeys(e.target.value)}
                            placeholder='关键字1, 关键字2, 关键字3'
                        />
                        <p className='text-xs text-muted-foreground'>
                            多个关键字用逗号分隔，用于触发此条目的激活。当文本中包含这些关键字时，条目将被激活。
                        </p>
                    </div>

                    <div className='border rounded-lg p-4 space-y-4'>
                        <h3 className='font-semibold text-sm mb-4'>激活选项</h3>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='entry-enabled' className='cursor-pointer'>
                                        启用
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>是否启用此条目</p>
                                </div>
                                <Switch id='entry-enabled' checked={enabled} onCheckedChange={setEnabled} />
                            </div>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='entry-force-activation' className='cursor-pointer'>
                                        强制激活
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>无论是否匹配关键字都激活</p>
                                </div>
                                <Switch
                                    id='entry-force-activation'
                                    checked={forceActivation}
                                    onCheckedChange={setForceActivation}
                                />
                            </div>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='entry-key-relative' className='cursor-pointer'>
                                        关键字相对
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>关键字相对于当前位置</p>
                                </div>
                                <Switch
                                    id='entry-key-relative'
                                    checked={keyRelative}
                                    onCheckedChange={setKeyRelative}
                                />
                            </div>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='entry-non-story' className='cursor-pointer'>
                                        非故事可激活
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>允许在非故事内容中激活</p>
                                </div>
                                <Switch
                                    id='entry-non-story'
                                    checked={nonStoryActivatable}
                                    onCheckedChange={setNonStoryActivatable}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='advanced' className='mt-6 space-y-6'>
                    <div className='border rounded-lg p-4 space-y-4'>
                        <h3 className='font-semibold text-sm mb-4'>显示选项</h3>
                        <div className='flex items-center justify-between'>
                            <div className='space-y-0.5'>
                                <Label htmlFor='entry-hidden' className='cursor-pointer'>
                                    隐藏
                                </Label>
                                <p className='text-xs text-muted-foreground'>在列表中隐藏此条目</p>
                            </div>
                            <Switch id='entry-hidden' checked={hidden} onCheckedChange={setHidden} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Category 编辑器组件
function CategoryEditor({
    category,
    onUpdate,
}: {
    category: LoreBookCategoryResponseDto;
    onUpdate: (dto: any) => void;
}) {
    const [name, setName] = useState(category.name);
    const [enabled, setEnabled] = useState(category.enabled);
    const [open, setOpen] = useState(category.open);

    // 当 category 变化时更新状态
    useEffect(() => {
        setName(category.name);
        setEnabled(category.enabled);
        setOpen(category.open);
    }, [category.id]);

    const handleSave = () => {
        onUpdate({
            name,
            enabled,
            open,
        });
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between border-b pb-4'>
                <div>
                    <h2 className='text-2xl font-bold'>编辑分类</h2>
                    <p className='text-sm text-muted-foreground mt-1'>修改分类的详细信息</p>
                </div>
                <Button onClick={handleSave} size='lg'>
                    保存更改
                </Button>
            </div>

            <div className='space-y-6'>
                <div className='space-y-2'>
                    <Label htmlFor='category-name'>名称 *</Label>
                    <Input
                        id='category-name'
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder='分类名称'
                    />
                </div>

                <div className='border rounded-lg p-4 space-y-4'>
                    <h3 className='font-semibold text-sm'>选项</h3>
                    <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='category-enabled' className='cursor-pointer'>
                                启用
                            </Label>
                            <Switch id='category-enabled' checked={enabled} onCheckedChange={setEnabled} />
                        </div>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='category-open' className='cursor-pointer'>
                                默认展开
                            </Label>
                            <Switch id='category-open' checked={open} onCheckedChange={setOpen} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
