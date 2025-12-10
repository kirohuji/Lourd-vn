import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SearchBar({ placeholder = '搜索...', value, onChange, className }: SearchBarProps) {
    return (
        <div className={`relative ${className || ''}`}>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className='pl-9' />
        </div>
    );
}
