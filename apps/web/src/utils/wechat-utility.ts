/**
 * 微信小程序/Taro 环境检测工具
 */

// 声明全局类型，用于 Taro 和微信小程序 API
declare const Taro: any;
declare const wx: any;

/**
 * 检测是否在微信小程序环境中
 */
export function isWeChatMiniProgram(): boolean {
    // 检测 Taro 环境
    if (typeof window !== 'undefined' && (window as any).wx) {
        return true;
    }

    // 检测微信小程序环境
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
        return true;
    }

    // 检测 Taro
    if (typeof Taro !== 'undefined') {
        return true;
    }

    return false;
}

/**
 * 检测是否在微信网页环境中
 */
export function isWeChatWeb(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const ua = navigator.userAgent.toLowerCase();
    return /micromessenger/i.test(ua);
}

/**
 * 获取微信小程序登录 code
 * 需要在 Taro 或微信小程序环境中调用
 */
export async function getWeChatMiniProgramCode(): Promise<string> {
    return new Promise((resolve, reject) => {
        // 检测 Taro 环境
        if (typeof Taro !== 'undefined') {
            Taro.login({
                success: (res: { code: string | PromiseLike<string> }) => {
                    if (res.code) {
                        resolve(res.code);
                    } else {
                        reject(new Error('获取微信登录 code 失败'));
                    }
                },
                fail: (err: { errMsg: any }) => {
                    reject(new Error(`微信登录失败: ${err.errMsg || '未知错误'}`));
                },
            });
            return;
        }

        // 检测原生微信小程序环境
        if (typeof wx !== 'undefined' && wx.login) {
            wx.login({
                success: (res: { code: string | PromiseLike<string> }) => {
                    if (res.code) {
                        resolve(res.code);
                    } else {
                        reject(new Error('获取微信登录 code 失败'));
                    }
                },
                fail: (err: { errMsg: any }) => {
                    reject(new Error(`微信登录失败: ${err.errMsg || '未知错误'}`));
                },
            });
            return;
        }

        reject(new Error('不在微信小程序环境中'));
    });
}

/**
 * 获取微信网页授权 code
 * 需要在微信网页环境中，通过 URL 参数获取
 */
export function getWeChatWebCode(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}
