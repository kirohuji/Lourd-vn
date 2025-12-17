# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and set npm registry to China mirror
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm config set registry https://registry.npmmirror.com

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first (must succeed)
RUN pnpm --filter @lourd-game/shared build

# Set build args for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build admin (skip type checking)
RUN cd apps/admin && VITE_CJS_IGNORE_WARNING=true npx vite build --mode production

# Production stage
FROM nginx:alpine

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
