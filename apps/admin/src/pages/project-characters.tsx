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
import { useCharacters } from '@/lib/hooks/use-characters';
import { apiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CharacterConfig } from '@lourd-game/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function ProjectCharactersPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = projectId ? Number(projectId) : 0;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [characterToRemove, setCharacterToRemove] = useState<CharacterConfig | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 获取项目使用的角色
    const { data: projectCharactersData, isLoading: isLoadingProjectCharacters } = useQuery({
        queryKey: ['project-characters', projectIdNum],
        queryFn: () => apiClient.getProjectCharacters(projectIdNum),
        enabled: !!projectIdNum,
    });

    const projectCharacters = projectCharactersData?.data || [];

    // 获取所有可用角色
    const { data: allCharactersData, isLoading: isLoadingAllCharacters } = useCharacters();
    const allCharacters = allCharactersData?.data || [];

    // 过滤出未添加到项目的角色
    const availableCharacters = allCharacters.filter(
        char => !projectCharacters.some(pc => pc.id === char.id)
    );

    const addCharacterMutation = useMutation({
        mutationFn: (characterId: string) => apiClient.addCharacterToProject(projectIdNum, characterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-characters', projectIdNum] });
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            toast({
                title: '成功',
                description: '角色已添加到项目',
            });
            setAddDialogOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: '错误',
                description: error.message || '添加角色失败',
                variant: 'destructive',
            });
        },
    });

    const removeCharacterMutation = useMutation({
        mutationFn: (characterId: string) => apiClient.removeCharacterFromProject(projectIdNum, characterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-characters', projectIdNum] });
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            toast({
                title: '成功',
                description: '角色已从项目移除',
            });
            setRemoveConfirmOpen(false);
            setCharacterToRemove(null);
        },
        onError: (error: any) => {
            toast({
                title: '错误',
                description: error.message || '移除角色失败',
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
                <h1 className="text-2xl font-bold">项目角色视图</h1>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加角色
                </Button>
            </div>

            {isLoadingProjectCharacters ? (
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
                                <TableHead>年龄</TableHead>
                                <TableHead>启用</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectCharacters.length > 0 ? (
                                projectCharacters.map((character) => (
                                    <TableRow key={character.id}>
                                        <TableCell className="font-medium">{character.id}</TableCell>
                                        <TableCell>{character.name}</TableCell>
                                        <TableCell>{character.age || '-'}</TableCell>
                                        <TableCell>{character.enabled ? '是' : '否'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setCharacterToRemove(character);
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
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        暂无角色
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* 添加角色对话框 */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>添加角色到项目</DialogTitle>
                        <DialogDescription>从全局角色池中选择角色添加到当前项目</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        {isLoadingAllCharacters ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>名称</TableHead>
                                        <TableHead>年龄</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableCharacters.length > 0 ? (
                                        availableCharacters.map((character) => (
                                            <TableRow key={character.id}>
                                                <TableCell className="font-medium">{character.id}</TableCell>
                                                <TableCell>{character.name}</TableCell>
                                                <TableCell>{character.age || '-'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addCharacterMutation.mutate(character.id)}
                                                        disabled={addCharacterMutation.isPending}
                                                    >
                                                        {addCharacterMutation.isPending ? (
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
                                                所有角色已添加到项目
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
            {characterToRemove && (
                <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认移除</DialogTitle>
                            <DialogDescription>
                                确定要从项目中移除角色 "{characterToRemove.name}" 吗？这不会删除角色本身，只是移除项目与角色的关联。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>
                                取消
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => removeCharacterMutation.mutate(characterToRemove.id)}
                                disabled={removeCharacterMutation.isPending}
                            >
                                {removeCharacterMutation.isPending ? (
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

