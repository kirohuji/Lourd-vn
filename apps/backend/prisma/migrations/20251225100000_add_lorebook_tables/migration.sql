-- CreateTable
CREATE TABLE "lorebook_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createSubcontext" BOOLEAN NOT NULL DEFAULT false,
    "useCategoryDefaults" BOOLEAN NOT NULL DEFAULT false,
    "open" BOOLEAN NOT NULL DEFAULT false,
    "subcontextSettings" JSONB,
    "categoryDefaults" JSONB,
    "categoryBiasGroups" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "order" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lorebook_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lorebook_entries" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "searchRange" INTEGER NOT NULL DEFAULT 1000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "forceActivation" BOOLEAN NOT NULL DEFAULT false,
    "keyRelative" BOOLEAN NOT NULL DEFAULT false,
    "nonStoryActivatable" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "contextConfig" JSONB NOT NULL,
    "loreBiasGroups" JSONB NOT NULL DEFAULT '[]',
    "advancedConditions" JSONB NOT NULL DEFAULT '[]',
    "lastUpdatedAt" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lorebook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lorebook_settings" (
    "id" SERIAL NOT NULL,
    "lorebookVersion" INTEGER NOT NULL DEFAULT 6,
    "orderByKeyLocations" BOOLEAN NOT NULL DEFAULT false,
    "order" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lorebook_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lorebook_entries_categoryId_idx" ON "lorebook_entries"("categoryId");

-- AddForeignKey
ALTER TABLE "lorebook_entries" ADD CONSTRAINT "lorebook_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "lorebook_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

