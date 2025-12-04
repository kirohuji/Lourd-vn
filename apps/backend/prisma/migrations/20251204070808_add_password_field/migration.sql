-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "wechatOpenId" TEXT,
    "wechatUnionId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "alias" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "bundle" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT,
    "cosKey" TEXT,
    "originalName" TEXT,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_bundles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manifest_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechatOpenId_key" ON "users"("wechatOpenId");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechatUnionId_key" ON "users"("wechatUnionId");

-- CreateIndex
CREATE UNIQUE INDEX "resources_hash_key" ON "resources"("hash");

-- CreateIndex
CREATE INDEX "resources_bundle_idx" ON "resources"("bundle");

-- CreateIndex
CREATE INDEX "resources_alias_idx" ON "resources"("alias");

-- CreateIndex
CREATE INDEX "resources_hash_idx" ON "resources"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_bundles_name_key" ON "manifest_bundles"("name");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
