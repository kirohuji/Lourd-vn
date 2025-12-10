-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

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
    "bundleType" TEXT DEFAULT 'chapter',
    "hash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT,
    "mimeType" TEXT,
    "cosKey" TEXT,
    "originalName" TEXT,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "requireAd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bundle" TEXT,
    "backgroundType" TEXT NOT NULL DEFAULT 'timeSlots',
    "backgroundJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconAlias" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "spriteJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "mapId" TEXT,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEntrance" BOOLEAN NOT NULL DEFAULT false,
    "backgroundType" TEXT NOT NULL DEFAULT 'timeSlots',
    "backgroundJson" JSONB,
    "hotspotsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "icon" TEXT,
    "color" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resource_usage" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_resource_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_map_usage" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "mapId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_map_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_character_usage" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "characterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_character_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_resource_usage" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_resource_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

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
CREATE INDEX "resources_bundleType_idx" ON "resources"("bundleType");

-- CreateIndex
CREATE INDEX "resources_alias_idx" ON "resources"("alias");

-- CreateIndex
CREATE INDEX "resources_hash_idx" ON "resources"("hash");

-- CreateIndex
CREATE INDEX "chapters_projectId_idx" ON "chapters"("projectId");

-- CreateIndex
CREATE INDEX "chapters_order_idx" ON "chapters"("order");

-- CreateIndex
CREATE INDEX "project_resource_usage_projectId_idx" ON "project_resource_usage"("projectId");

-- CreateIndex
CREATE INDEX "project_resource_usage_resourceId_idx" ON "project_resource_usage"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "project_resource_usage_projectId_resourceId_key" ON "project_resource_usage"("projectId", "resourceId");

-- CreateIndex
CREATE INDEX "project_map_usage_projectId_idx" ON "project_map_usage"("projectId");

-- CreateIndex
CREATE INDEX "project_map_usage_mapId_idx" ON "project_map_usage"("mapId");

-- CreateIndex
CREATE UNIQUE INDEX "project_map_usage_projectId_mapId_key" ON "project_map_usage"("projectId", "mapId");

-- CreateIndex
CREATE INDEX "project_character_usage_projectId_idx" ON "project_character_usage"("projectId");

-- CreateIndex
CREATE INDEX "project_character_usage_characterId_idx" ON "project_character_usage"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "project_character_usage_projectId_characterId_key" ON "project_character_usage"("projectId", "characterId");

-- CreateIndex
CREATE INDEX "chapter_resource_usage_chapterId_idx" ON "chapter_resource_usage"("chapterId");

-- CreateIndex
CREATE INDEX "chapter_resource_usage_resourceId_idx" ON "chapter_resource_usage"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_resource_usage_chapterId_resourceId_key" ON "chapter_resource_usage"("chapterId", "resourceId");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_usage" ADD CONSTRAINT "project_resource_usage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_usage" ADD CONSTRAINT "project_resource_usage_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_map_usage" ADD CONSTRAINT "project_map_usage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_map_usage" ADD CONSTRAINT "project_map_usage_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_character_usage" ADD CONSTRAINT "project_character_usage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_character_usage" ADD CONSTRAINT "project_character_usage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_resource_usage" ADD CONSTRAINT "chapter_resource_usage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_resource_usage" ADD CONSTRAINT "chapter_resource_usage_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
