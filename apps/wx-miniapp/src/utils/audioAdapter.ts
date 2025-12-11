/**
 * 微信小程序音频适配器
 * 用于替换 HTMLAudioElement，让 pixi-vn 可以在小程序环境中正常使用音频
 */

// 声明微信小程序全局对象
declare const wx: {
  createInnerAudioContext: () => WechatAudioContext;
};

interface WechatAudioContext {
  src: string;
  autoplay: boolean;
  loop: boolean;
  volume: number;
  play(): void;
  pause(): void;
  stop(): void;
  seek(position: number): void;
  destroy(): void;
  onCanplay(callback: () => void): void;
  onPlay(callback: () => void): void;
  onPause(callback: () => void): void;
  onStop(callback: () => void): void;
  onEnded(callback: () => void): void;
  onError(callback: (err: any) => void): void;
  onTimeUpdate(callback: () => void): void;
  onWaiting(callback: () => void): void;
  onSeeking(callback: () => void): void;
  onSeeked(callback: () => void): void;
}

/**
 * 微信小程序音频适配类
 * 实现 HTMLAudioElement 的接口，内部使用 wx.createInnerAudioContext
 */
class WechatAudioAdapter {
  private audioContext: WechatAudioContext | null = null;
  private _src: string = "";
  private _volume: number = 1;
  private _loop: boolean = false;
  private _autoplay: boolean = false;
  private _paused: boolean = true;
  private _readyState: number = 0; // 0: HAVE_NOTHING, 4: HAVE_ENOUGH_DATA

  // 事件监听器
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(src?: string) {
    if (typeof wx !== "undefined" && wx.createInnerAudioContext) {
      this.audioContext = wx.createInnerAudioContext();
      this.setupEventHandlers();
    } else {
      console.warn("微信小程序环境未检测到，音频功能可能不可用");
    }

    if (src) {
      this.src = src;
    }
  }

  private setupEventHandlers() {
    if (!this.audioContext) return;

    this.audioContext.onCanplay(() => {
      this._readyState = 4; // HAVE_ENOUGH_DATA
      this.triggerEvent("canplay");
      this.triggerEvent("loadeddata");
    });

    this.audioContext.onPlay(() => {
      this._paused = false;
      this.triggerEvent("play");
    });

    this.audioContext.onPause(() => {
      this._paused = true;
      this.triggerEvent("pause");
    });

    this.audioContext.onEnded(() => {
      this._paused = true;
      this.triggerEvent("ended");
      if (this.loop) {
        this.play();
      }
    });

    this.audioContext.onError((err) => {
      this.triggerEvent("error", err);
    });

    this.audioContext.onTimeUpdate(() => {
      this.triggerEvent("timeupdate");
    });

    this.audioContext.onWaiting(() => {
      this.triggerEvent("waiting");
    });
  }

  private triggerEvent(eventName: string, data?: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  // HTMLAudioElement 兼容属性
  get src(): string {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    if (this.audioContext) {
      this.audioContext.src = value;
    }
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.audioContext) {
      this.audioContext.volume = this._volume;
    }
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
    if (this.audioContext) {
      this.audioContext.loop = value;
    }
  }

  get autoplay(): boolean {
    return this._autoplay;
  }

  set autoplay(value: boolean) {
    this._autoplay = value;
    if (this.audioContext) {
      this.audioContext.autoplay = value;
    }
  }

  get paused(): boolean {
    return this._paused;
  }

  get readyState(): number {
    return this._readyState;
  }

  get currentTime(): number {
    // 微信小程序音频 API 不直接提供 currentTime
    // 如果需要，可以通过其他方式实现
    return 0;
  }

  set currentTime(value: number) {
    if (this.audioContext) {
      this.audioContext.seek(value);
    }
  }

  // HTMLAudioElement 兼容方法
  play(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioContext) {
        reject(new Error("Audio context not available"));
        return;
      }

      try {
        this.audioContext.play();
        // 监听播放成功事件
        const onPlay = () => {
          resolve();
          this.removeEventListener("play", onPlay);
        };
        this.addEventListener("play", onPlay);

        // 监听错误事件
        const onError = (err: any) => {
          reject(err);
          this.removeEventListener("error", onError);
        };
        this.addEventListener("error", onError);
      } catch (error) {
        reject(error);
      }
    });
  }

  pause(): void {
    if (this.audioContext) {
      this.audioContext.pause();
    }
  }

  load(): void {
    // 微信小程序音频会自动加载，这个方法可以留空或实现预加载逻辑
    if (this.audioContext && this._src) {
      this.audioContext.src = this._src;
    }
  }

  addEventListener(
    type: string,
    listener: EventListener | ((event: any) => void)
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListener | ((event: any) => void)
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // 关键方法：canPlayType - 这是导致错误的原因
  canPlayType(mimeType: string): string {
    // 微信小程序支持的音频格式
    const supportedFormats = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
    ];
    const normalizedType = mimeType.toLowerCase();

    if (supportedFormats.some((format) => normalizedType.includes(format))) {
      return "probably"; // 或 "maybe"
    }

    return "";
  }

  // 清理资源
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
    this.eventListeners.clear();
  }
}

/**
 * 初始化音频适配器
 * 替换全局 Audio 构造函数，让 pixi-vn 使用微信小程序的音频 API
 */
export function initAudioAdapter() {
  // 检查是否在微信小程序环境
  if (typeof wx !== "undefined" && wx.createInnerAudioContext) {
    // 保存原始的 Audio 构造函数（如果存在）
    const OriginalAudio = typeof Audio !== "undefined" ? Audio : null;

    // 替换全局 Audio 构造函数
    (globalThis as any).Audio = WechatAudioAdapter as any;

    console.log("微信小程序音频适配器已初始化");

    return () => {
      // 恢复原始 Audio（如果需要）
      if (OriginalAudio) {
        (globalThis as any).Audio = OriginalAudio;
      }
    };
  } else {
    console.warn("不在微信小程序环境，使用默认 Audio");
  }
}

export default WechatAudioAdapter;
