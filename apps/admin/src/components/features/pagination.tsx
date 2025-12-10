import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className='flex items-center justify-center gap-4'>
            <Button variant='outline' disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                <ChevronLeft className='mr-2 h-4 w-4' />
                上一页
            </Button>
            <span className='text-sm text-muted-foreground'>
                第 {page} 页 / 共 {totalPages} 页 (总计 {total} 项)
            </span>
            <Button variant='outline' disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
                下一页
                <ChevronRight className='ml-2 h-4 w-4' />
            </Button>
        </div>
    );
}

