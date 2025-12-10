/*
  Warnings:

  - You are about to drop the column `projectId` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `resources` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Map" DROP CONSTRAINT "Map_projectId_fkey";

-- DropForeignKey
ALTER TABLE "resources" DROP CONSTRAINT "resources_projectId_fkey";

-- DropIndex
DROP INDEX "Character_projectId_idx";

-- DropIndex
DROP INDEX "Map_projectId_idx";

-- DropIndex
DROP INDEX "resources_projectId_idx";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "Map" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "projectId";

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
