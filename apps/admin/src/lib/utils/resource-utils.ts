import { ResourceResponseDto } from '@lourd-game/shared';
import { File, Image, Music } from 'lucide-react';

/**
 * 判断资源是否为图片文件
 */
export function isImageFile(resource: ResourceResponseDto): boolean {
    const fileType = resource.fileType?.toLowerCase() || '';
    const src = resource.src.toLowerCase();

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

    return imageExtensions.some(ext => src.endsWith(ext)) || fileType === 'image' || fileType.includes('image');
}

/**
 * 判断资源是否为音频文件
 */
export function isAudioFile(resource: ResourceResponseDto): boolean {
    const fileType = resource.fileType?.toLowerCase() || '';
    const src = resource.src.toLowerCase();

    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];

    return audioExtensions.some(ext => src.endsWith(ext)) || fileType === 'audio' || fileType.includes('audio');
}

/**
 * 获取文件类型图标
 */
export function getFileTypeIcon(resource: ResourceResponseDto) {
    if (isImageFile(resource)) {
        return Image;
    }
    if (isAudioFile(resource)) {
        return Music;
    }
    return File;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
