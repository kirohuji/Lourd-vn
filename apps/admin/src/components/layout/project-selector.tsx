import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/lib/hooks/use-projects';
import { Folder, LogOut, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectSelectorProps {
    currentProjectId: number | null;
    onProjectChange: (projectId: number | null) => void;
    showExitButton?: boolean;
}

export function ProjectSelector({ currentProjectId, onProjectChange, showExitButton = true }: ProjectSelectorProps) {
    const navigate = useNavigate();
    const { data: projectsData } = useProjects({ page: 1, limit: 100 });
    const projects = projectsData?.data || [];

    const currentProject = useMemo(
        () => (currentProjectId ? projects.find(p => p.id === currentProjectId) : null),
        [projects, currentProjectId],
    );

    const handleProjectChange = (value: string) => {
        if (value === 'list') {
            navigate('/admin/projects');
            onProjectChange(null);
        } else {
            const id = Number(value);
            if (id && !isNaN(id)) {
                // 导航到项目的第一个章节（如果有）
                navigate(`/admin/projects/${id}/chapters`);
                onProjectChange(id);
            }
        }
    };

    const handleExitProject = () => {
        navigate('/admin/projects');
        onProjectChange(null);
    };

    return (
        <div className='flex h-16 items-center justify-between border-b bg-card px-6'>
            <div className='flex items-center gap-4'>
                <h2 className='text-lg font-semibold'>管理后台</h2>
                {projects.length > 0 && (
                    <div className='flex items-center gap-2'>
                        <Select value={currentProjectId?.toString() || 'list'} onValueChange={handleProjectChange}>
                            <SelectTrigger className='h-9 w-64'>
                                <div className='flex items-center gap-2'>
                                    <Folder className='h-4 w-4 shrink-0' />
                                    <SelectValue placeholder='选择项目'>
                                        {currentProject ? currentProject.name : '项目列表'}
                                    </SelectValue>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='list'>
                                    <div className='flex items-center gap-2'>
                                        <Settings className='h-4 w-4' />
                                        <span>项目列表</span>
                                    </div>
                                </SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                        <div className='flex items-center gap-2'>
                                            <Folder className='h-4 w-4' />
                                            <span className='truncate'>{project.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            {showExitButton && currentProjectId && (
                <Button variant='outline' size='sm' onClick={handleExitProject}>
                    <LogOut className='mr-2 h-4 w-4' />
                    退出项目
                </Button>
            )}
        </div>
    );
}
