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
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
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
    const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<LoreBookCategoryResponseDto | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();
    const { data: categories = [], isLoading: isLoadingCategories } = useLoreBookCategories();
    // 始终获取所有条目，以便按分类分组显示
    const { data: entries = [] } = useLoreBookEntries();

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
        if (!categoryId) {
            // 如果没有分类，返回所有没有分类的条目
            return entries.filter(e => !e.categoryId);
        }

        // 先过滤出属于该分类的条目
        const categoryEntries = entries.filter(e => e.categoryId === categoryId);

        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.order || category.order.length === 0) {
            return categoryEntries;
        }

        const orderedEntries: LoreBookEntryResponseDto[] = [];
        const entryMap = new Map(categoryEntries.map(e => [e.id, e]));

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
        } else {
            newExpanded.add(categoryId);
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
        const dto: CreateLoreBookEntryDto = {
            text: '',
            displayName: '新条目',
            keys: [],
            categoryId: categoryId || selectedCategoryId || undefined,
            lastUpdatedAt: Date.now(),
        };

        createEntry.mutate(dto, {
            onSuccess: data => {
                toast({ title: '成功', description: '条目创建成功' });
                setSelectedEntryId(data.id);
                if (data.categoryId) {
                    setSelectedCategoryId(data.categoryId);
                    // 确保分类展开（仅前端状态）
                    const catId = data.categoryId;
                    if (catId && !expandedCategories.has(catId)) {
                        setExpandedCategories(prev => new Set(prev).add(catId));
                    }
                }
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

    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryEnabled, setEditCategoryEnabled] = useState(true);
    const [editCategoryOpen, setEditCategoryOpen] = useState(true);
    const [editCategoryCreateSubcontext, setEditCategoryCreateSubcontext] = useState(false);
    const [editCategoryUseDefaults, setEditCategoryUseDefaults] = useState(false);

    const handleEditCategory = (category: LoreBookCategoryResponseDto) => {
        setEditingCategory(category);
        setEditCategoryName(category.name);
        setEditCategoryEnabled(category.enabled);
        setEditCategoryOpen(category.open);
        setEditCategoryCreateSubcontext(category.createSubcontext);
        setEditCategoryUseDefaults(category.useCategoryDefaults);
        setEditCategoryDialogOpen(true);
    };

    const handleSaveEditCategory = () => {
        if (!editingCategory || !editCategoryName.trim()) {
            toast({
                title: '错误',
                description: '请输入分类名称',
                variant: 'destructive',
            });
            return;
        }

        updateCategory.mutate(
            {
                id: editingCategory.id,
                dto: {
                    name: editCategoryName.trim(),
                    enabled: editCategoryEnabled,
                    open: editCategoryOpen,
                    createSubcontext: editCategoryCreateSubcontext,
                    useCategoryDefaults: editCategoryUseDefaults,
                },
            },
            {
                onSuccess: () => {
                    toast({ title: '成功', description: '分类更新成功' });
                    setEditCategoryDialogOpen(false);
                    setEditingCategory(null);
                    setEditCategoryName('');
                },
                onError: (error: any) => {
                    toast({
                        title: '更新失败',
                        description: error.message || '更新分类失败',
                        variant: 'destructive',
                    });
                },
            },
        );
    };

    const handleDeleteCategory = (category: LoreBookCategoryResponseDto) => {
        setDeleteType('category');
        setItemToDelete({ id: category.id, name: category.name });
        setDeleteConfirmOpen(true);
    };

    // const handleDeleteEntry = (entry: LoreBookEntryResponseDto) => {
    //     setDeleteType('entry');
    //     setItemToDelete({ id: entry.id, name: entry.displayName });
    //     setDeleteConfirmOpen(true);
    // };

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
                <div className='col-span-3 border rounded-lg p-4 flex flex-col min-h-0 bg-card'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='font-semibold text-lg'>Categories</div>
                        <Button size='sm' variant='outline' onClick={handleCreateCategory}>
                            <Plus className='mr-2 h-4 w-4' />
                            分类
                        </Button>
                    </div>

                    {/* 搜索框 */}
                    <div className='mb-3'>
                        <div className='relative'>
                            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                            <Input
                                placeholder='Search entries...'
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
                    ) : categories.length === 0 ? (
                        <div className='text-sm text-muted-foreground text-center flex-1 flex items-center justify-center'>
                            {searchQuery ? '未找到匹配的条目' : '暂无分类'}
                        </div>
                    ) : (
                        <div className='space-y-3 overflow-auto flex-1 pr-1'>
                            {/* 显示所有分类及其条目 */}
                            {categories.map(category => {
                                const isExpanded = expandedCategories.has(category.id);
                                const categoryEntries = searchQuery
                                    ? filteredEntries.filter(e => e.categoryId === category.id)
                                    : sortedEntries(category.id);
                                const isSelected = selectedCategoryId === category.id;

                                return (
                                    <div key={category.id} className='pb-4 border-b border-border mb-4'>
                                        {/* Category Header */}
                                        <div className='flex items-center justify-between mb-2 px-1'>
                                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                                                <h3
                                                    className={`font-semibold text-base truncate cursor-pointer ${
                                                        isSelected ? 'text-primary' : ''
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedCategoryId(category.id);
                                                        setSelectedEntryId(null);
                                                        // 展开当前分类，关闭其他分类
                                                        setExpandedCategories(new Set([category.id]));
                                                    }}
                                                >
                                                    {category.name}
                                                </h3>
                                                <span className='text-xs text-muted-foreground'>
                                                    {categoryEntries.length} entries
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6 text-muted-foreground hover:text-destructive'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleDeleteCategory(category);
                                                    }}
                                                >
                                                    <Trash2 className='h-3.5 w-3.5' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6 text-muted-foreground'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleEditCategory(category);
                                                    }}
                                                >
                                                    <Edit className='h-3.5 w-3.5' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6 text-muted-foreground'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleCreateEntry(category.id);
                                                    }}
                                                >
                                                    <Plus className='h-3.5 w-3.5' />
                                                </Button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleToggleCategory(category.id);
                                                    }}
                                                    className='p-1 hover:bg-accent rounded transition-colors shrink-0'
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className='h-4 w-4 text-muted-foreground' />
                                                    ) : (
                                                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Category Entries */}
                                        {isExpanded && categoryEntries.length > 0 && (
                                            <div className='space-y-1 pl-6'>
                                                {categoryEntries.map(entry => {
                                                    const isEntrySelected = selectedEntryId === entry.id;
                                                    const description =
                                                        entry.keys && entry.keys.length > 0
                                                            ? entry.keys.join(', ')
                                                            : '';
                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className={`group/entry relative px-3 py-2 rounded cursor-pointer transition-colors ${
                                                                isEntrySelected
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'hover:bg-muted/50'
                                                            }`}
                                                            onClick={() => {
                                                                setSelectedEntryId(entry.id);
                                                                setSelectedCategoryId(category.id);
                                                            }}
                                                        >
                                                            <div className='flex flex-col gap-0.5'>
                                                                <div className='flex items-center justify-between'>
                                                                    <span
                                                                        className={`text-sm font-medium ${
                                                                            isEntrySelected ? 'text-primary' : ''
                                                                        }`}
                                                                    >
                                                                        {entry.displayName}
                                                                    </span>
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        className='h-5 w-5 opacity-0 group-hover/entry:opacity-100 transition-opacity text-muted-foreground hover:text-destructive'
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            setDeleteType('entry');
                                                                            setItemToDelete({
                                                                                id: entry.id,
                                                                                name: entry.displayName,
                                                                            });
                                                                            setDeleteConfirmOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className='h-3 w-3' />
                                                                    </Button>
                                                                </div>
                                                                {description && (
                                                                    <span className='text-xs text-muted-foreground'>
                                                                        {description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* 显示未分类的条目 */}
                            {(() => {
                                const uncategorizedEntries = searchQuery
                                    ? filteredEntries.filter(e => !e.categoryId)
                                    : entries.filter(e => !e.categoryId);

                                if (uncategorizedEntries.length === 0) return null;

                                const isExpanded = expandedCategories.has('__uncategorized__');
                                const isSelected = selectedCategoryId === null;

                                return (
                                    <div className='pb-4 border-b border-border mb-4'>
                                        {/* 未分类 Header */}
                                        <div className='flex items-center justify-between mb-2 px-1'>
                                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                                                <h3
                                                    className={`font-semibold text-base truncate cursor-pointer ${
                                                        isSelected ? 'text-primary' : ''
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedCategoryId(null);
                                                        setSelectedEntryId(null);
                                                        // 展开未分类，关闭其他分类
                                                        setExpandedCategories(new Set(['__uncategorized__']));
                                                    }}
                                                >
                                                    未分类
                                                </h3>
                                                <span className='text-xs text-muted-foreground'>
                                                    {uncategorizedEntries.length} entries
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6 text-muted-foreground'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleCreateEntry();
                                                    }}
                                                >
                                                    <Plus className='h-3.5 w-3.5' />
                                                </Button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const newExpanded = new Set(expandedCategories);
                                                        if (newExpanded.has('__uncategorized__')) {
                                                            newExpanded.delete('__uncategorized__');
                                                        } else {
                                                            newExpanded.add('__uncategorized__');
                                                        }
                                                        setExpandedCategories(newExpanded);
                                                    }}
                                                    className='p-1 hover:bg-accent rounded transition-colors shrink-0'
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className='h-4 w-4 text-muted-foreground' />
                                                    ) : (
                                                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 未分类条目 */}
                                        {isExpanded && uncategorizedEntries.length > 0 && (
                                            <div className='space-y-1 pl-6'>
                                                {uncategorizedEntries.map(entry => {
                                                    const isEntrySelected = selectedEntryId === entry.id;
                                                    const description =
                                                        entry.keys && entry.keys.length > 0
                                                            ? entry.keys.join(', ')
                                                            : '';
                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className={`group/entry relative px-3 py-2 rounded cursor-pointer transition-colors ${
                                                                isEntrySelected
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'hover:bg-muted/50'
                                                            }`}
                                                            onClick={() => {
                                                                setSelectedEntryId(entry.id);
                                                                setSelectedCategoryId(null);
                                                            }}
                                                        >
                                                            <div className='flex flex-col gap-0.5'>
                                                                <div className='flex items-center justify-between'>
                                                                    <span
                                                                        className={`text-sm font-medium ${
                                                                            isEntrySelected ? 'text-primary' : ''
                                                                        }`}
                                                                    >
                                                                        {entry.displayName}
                                                                    </span>
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        className='h-5 w-5 opacity-0 group-hover/entry:opacity-100 transition-opacity text-muted-foreground hover:text-destructive'
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            setDeleteType('entry');
                                                                            setItemToDelete({
                                                                                id: entry.id,
                                                                                name: entry.displayName,
                                                                            });
                                                                            setDeleteConfirmOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className='h-3 w-3' />
                                                                    </Button>
                                                                </div>
                                                                {description && (
                                                                    <span className='text-xs text-muted-foreground'>
                                                                        {description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* 右侧：编辑面板 */}
                <div className='col-span-9 border rounded-lg p-6 flex flex-col min-h-0 overflow-auto bg-card'>
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

            {/* 编辑分类对话框 */}
            <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
                <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>编辑分类</DialogTitle>
                        <DialogDescription>修改分类的配置信息</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-6 py-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='edit-category-name'>分类名称 *</Label>
                            <Input
                                id='edit-category-name'
                                value={editCategoryName}
                                onChange={e => setEditCategoryName(e.target.value)}
                                placeholder='请输入分类名称'
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleSaveEditCategory();
                                    }
                                    if (e.key === 'Escape') {
                                        setEditCategoryDialogOpen(false);
                                    }
                                }}
                            />
                        </div>

                        <div className='border rounded-lg p-4 space-y-4'>
                            <h3 className='font-semibold text-sm mb-4'>基本选项</h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label htmlFor='edit-category-enabled' className='cursor-pointer'>
                                            启用
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>是否启用此分类</p>
                                    </div>
                                    <Switch
                                        id='edit-category-enabled'
                                        checked={editCategoryEnabled}
                                        onCheckedChange={setEditCategoryEnabled}
                                    />
                                </div>
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label htmlFor='edit-category-open' className='cursor-pointer'>
                                            默认展开
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>分类是否默认展开显示条目</p>
                                    </div>
                                    <Switch
                                        id='edit-category-open'
                                        checked={editCategoryOpen}
                                        onCheckedChange={setEditCategoryOpen}
                                    />
                                </div>
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label htmlFor='edit-category-subcontext' className='cursor-pointer'>
                                            创建子上下文
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>为分类创建独立的子上下文</p>
                                    </div>
                                    <Switch
                                        id='edit-category-subcontext'
                                        checked={editCategoryCreateSubcontext}
                                        onCheckedChange={setEditCategoryCreateSubcontext}
                                    />
                                </div>
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label htmlFor='edit-category-defaults' className='cursor-pointer'>
                                            使用分类默认值
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>新条目使用分类的默认配置</p>
                                    </div>
                                    <Switch
                                        id='edit-category-defaults'
                                        checked={editCategoryUseDefaults}
                                        onCheckedChange={setEditCategoryUseDefaults}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => {
                                setEditCategoryDialogOpen(false);
                                setEditingCategory(null);
                                setEditCategoryName('');
                            }}
                        >
                            取消
                        </Button>
                        <Button onClick={handleSaveEditCategory}>保存</Button>
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
    const [generationType, setGenerationType] = useState<string>((entry.generationType as string) || 'none');
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
        setGenerationType((entry.generationType as string) || 'none');
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
            generationType: generationType === 'none' ? null : generationType,
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

    const [isEditingName, setIsEditingName] = useState(false);

    return (
        <div className='flex flex-col h-full min-w-0'>
            <div className='flex items-center justify-between border-b pb-4 mb-6 shrink-0'>
                <div className='min-w-0 flex-1 pr-4'>
                    {isEditingName ? (
                        <Input
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    setIsEditingName(false);
                                }
                                if (e.key === 'Escape') {
                                    setDisplayName(entry.displayName);
                                    setIsEditingName(false);
                                }
                            }}
                            className='text-2xl font-bold h-auto py-1 px-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
                            autoFocus
                        />
                    ) : (
                        <h2
                            className='text-2xl font-bold truncate cursor-text hover:text-primary transition-colors'
                            onClick={() => setIsEditingName(true)}
                            title='点击编辑名称'
                        >
                            {displayName || '编辑条目'}
                        </h2>
                    )}
                    <p className='text-sm text-muted-foreground mt-1'>修改条目的详细信息</p>
                </div>
                <Button onClick={handleSave} size='lg' className='shrink-0'>
                    保存更改
                </Button>
            </div>

            <Tabs defaultValue='basic' className='flex-1 min-h-0 flex flex-col'>
                <TabsList className='grid w-full grid-cols-3 shrink-0'>
                    <TabsTrigger value='basic'>基础信息</TabsTrigger>
                    <TabsTrigger value='activation'>激活设置</TabsTrigger>
                    <TabsTrigger value='advanced'>高级选项</TabsTrigger>
                </TabsList>

                <TabsContent value='basic' className='mt-6 space-y-6 flex-1 overflow-auto min-h-0'>
                    <div className='space-y-4 pr-2'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2 min-w-0 ml-1'>
                                <Label htmlFor='entry-generation-type'>Generation Type</Label>
                                <Select value={generationType} onValueChange={value => setGenerationType(value)}>
                                    <SelectTrigger id='entry-generation-type' className='w-full'>
                                        <SelectValue placeholder='选择类型' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='none'>未设置</SelectItem>
                                        <SelectItem value='General'>General</SelectItem>
                                        <SelectItem value='Person'>Person</SelectItem>
                                        <SelectItem value='Place'>Place</SelectItem>
                                        <SelectItem value='Thing'>Thing</SelectItem>
                                        <SelectItem value='Life'>Life</SelectItem>
                                        <SelectItem value='Faction'>Faction</SelectItem>
                                        <SelectItem value='Role'>Role</SelectItem>
                                        <SelectItem value='Concept'>Concept</SelectItem>
                                        <SelectItem value='History'>History</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2 min-w-0'>
                                <Label htmlFor='entry-category'>分类</Label>
                                <Select value={categoryId} onValueChange={value => setCategoryId(value)}>
                                    <SelectTrigger id='entry-category' className='w-full'>
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

                        <div className='space-y-2 ml-1'>
                            <Label htmlFor='entry-content'>Entry Text *</Label>
                            <p className='text-xs text-muted-foreground'>
                                The following text will be referenced when the Keys are activated.
                            </p>
                            <div data-color-mode='light' className='w-full'>
                                <MDEditor
                                    value={text}
                                    onChange={(value?: string) => setText(value || '')}
                                    preview='edit'
                                    hideToolbar={false}
                                    visibleDragbar={false}
                                    height={400}
                                    textareaProps={{
                                        placeholder: '输入条目的详细内容...',
                                        style: { fontSize: 14 },
                                    }}
                                />
                            </div>
                        </div>

                        <div className='space-y-2 ml-1'>
                            <Label htmlFor='entry-search-range'>搜索范围</Label>
                            <Input
                                id='entry-search-range'
                                type='number'
                                value={searchRange}
                                onChange={e => setSearchRange(Number(e.target.value))}
                                placeholder='1000'
                                className='w-full max-w-full'
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='activation' className='mt-6 space-y-6 flex-1 overflow-auto min-h-0'>
                    <div className='space-y-4 pr-2'>
                        <div className='space-y-2'>
                            <Label htmlFor='entry-keys'>激活关键字</Label>
                            <Input
                                id='entry-keys'
                                value={keys}
                                onChange={e => setKeys(e.target.value)}
                                placeholder='关键字1, 关键字2, 关键字3'
                                className='w-full max-w-full'
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
                    </div>
                </TabsContent>

                <TabsContent value='advanced' className='mt-6 space-y-6 flex-1 overflow-auto min-h-0'>
                    <div className='space-y-4 pr-2'>
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
