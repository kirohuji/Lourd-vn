---
name: 实现图片比较功能（pixelmatch）
overview: 使用 pixelmatch 在前端创建一个图片比较页面，支持上传两张图片并显示比较结果和统计信息
todos:
  - id: "1"
    content: 安装 pixelmatch 和 pngjs 依赖包
    status: completed
  - id: "2"
    content: 创建图片比较工具函数（处理图片转换和比较逻辑）
    status: completed
  - id: "3"
    content: 创建图片比较页面组件（image-compare.tsx）
    status: completed
  - id: "4"
    content: 实现图片上传功能（支持拖拽和点击上传）
    status: completed
  - id: "5"
    content: 实现图片比较逻辑和差异图生成
    status: completed
  - id: "6"
    content: 实现统计信息显示（差异百分比、像素数量等）
    status: completed
  - id: "7"
    content: 添加路由配置
    status: completed
  - id: "8"
    content: 添加菜单项
    status: completed
---

# 实现图片比较功能（pixelmatch）

## 需求分析

1. **功能**：使用 pixelmatch 在前端创建一个页面，可以上传两张图片并比较它们
2. **显示方式**：显示原图1、原图2和差异图（三张图片）
3. **统计信息**：显示差异百分比、不同像素数量等

## 实现方案

### 1. 安装依赖

**文件**: `apps/admin/package.json`

- 安装 `pixelmatch` 包用于图片比较
- 安装 `pngjs` 包用于处理 PNG 图片（pixelmatch 需要）

**命令**:

```bash
cd apps/admin && pnpm add pixelmatch pngjs
cd apps/admin && pnpm add -D @types/pngjs
```

### 2. 创建图片比较页面组件

**文件**: `apps/admin/src/pages/image-compare.tsx`

- 创建新的页面组件
- 实现两张图片的上传功能
- 使用 `pixelmatch` 比较图片
- 显示原图1、原图2和差异图（三栏布局）
- 显示统计信息（差异百分比、不同像素数量、总像素数等）
- 支持拖拽上传或点击上传

**功能要点**:

- 使用 `FileReader` 读取图片文件
- 将图片转换为 Canvas，然后转换为 ImageData
- 使用 `pixelmatch` 生成差异图
- 将差异图转换为 base64 或 blob URL 用于显示

### 3. 添加路由配置

**文件**: `apps/admin/src/routes/config.tsx`

- 添加图片比较页面的路由配置
- 路径：`/admin/image-compare`

### 4. 添加菜单项

**文件**: `apps/admin/src/config/menu.ts`

- 在菜单中添加"图片比较"选项
- 使用合适的图标（如 `Image` 或 `Compare`）

### 5. 创建图片比较工具函数

**文件**: `apps/admin/src/lib/utils/image-compare.ts`（可选）

- 封装图片比较逻辑
- 处理图片格式转换
- 计算统计信息

## 实现细节

### 图片比较流程

```typescript
// 1. 读取两张图片文件
const image1 = await loadImage(file1);
const image2 = await loadImage(file2);

// 2. 确保两张图片尺寸相同（如果不相同，需要调整）
const width = Math.max(image1.width, image2.width);
const height = Math.max(image1.height, image2.height);

// 3. 将图片转换为 ImageData
const img1Data = getImageData(image1, width, height);
const img2Data = getImageData(image2, width, height);

// 4. 创建差异图数据
const diff = new Uint8Array(width * height * 4);
const numDiffPixels = pixelmatch(
  img1Data.data,
  img2Data.data,
  diff,
  width,
  height,
  { threshold: 0.1 }
);

// 5. 计算统计信息
const totalPixels = width * height;
const diffPercentage = (numDiffPixels / totalPixels) * 100;
```

### UI 布局

```
┌─────────────────────────────────────────┐
│  图片比较                                │
├─────────────────────────────────────────┤
│  [上传图片1]  [上传图片2]                │
├──────────┬──────────┬──────────┬────────┤
│ 原图1    │ 原图2    │ 差异图   │ 统计   │
│          │          │          │        │
│ [图片]   │ [图片]   │ [图片]   │ 差异:  │
│          │          │          │ X%     │
│          │          │          │ 像素:  │
│          │          │          │ X/Y    │
└──────────┴──────────┴──────────┴────────┘
```

### 统计信息显示

- 差异百分比：`(不同像素数 / 总像素数) * 100`
- 不同像素数量：`pixelmatch` 返回的数值
- 总像素数：`width * height`
- 图片尺寸：`width x height`

## 技术要点

1. **图片格式处理**：

   - pixelmatch 需要 RGBA 格式的 ImageData
   - 需要将上传的图片（可能是 JPG、PNG 等）转换为 ImageData
   - 使用 Canvas API 进行转换

2. **尺寸不匹配处理**：

   - 如果两张图片尺寸不同，需要调整到相同尺寸
   - 可以选择拉伸、裁剪或居中显示

3. **性能优化**：

   - 大图片可能需要优化处理
   - 可以考虑使用 Web Worker 进行后台处理

4. **用户体验**：

   - 显示加载状态
   - 支持拖拽上传
   - 显示图片预览
   - 错误处理

## 测试要点

1. 上传两张相同的图片，差异应该为 0%
2. 上传两张完全不同的图片，差异应该接近 100%
3. 上传尺寸不同的图片，应该能正确处理
4. 测试各种图片格式（JPG、PNG、WebP 等）
5. 测试大图片的处理性能