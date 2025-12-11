# Sound 模块执行时机分析

## 执行顺序

当你在代码中导入 `@drincs/pixi-vn` 时，执行顺序如下：

### 1. 导入 pixi-vn 主模块
```typescript
import { Game } from "@drincs/pixi-vn";
```

### 2. index.ts 执行
- `export * from "@drincs/pixi-vn/sound"` (第5行)
  - 这会触发 sound 模块的加载

### 3. sound/index.ts 执行
- `import SoundManager from "./SoundManager"` (第1行)
  - 这会触发 SoundManager 的加载
- `const sound = new SoundManager()` (第11行)
  - 这是模块级别的代码，会在模块加载时立即执行

### 4. SoundManager.ts 执行
- `import { ... } from "@pixi/sound"` (第2-11行)
  - **这是关键点！** 当 `@pixi/sound` 被导入时，它的模块级代码会立即执行

### 5. @pixi/sound 模块加载
- `@pixi/sound` 的 `supported.mjs` 文件会立即执行：
  ```javascript
  function validateFormats(typeOverrides) {
    const audio = document.createElement("audio");
    // 这里会立即调用 audio.canPlayType()
    extensions.forEach((ext) => {
      const canByExt = audio.canPlayType(`audio/${ext}`).replace(no, "");
      // ...
    });
  }
  validateFormats(); // 模块加载时立即执行！
  ```

## 问题所在

**关键问题**：`@pixi/sound` 的 `validateFormats()` 在模块加载时就会立即执行，此时：
- 如果 polyfill 还没有执行，`audio.canPlayType` 就不存在
- 导致 `TypeError: audio.canPlayType is not a function`

## 解决方案

polyfill 必须在以下时机之一执行：

1. **在导入 pixi-vn 之前**（推荐）
   ```typescript
   import "../config/audioPolyfill";  // 先执行 polyfill
   import { Game } from "@drincs/pixi-vn";  // 再导入 pixi-vn
   ```

2. **在 sound 模块内部，导入 @pixi/sound 之前**
   - 在 `SoundManager.ts` 中，在 `import ... from "@pixi/sound"` 之前执行 polyfill

3. **在构建时注入**
   - 使用 Vite 插件在构建时修改 `@pixi/sound` 的代码

## 当前状态

从构建后的代码 (`dist/sound.mjs`) 可以看到：
1. 首先导入 `@pixi/sound`：`import {filters,SoundLibrary,sound,Sound}from'@pixi/sound';`
2. 然后才执行 polyfill（在构建后的代码中可以看到 polyfill 函数）
3. 最后创建 SoundManager 实例：`var te=new g;`

**问题**：polyfill 在 `@pixi/sound` 导入之后才执行，但 `@pixi/sound` 在导入时就会立即执行 `validateFormats()`，所以 polyfill 执行得太晚了。

## 建议

最好的解决方案是在 `SoundManager.ts` 中，在导入 `@pixi/sound` 之前内联执行 polyfill 代码，确保在 `@pixi/sound` 加载之前 polyfill 已经生效。
