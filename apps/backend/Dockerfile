# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install all dependencies
RUN pnpm install

# Generate Prisma client
RUN pnpm --filter @lourd-game/backend prisma:generate

# Build shared package first (must succeed)
RUN pnpm --filter @lourd-game/shared build

# Build backend
RUN pnpm --filter @lourd-game/backend build

# Production stage - keep full workspace structure
FROM node:20-alpine

WORKDIR /app

# Copy the entire built workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
