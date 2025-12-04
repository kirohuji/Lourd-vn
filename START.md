# 启动指南

## 前置准备

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建共享包

```bash
cd packages/shared && pnpm build && cd ../..
```

### 3. 配置数据库

#### 安装并启动 PostgreSQL

确保 PostgreSQL 已安装并运行：

```bash
# macOS (使用 Homebrew)
brew services start postgresql

# 或使用其他方式启动 PostgreSQL
```

#### 创建数据库

```bash
# 使用 psql
createdb lourd_game

# 或使用 PostgreSQL 客户端工具创建数据库
```

#### 配置数据库连接

编辑 `apps/backend/.env` 文件，修改 `DATABASE_URL`：

```env
DATABASE_URL="postgresql://你的用户名:你的密码@localhost:5432/lourd_game?schema=public"
```

**示例：**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lourd_game?schema=public"
```

#### 运行数据库迁移

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 配置环境变量

#### Backend 环境变量 (`apps/backend/.env`)

已创建 `.env` 文件，需要修改以下配置：

- `DATABASE_URL` - PostgreSQL 数据库连接字符串（**必须修改**）
- `JWT_SECRET` - JWT 密钥（生产环境请使用强密钥）
- `JWT_EXPIRES_IN` - JWT 过期时间（默认 7d）
- `PORT` - 服务器端口（默认 3000）
- `COS_SECRET_ID` - 腾讯云 COS Secret ID（已配置）
- `COS_SECRET_KEY` - 腾讯云 COS Secret Key（已配置）
- `COS_REGION` - 腾讯云 COS 区域（已配置）
- `COS_BUCKET` - 腾讯云 COS 存储桶名称（已配置）
- `COS_DOMAIN` - 腾讯云 COS 域名（已配置）

#### Web 环境变量 (`apps/web/.env`)

已创建 `.env` 文件，包含：

- `VITE_API_BASE_URL` - 后端 API 地址（默认 http://localhost:3000）

## 启动服务

### 方式一：分别启动（推荐用于开发）

#### 启动后端

在项目根目录运行：

```bash
pnpm dev:backend
```

或者：

```bash
cd apps/backend
pnpm start:dev
```

后端将在 `http://localhost:3000` 启动
Swagger 文档：`http://localhost:3000/api`

#### 启动前端

在另一个终端，项目根目录运行：

```bash
pnpm dev:web
```

或者：

```bash
cd apps/web
pnpm dev
```

前端将在 `http://localhost:1420` 启动（Vite 默认端口）

### 方式二：使用并发工具

可以安装 `concurrently` 来同时启动前后端：

```bash
pnpm add -D -w concurrently
```

然后在根目录 `package.json` 添加脚本：

```json
"dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:web\""
```

## 访问地址

- **前端（游戏客户端 + 管理后台）**: http://localhost:1420
- **后端 API**: http://localhost:3000
- **Swagger API 文档**: http://localhost:3000/api
- **管理后台登录**: http://localhost:1420/admin/login
- **资源管理**: http://localhost:1420/admin/resources
- **用户管理**: http://localhost:1420/admin/users

## 常见问题

### 1. 数据库连接失败

**错误**: `Can't reach database server at localhost:5432`

**解决方案**:
- 确保 PostgreSQL 服务正在运行
- 检查 `DATABASE_URL` 配置是否正确
- 确保数据库已创建：`createdb lourd_game`

### 2. Prisma 迁移失败

**错误**: Prisma schema validation errors

**解决方案**:
- 已修复 Prisma 7 配置问题
- 确保 `prisma.config.ts` 中的 `DATABASE_URL` 正确
- 运行 `npx prisma generate` 重新生成客户端

### 3. 共享包导入错误

**解决方案**:
```bash
cd packages/shared && pnpm build
```

### 4. CORS 错误

后端已配置允许所有来源的 CORS，如果仍有问题，检查 `apps/backend/src/main.ts` 中的 CORS 配置。

### 5. API 请求失败

**检查**:
- 后端是否正在运行
- `VITE_API_BASE_URL` 是否正确配置（默认 http://localhost:3000）
- 浏览器控制台是否有错误信息

## 快速启动命令总结

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
cd packages/shared && pnpm build && cd ../..

# 3. 配置数据库（修改 apps/backend/.env 中的 DATABASE_URL）
# 然后运行迁移
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
cd ../..

# 4. 启动后端（终端1）
pnpm dev:backend

# 5. 启动前端（终端2）
pnpm dev:web
```
