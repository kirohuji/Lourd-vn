import { useEffect, useState } from 'react';
import { isMobileDevice } from '../utils/device-utility';

/**
 * Hook 用于响应式检测是否为移动设备
 * 会在窗口大小变化时重新检测
 */
export default function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() => isMobileDevice());

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(isMobileDevice());
        };

        window.addEventListener('resize', handleResize);
        // 监听方向变化（移动设备）
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return isMobile;
}
