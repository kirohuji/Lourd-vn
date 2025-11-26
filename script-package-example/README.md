# 剧本包示例

这是一个游戏剧本包的 JSON 格式示例，展示了如何将 TypeScript 代码转换为可导入的 JSON 配置。

## 文件夹结构

```
script-package-example/
├── package.json          # 剧本包元数据（名称、版本、描述等）
├── manifest.json         # 资源清单（从 manifest.ts 导出）
├── values/               # 游戏数据
│   ├── activities.json   # 活动定义
│   ├── characters.json   # 角色定义
│   ├── locations.json    # 地点定义
│   ├── maps.json         # 地图定义
│   ├── rooms.json        # 房间定义
│   ├── routine.json      # 日常安排（commitments）
│   └── quests/           # 任务文件夹
│       └── aliceQuest.json
├── labels/               # 标签数据
│   ├── variousActionsLabels.json
│   ├── sleepNapLabels.json
│   └── variousActionsLabelKeys.json
└── ink/                  # Ink 脚本文件
    └── variousActionsLabels.ink
```

## JSON 数据结构说明

### 1. package.json
剧本包的基本信息，包括名称、版本、描述、作者等。

### 2. manifest.json
资源清单，定义了游戏中使用的所有资源（图片、音频等）的加载配置。

### 3. values/characters.json
角色数据数组，每个角色包含：
- `id`: 角色唯一标识
- `name`: 角色名称
- `age`: 年龄（可选）
- `icon`: 图标 URL（可选）
- `color`: 主题色（可选）

### 4. values/maps.json
地图数据数组，每个地图包含：
- `id`: 地图唯一标识
- `name`: 地图名称
- `background`: 背景配置（可以是字符串或时间槽对象）
- `neighboringMaps`: 相邻地图配置

### 5. values/locations.json
地点数据数组，每个地点包含：
- `id`: 地点唯一标识
- `name`: 地点名称
- `mapId`: 所属地图 ID
- `sprite`: 精灵配置对象

### 6. values/rooms.json
房间数据数组，每个房间包含：
- `id`: 房间唯一标识
- `name`: 房间名称
- `locationId`: 所属地点 ID
- `background`: 背景配置
- `activities`: 活动 ID 数组
- `isEntrance`: 是否为入口（可选）

### 7. values/activities.json
活动数据数组，每个活动包含：
- `id`: 活动唯一标识
- `name`: 活动名称
- `icon`: 图标配置（MUI 图标名称）
- `onRun`: 执行逻辑（条件判断和动作序列）

### 8. values/quests/aliceQuest.json
任务配置，包含：
- `id`: 任务唯一标识
- `name`: 任务名称
- `description`: 任务描述
- `image`: 任务图片
- `stages`: 阶段数组
- `onStart`: 开始时的动作
- `onNextStage`: 进入下一阶段时的动作
- `commitments`: 相关的承诺/安排

### 9. values/routine.json
日常安排数组，每个安排包含：
- `id`: 安排唯一标识
- `characterId`: 角色 ID
- `roomId`: 房间 ID
- `timeSlot`: 时间段配置
- `background`: 背景配置
- `icon`: 图标配置
- `onRun`: 执行逻辑

### 10. labels/variousActionsLabels.json
标签数组，每个标签包含：
- `key`: 标签键
- `steps`: 步骤数组（对话、选择、条件判断等）
- `onStepStart`: 步骤开始时的动作（可选）

### 11. labels/sleepNapLabels.json
睡眠和午睡相关的标签配置。

### 12. labels/variousActionsLabelKeys.json
标签键常量定义。

### 13. ink/variousActionsLabels.ink
Ink 脚本文件，使用 Ink 语言编写的对话脚本。

## 关键转换规则

### 条件判断转换
TypeScript:
```typescript
if (aliceQuest.currentStageIndex == 0) {
    return [dialogue steps...];
}
```

JSON:
```json
{
    "type": "conditional",
    "condition": {
        "type": "questStage",
        "questId": "aliceQuest",
        "stageIndex": 0,
        "operator": "=="
    },
    "then": [dialogue steps...]
}
```

### 活动执行逻辑转换
TypeScript:
```typescript
async (_, event) => {
    if (timeTracker.nowIsBetween(5, 22)) {
        await navigateAndJumpToLabel(napLabel, NARRATION_ROUTE, event);
    }
}
```

JSON:
```json
{
    "onRun": {
        "type": "conditional",
        "condition": {
            "type": "time",
            "timeFrom": 5,
            "timeTo": 22
        },
        "then": [{
            "type": "jumpLabel",
            "labelKey": "NapLabel",
            "route": "/narration"
        }]
    }
}
```

## 使用说明

这个示例包展示了如何将 TypeScript 代码转换为 JSON 配置。在实际使用时，需要：

1. 创建一个导入器来读取这些 JSON 文件
2. 将 JSON 配置转换为游戏对象
3. 注册到游戏系统中

所有 JSON 文件都已验证格式正确，可以直接使用。

