# TypeScript Label 使用指南

## 概述

TypeScript Label 允许创作者使用 TypeScript 编写复杂的 Label 逻辑，编译后可以在游戏中运行。

## 工作流程

### 1. 编写 TypeScript 源文件

创建 `labels/myLabels.ts` 文件：

```typescript
import { newLabel } from '@drincs/pixi-vn';
import { narration } from '@drincs/pixi-vn';
import { RegisteredQuests, RegisteredCharacters } from '@drincs/nqtr';
import { showImage, newChoiceOption, newCloseChoiceOption } from '@drincs/pixi-vn';
import { BACKGROUND_ID } from '../constans';

// 获取游戏对象
const aliceQuest = RegisteredQuests.get('aliceQuest');
const alice = RegisteredCharacters.get('alice');

export const myLabel = newLabel('myLabel', () => {
    // 可以写任意 TypeScript 代码
    const stage = aliceQuest?.currentStageIndex || 0;
    const random = Math.random();
    
    if (stage === 0 && random > 0.5) {
        return [
            async () => {
                narration.dialogue = { 
                    character: alice, 
                    text: 'Random dialogue!' 
                };
            }
        ];
    }
    
    return [
        () => {
            narration.dialogue = { 
                character: alice, 
                text: 'Default dialogue' 
            };
        }
    ];
});
```

### 2. 编译为 JavaScript

使用 TypeScript 编译器或 esbuild：

```bash
# 使用 tsc（需要类型定义文件）
tsc labels/myLabels.ts --target ES2020 --module CommonJS --outDir labels-compiled

# 或使用 esbuild（推荐，更快）
# 注意：必须使用 --external:@drincs/* 避免打包这些依赖
# 因为这些 API 会在运行时通过 context 注入
esbuild labels/myLabels.ts --bundle --format=cjs --external:@drincs/* --outfile=labels-compiled/myLabels.js
```

**重要**：使用 esbuild 时必须添加 `--external:@drincs/*`，因为：
- 这些 API 在运行时由加载器通过 context 注入
- 不需要实际打包这些依赖
- 避免打包可以减小文件体积并避免依赖问题

### 3. 打包到 ZIP

将编译后的 `.js` 文件放入 `labels/` 文件夹，然后打包为 ZIP。

## 可用的 API

在 TypeScript Label 中，以下 API 会自动注入：

### pixi-vn API
- `narration` - 对话系统
- `newLabel` - 创建 Label
- `newChoiceOption` - 创建选择选项
- `newCloseChoiceOption` - 创建关闭选项
- `showImage` - 显示图片
- `storage` - 存储系统
- `canvas` - 画布操作

### nqtr API
- `navigator` - 导航系统
- `routine` - 日常安排
- `timeTracker` - 时间追踪
- `RegisteredQuests` - 任务注册表
- `RegisteredActivities` - 活动注册表
- `RegisteredCommitments` - 日常安排注册表
- `RegisteredRooms` - 房间注册表
- `RegisteredCharacters` - 角色注册表

### 工具函数
- `navigateAndJumpToLabel` - 导航并跳转到 Label

### 常量
- `BACKGROUND_ID` - 背景层 ID
- `NARRATION_ROUTE` - 对话路由

## 导出格式

Label 必须通过 `module.exports` 导出：

```javascript
module.exports = {
    myLabel1,
    myLabel2,
    myLabel3,
};
```

## 注意事项

1. **依赖顺序**：确保 Label 依赖的游戏对象（如任务、角色）在加载 Label 之前已经注册
2. **编译格式**：必须编译为 CommonJS 格式（`module.exports`）
3. **文件扩展名**：编译后的文件必须是 `.js`，不能是 `.min.js`
4. **错误处理**：单个文件加载失败不会影响其他文件

## 示例

查看 `complexLabels.js` 和 `complexLabels.ts.example` 了解完整示例。

