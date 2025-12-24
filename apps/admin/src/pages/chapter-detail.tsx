import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useSearchParams } from 'react-router-dom';
import ChapterInkContent from './chapter-ink-content';
import { ChapterResourcesContent } from './chapter-resources-content';

export function ChapterDetailPage() {
    const { chapterId, projectId } = useParams<{ chapterId: string; projectId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

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

    // 从 URL 查询参数获取当前 tab，默认为 'resources'
    const currentTab = searchParams.get('tab') || 'resources';
    const validTabs = ['resources', 'ink'];
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'resources';

    // 处理 tab 切换
    const handleTabChange = (value: string) => {
        const newSearchParams = new URLSearchParams(searchParams);
        if (value === 'resources') {
            // 如果切换到 resources，移除 tab 参数（使用默认值）
            newSearchParams.delete('tab');
        } else {
            newSearchParams.set('tab', value);
        }
        setSearchParams(newSearchParams, { replace: true });
    };

    return (
        <div className='flex flex-col h-full space-y-4'>
            <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full flex flex-col flex-1'>
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
