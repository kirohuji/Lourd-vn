import { Outlet, useParams } from 'react-router-dom';
import { ChapterSidebar } from './chapter-sidebar';
import { ChapterProperties } from './chapter-properties';
import { ProjectSelector } from './project-selector';
import { useState, useEffect } from 'react';

export function ProjectLayout() {
    const params = useParams<{ projectId?: string; chapterId?: string }>();
    const projectId = params.projectId ? Number(params.projectId) : null;
    const chapterId = params.chapterId ? Number(params.chapterId) : null;
    const [currentProjectId, setCurrentProjectId] = useState<number | null>(projectId);

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
            <div className='flex flex-1 overflow-hidden'>
                {/* 左侧：章节列表 */}
                <ChapterSidebar projectId={projectId} />

                {/* 中间：内容区 */}
                <main className='flex-1 overflow-hidden p-6'>
                    <Outlet />
                </main>

                {/* 右侧：章节属性面板 */}
                {chapterId && !isNaN(chapterId) ? (
                    <ChapterProperties chapterId={chapterId} projectId={projectId} />
                ) : (
                    <div className='flex w-80 items-center justify-center border-l bg-card text-sm text-muted-foreground'>
                        请选择一个章节
                    </div>
                )}
            </div>
        </div>
    );
}

