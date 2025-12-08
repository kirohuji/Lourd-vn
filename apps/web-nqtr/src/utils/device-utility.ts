/**
 * 设备检测工具函数
 */

/**
 * 判断是否为移动设备
 * 通过 User-Agent 和屏幕尺寸判断
 */
export function isMobileDevice(): boolean {
    // 检查 User-Agent
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUA = mobileRegex.test(userAgent.toLowerCase());

    // 检查屏幕尺寸和宽高比（移动设备通常是竖屏，宽度较小）
    const isMobileSize =
        window.innerWidth <= 768 || (window.innerWidth < window.innerHeight && window.innerWidth <= 1024);

    // 检查触摸支持
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 如果满足多个条件，则认为是移动设备
    return isMobileUA || (isMobileSize && hasTouchScreen);
}

/**
 * 获取适合当前设备的画布尺寸
 * 移动端强制使用竖屏尺寸（即使设备旋转到横屏）
 * @returns { width: number, height: number }
 */
export function getCanvasDimensions(): { width: number; height: number } {
    if (isMobileDevice()) {
        // 移动设备：强制竖屏模式
        // 始终使用较小的尺寸作为宽度，较大的尺寸作为高度（确保竖屏）
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // 如果当前是横屏（宽度大于高度），交换它们以强制竖屏
        if (screenWidth > screenHeight) {
            return {
                width: screenHeight,
                height: screenWidth,
            };
        }

        // 已经是竖屏，直接使用
        return {
            width: screenWidth,
            height: screenHeight,
        };
    } else {
        // 桌面设备：使用固定的横屏尺寸
        return {
            width: 1920,
            height: 1080,
        };
    }
}
