/**
 * 微信小程序音频 polyfill
 * 为 HTMLAudioElement.prototype 添加 canPlayType 方法
 * 参考 config/pollyfill.ts 的方式
 */

// canPlayType polyfill 函数
const canPlayTypePolyfill = (mimeType: string): string => {
  // 微信小程序支持的音频格式
  const supportedFormats = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
  ];
  const normalizedType = mimeType.toLowerCase();

  if (supportedFormats.some((format) => normalizedType.includes(format))) {
    return "probably";
  }

  return "";
};

// 在模块加载时立即执行，为 HTMLAudioElement.prototype 添加 canPlayType 方法
if (typeof HTMLAudioElement !== "undefined" && HTMLAudioElement.prototype) {
  if (!HTMLAudioElement.prototype.canPlayType) {
    HTMLAudioElement.prototype.canPlayType = canPlayTypePolyfill;
  }
}

// 为 document.createElement("audio") 创建的元素添加 canPlayType 方法
if (typeof document !== "undefined" && document.createElement) {
  const originalCreateElement = document.createElement;
  document.createElement = function (
    tagName: string,
    options?: ElementCreationOptions
  ): HTMLElement {
    const element = originalCreateElement.call(this, tagName, options);

    // 如果是 audio 元素且没有 canPlayType 方法，则添加
    if (tagName.toLowerCase() === "audio" && !(element as any).canPlayType) {
      (element as any).canPlayType = canPlayTypePolyfill;
    }

    return element;
  };
}

// 导出 canPlayType 函数（如果需要）
export default canPlayTypePolyfill;
