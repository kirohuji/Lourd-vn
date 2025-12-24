import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ChapterProperties } from './chapter-properties';
import { ChapterSidebar } from './chapter-sidebar';
import { ProjectSelector } from './project-selector';

export function ProjectLayout() {
    const params = useParams<{ projectId?: string; chapterId?: string }>();
    const projectId = params.projectId ? Number(params.projectId) : null;
    const chapterId = params.chapterId ? Number(params.chapterId) : null;
    const [currentProjectId, setCurrentProjectId] = useState<number | null>(projectId);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

    useEffect(() => {
        if (projectId) {
            setCurrentProjectId(projectId);
        }
    }, [projectId]);

    if (!projectId || isNaN(projectId)) {
        return (
            <div className='flex h-screen items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                    <p>请先选择一个项目</p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex h-screen flex-col'>
            {/* 顶部：项目选择器 */}
            <ProjectSelector
                currentProjectId={currentProjectId}
                onProjectChange={setCurrentProjectId}
                showExitButton={true}
            />

            {/* 三栏布局 */}
            <div className='relative flex flex-1 overflow-hidden'>
                {/* 左侧：章节列表 */}
                <div
                    className={cn(
                        'relative transition-all duration-300 ease-in-out overflow-hidden',
                        leftSidebarOpen ? 'w-64' : 'w-0',
                    )}
                >
                    <div
                        className={cn(
                            'h-full transition-all duration-300 ease-in-out',
                            leftSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
                        )}
                    >
                        <ChapterSidebar projectId={projectId} />
                    </div>
                </div>
                {/* 左侧抽屉切换按钮 - 始终可见，位置固定，保持打开时的方向（右半圆） */}
                <Button
                    variant='outline'
                    size='icon'
                    className={cn(
                        'absolute top-1/2 z-50 h-12 w-6 -translate-y-1/2 rounded-r-full rounded-l-none border-l-0 shadow-md transition-all bg-background hover:bg-accent',
                        leftSidebarOpen ? 'left-64' : 'left-0',
                    )}
                    onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                >
                    {leftSidebarOpen ? <ChevronLeft className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                </Button>

                {/* 中间：内容区 */}
                <main className='flex-1 overflow-auto p-6'>{<Outlet />}</main>

                {/* 右侧：章节属性面板 */}
                <div
                    className={cn(
                        'relative transition-all duration-300 ease-in-out overflow-hidden',
                        rightSidebarOpen ? 'w-80' : 'w-0',
                    )}
                >
                    {chapterId && !isNaN(chapterId) ? (
                        <div
                            className={cn(
                                'h-full transition-all duration-300 ease-in-out',
                                rightSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
                            )}
                        >
                            <ChapterProperties chapterId={chapterId} projectId={projectId} />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'flex h-full w-80 items-center justify-center border-l bg-card text-sm text-muted-foreground transition-all duration-300 ease-in-out',
                                rightSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
                            )}
                        >
                            请选择一个章节
                        </div>
                    )}
                </div>
                {/* 右侧抽屉切换按钮 - 始终可见，位置固定，保持打开时的方向（左半圆） */}
                {chapterId && !isNaN(chapterId) && (
                    <Button
                        variant='outline'
                        size='icon'
                        className={cn(
                            'absolute top-1/2 z-50 h-12 w-6 -translate-y-1/2 rounded-l-full rounded-r-none border-r-0 shadow-md transition-all bg-background hover:bg-accent',
                            rightSidebarOpen ? 'right-80' : 'right-0',
                        )}
                        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                    >
                        {rightSidebarOpen ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
                    </Button>
                )}
            </div>
        </div>
    );
}
