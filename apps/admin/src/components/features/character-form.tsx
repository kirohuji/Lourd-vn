import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CharacterFormProps {
    characterId: string;
    name: string;
    age: string;
    icon: string;
    color: string;
    enabled: boolean;
    order: string;
    onCharacterIdChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onAgeChange: (value: string) => void;
    onIconChange: (value: string) => void;
    onColorChange: (value: string) => void;
    onEnabledChange: (value: boolean) => void;
    onOrderChange: (value: string) => void;
}

export function CharacterForm({
    characterId,
    name,
    age,
    icon,
    color,
    enabled,
    order,
    onCharacterIdChange,
    onNameChange,
    onAgeChange,
    onIconChange,
    onColorChange,
    onEnabledChange,
    onOrderChange,
}: CharacterFormProps) {
    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                <Label htmlFor='char-id'>ID *</Label>
                <Input
                    id='char-id'
                    value={characterId}
                    onChange={e => onCharacterIdChange(e.target.value)}
                    placeholder='请输入角色 ID'
                />
            </div>
            <div className='space-y-2'>
                <Label htmlFor='char-name'>名称 *</Label>
                <Input id='char-name' value={name} onChange={e => onNameChange(e.target.value)} />
            </div>
            <div className='space-y-2'>
                <Label htmlFor='char-age'>年龄</Label>
                <Input
                    id='char-age'
                    type='number'
                    value={age}
                    onChange={e => onAgeChange(e.target.value)}
                    placeholder='可选'
                />
            </div>
            <div className='space-y-2'>
                <Label htmlFor='char-icon'>头像地址</Label>
                <Input
                    id='char-icon'
                    value={icon}
                    onChange={e => onIconChange(e.target.value)}
                    placeholder='例如 https://xxx/xxx.webp'
                />
            </div>
            <div className='space-y-2'>
                <Label htmlFor='char-color'>主题颜色</Label>
                <div className='flex gap-2'>
                    <Input
                        id='char-color'
                        value={color}
                        onChange={e => onColorChange(e.target.value)}
                        placeholder='#RRGGBB 或 CSS 颜色值'
                    />
                    {color && <div className='h-10 w-10 rounded border' style={{ backgroundColor: color }} />}
                </div>
            </div>
            <div className='flex items-center justify-between'>
                <Label htmlFor='char-enabled'>启用</Label>
                <Switch id='char-enabled' checked={enabled} onCheckedChange={onEnabledChange} />
            </div>
            <div className='space-y-2'>
                <Label htmlFor='char-order'>排序（数字越小越靠前）</Label>
                <Input id='char-order' type='number' value={order} onChange={e => onOrderChange(e.target.value)} />
            </div>
        </div>
    );
}
