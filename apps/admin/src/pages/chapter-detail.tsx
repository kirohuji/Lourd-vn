import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import ChapterInkContent from './chapter-ink-content';
import { ChapterResourcesContent } from './chapter-resources-content';

export function ChapterDetailPage() {
    const { chapterId, projectId } = useParams<{ chapterId: string; projectId: string }>();

    if (!chapterId || !projectId) {
        return (
            <div className='flex h-full items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                    <p>章节ID或项目ID无效</p>
                </div>
            </div>
        );
    }

    const chapterIdNum = Number(chapterId);
    if (isNaN(chapterIdNum)) {
        return (
            <div className='flex h-full items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                    <p>无效的章节ID</p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col h-full space-y-4'>
            <Tabs defaultValue='resources' className='w-full flex flex-col flex-1'>
                <TabsList>
                    <TabsTrigger value='resources' className='w-[200px]'>
                        资源
                    </TabsTrigger>
                    <TabsTrigger value='ink' className='w-[200px]'>
                        故事编辑
                    </TabsTrigger>
                </TabsList>
                <TabsContent value='resources' className='mt-4 flex-1 overflow-auto'>
                    <ChapterResourcesContent chapterId={chapterIdNum} />
                </TabsContent>
                <TabsContent value='ink' className='mt-4 flex-1 overflow-auto'>
                    <ChapterInkContent chapterId={chapterIdNum} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
