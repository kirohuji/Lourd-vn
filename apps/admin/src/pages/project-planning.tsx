import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useProjectPlanning, useUpdateProjectPlanning } from '@/lib/hooks/use-projects';
import { UpdateProjectPlanningDto } from '@lourd-game/shared';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function ProjectPlanningPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = projectId ? Number(projectId) : 0;

    // 策划相关状态
    const [planningTheme, setPlanningTheme] = useState('');
    const [planningConcept, setPlanningConcept] = useState('');
    const [planningType, setPlanningType] = useState('');
    const [planningStyle, setPlanningStyle] = useState('');
    const [planningTargetAudience, setPlanningTargetAudience] = useState('');
    const [planningStoryOutline, setPlanningStoryOutline] = useState('');

    const { toast } = useToast();
    const { data: planningData, isLoading, refetch } = useProjectPlanning(projectIdNum);
    const updatePlanning = useUpdateProjectPlanning();

    // 当策划数据加载时，填充表单
    useEffect(() => {
        if (planningData) {
            setPlanningTheme(planningData.theme || '');
            setPlanningConcept(planningData.concept || '');
            setPlanningType(planningData.type || '');
            setPlanningStyle(planningData.style || '');
            setPlanningTargetAudience(planningData.targetAudience || '');
            setPlanningStoryOutline(planningData.storyOutline || '');
        } else {
            // 如果没有策划数据，清空表单
            setPlanningTheme('');
            setPlanningConcept('');
            setPlanningType('');
            setPlanningStyle('');
            setPlanningTargetAudience('');
            setPlanningStoryOutline('');
        }
    }, [planningData]);

    if (!projectId || isNaN(projectIdNum)) {
        return <div className='p-4 text-center text-muted-foreground'>请先选择一个项目</div>;
    }

    const handleSave = async () => {
        try {
            const dto: UpdateProjectPlanningDto = {
                theme: planningTheme || undefined,
                concept: planningConcept || undefined,
                type: planningType || undefined,
                style: planningStyle || undefined,
                targetAudience: planningTargetAudience || undefined,
                storyOutline: planningStoryOutline || undefined,
            };
            await updatePlanning.mutateAsync({
                projectId: projectIdNum,
                dto,
            });
            toast({
                title: '成功',
                description: '项目策划已保存',
            });
            await refetch();
        } catch (error: any) {
            toast({
                title: '保存失败',
                description: error?.message || '保存项目策划失败',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
        );
    }

    return (
        <div className='space-y-6 p-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>项目策划</h1>
                    <p className='text-sm text-muted-foreground mt-1'>项目 ID: {projectId}</p>
                </div>
                <Button onClick={handleSave} disabled={updatePlanning.isPending}>
                    {updatePlanning.isPending ? (
                        <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            保存中...
                        </>
                    ) : (
                        '保存策划'
                    )}
                </Button>
            </div>

            <div className='space-y-6'>
                <div className='space-y-2'>
                    <Label htmlFor='planning-theme'>主题</Label>
                    <Textarea
                        id='planning-theme'
                        value={planningTheme}
                        onChange={e => setPlanningTheme(e.target.value)}
                        placeholder='故事想表达的核心思想，如"青春成长"、"人生抉择"'
                        rows={2}
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='planning-concept'>立意</Label>
                    <Textarea
                        id='planning-concept'
                        value={planningConcept}
                        onChange={e => setPlanningConcept(e.target.value)}
                        placeholder='希望玩家在故事结束时的思考或情感，如"珍惜眼前"'
                        rows={2}
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='planning-type'>类型</Label>
                    <Input
                        id='planning-type'
                        value={planningType}
                        onChange={e => setPlanningType(e.target.value)}
                        placeholder='校园、悬疑、恋爱、人生、科幻、幻想等'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='planning-style'>风格</Label>
                    <Input
                        id='planning-style'
                        value={planningStyle}
                        onChange={e => setPlanningStyle(e.target.value)}
                        placeholder='日漫风、写实风、卡通风、低饱和或鲜艳色彩等'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='planning-audience'>受众</Label>
                    <Textarea
                        id='planning-audience'
                        value={planningTargetAudience}
                        onChange={e => setPlanningTargetAudience(e.target.value)}
                        placeholder='玩家群体年龄、兴趣、游戏难度和阅读量'
                        rows={3}
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='planning-outline'>故事大纲</Label>
                    <div data-color-mode='light' className='w-full'>
                        <MDEditor
                            value={planningStoryOutline}
                            onChange={(value?: string) => setPlanningStoryOutline(value || '')}
                            preview='edit'
                            hideToolbar={false}
                            visibleDragbar={false}
                            height={500}
                            textareaProps={{
                                placeholder: '输入故事大纲，包括主线剧情、分支设定、节奏把握等（支持 Markdown）',
                                style: { fontSize: 14 },
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

