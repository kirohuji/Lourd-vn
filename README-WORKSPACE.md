# NQTR Game - 前后端分离项目

这是一个使用 pnpm workspace 组织的前后端分离项目，包含：

- `apps/web` - Taro.js 前端项目（支持 Web 和微信小程序）
- `apps/backend` - NestJS 后端项目
- `apps/desktop` - Tauri 桌面应用（使用 Taro 编译的 Web 版本）
- `packages/shared` - 共享类型定义和工具函数

## 项目结构

```
.
├── apps/
│   ├── web/              # Taro.js 前端项目
│   ├── backend/          # NestJS 后端项目
│   └── desktop/          # Tauri 桌面应用
├── packages/
│   └── shared/           # 共享包
└── pnpm-workspace.yaml   # Workspace 配置
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

#### 后端配置 (`apps/backend/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nqtr_game?schema=public"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# WeChat
WECHAT_APPID="your-wechat-appid"
WECHAT_SECRET="your-wechat-secret"
WECHAT_MINI_PROGRAM_APPID="your-miniprogram-appid"
WECHAT_MINI_PROGRAM_SECRET="your-miniprogram-secret"

# Tencent Cloud COS
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_REGION="your-cos-region"
COS_BUCKET="your-cos-bucket"
COS_DOMAIN="your-cos-domain.com"

# Server
PORT=3000
NODE_ENV=development
```

#### 前端配置 (`apps/web/.env`)

```env
TARO_APP_API_BASE_URL=http://localhost:3000
```

### 3. 初始化数据库

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### 4. 启动开发服务器

#### 启动后端

```bash
pnpm dev:backend
# 或
cd apps/backend && pnpm start:dev
```

后端 API 文档：http://localhost:3000/api

#### 启动前端（Web）

```bash
pnpm dev:web
# 或
cd apps/web && pnpm dev:h5
```

#### 启动前端（微信小程序）

```bash
cd apps/web && pnpm dev:weapp
```

#### 启动桌面应用

```bash
pnpm dev:desktop
# 或
cd apps/desktop && pnpm dev
```

## 构建

### 构建所有项目

```bash
pnpm build
```

### 单独构建

```bash
pnpm build:backend  # 构建后端
pnpm build:web      # 构建前端 Web
cd apps/web && pnpm build:weapp  # 构建微信小程序
pnpm build:desktop  # 构建桌面应用
```

## 功能说明

### 后端 API

- **认证模块** (`/auth`)
  - `POST /auth/wechat/login` - 微信登录（支持网页和小程序）

- **资源管理模块** (`/resources`)
  - `GET /resources` - 获取资源列表（支持分页、筛选、搜索）
  - `GET /resources/:id` - 获取资源详情
  - `POST /resources` - 上传资源（仅管理员）
  - `DELETE /resources/:id` - 删除资源（仅管理员）
  - `GET /resources/manifest` - 生成 Manifest

### 前端功能

- **登录页面** (`/pages/login/index`)
  - 支持微信小程序登录
  - Web 端需要实现微信扫码登录

- **资源管理页面** (`/pages/admin/resources/index`)
  - 仅管理员可访问
  - 资源列表展示
  - 资源删除功能

### 权限控制

- **后端**：使用 JWT + Guards + Decorators
- **前端**：路由守卫 + 组件级权限检查

## 开发注意事项

1. **共享包更新**：修改 `packages/shared` 后，需要重新构建：
   ```bash
   cd packages/shared && pnpm build
   ```

2. **数据库迁移**：修改 Prisma schema 后：
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Taro 平台差异**：使用 `process.env.TARO_ENV` 判断当前平台：
   - `weapp` - 微信小程序
   - `h5` - Web 端

4. **API 客户端**：所有 API 调用通过 `apps/web/src/utils/api-client.ts`

## 下一步开发

1. 完善微信网页登录流程
2. 迁移更多现有组件到 Taro 项目
3. 实现用户管理页面
4. 完善资源上传功能（文件选择、进度显示等）
5. 实现游戏主逻辑的迁移

