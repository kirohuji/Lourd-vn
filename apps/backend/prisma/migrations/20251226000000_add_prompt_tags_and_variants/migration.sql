-- CreateTable
CREATE TABLE "prompt_tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tagType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_variants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "basePromptId" INTEGER,
    "characterPromptId" INTEGER,
    "tagIds" JSONB NOT NULL DEFAULT '[]',
    "mergedPrompt" TEXT NOT NULL,
    "mergeConfig" JSONB DEFAULT '{"separator": "\n"}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompt_tags_tagType_idx" ON "prompt_tags"("tagType");

-- CreateIndex
CREATE INDEX "prompt_tags_enabled_idx" ON "prompt_tags"("enabled");

-- CreateIndex
CREATE INDEX "prompt_variants_basePromptId_idx" ON "prompt_variants"("basePromptId");

-- CreateIndex
CREATE INDEX "prompt_variants_characterPromptId_idx" ON "prompt_variants"("characterPromptId");

-- CreateIndex
CREATE INDEX "prompt_variants_isDefault_idx" ON "prompt_variants"("isDefault");

-- AddForeignKey
ALTER TABLE "prompt_variants" ADD CONSTRAINT "prompt_variants_basePromptId_fkey" FOREIGN KEY ("basePromptId") REFERENCES "base_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_variants" ADD CONSTRAINT "prompt_variants_characterPromptId_fkey" FOREIGN KEY ("characterPromptId") REFERENCES "character_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameColumn: base_prompts.prompt -> basicPrompt
ALTER TABLE "base_prompts" RENAME COLUMN "prompt" TO "basic_prompt";

-- RenameColumn: character_prompts.prompt -> basicPrompt
ALTER TABLE "character_prompts" RENAME COLUMN "prompt" TO "basic_prompt";

-- AddColumn: prompt_images.variantId
ALTER TABLE "prompt_images" ADD COLUMN "variant_id" INTEGER;

-- CreateIndex
CREATE INDEX "prompt_images_variant_id_idx" ON "prompt_images"("variant_id");

-- AddForeignKey
ALTER TABLE "prompt_images" ADD CONSTRAINT "prompt_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "prompt_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 为现有的 BasePrompt 创建默认变体
INSERT INTO "prompt_variants" ("name", "description", "isDefault", "basePromptId", "tagIds", "mergedPrompt", "mergeConfig", "order", "enabled", "createdAt", "updatedAt")
SELECT 
    'Default' as "name",
    NULL as "description",
    true as "isDefault",
    id as "basePromptId",
    '[]'::jsonb as "tagIds",
    "basic_prompt" as "mergedPrompt",
    '{"separator": "\n"}'::jsonb as "mergeConfig",
    0 as "order",
    true as "enabled",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "base_prompts";

-- 为现有的 CharacterPrompt 创建默认变体
INSERT INTO "prompt_variants" ("name", "description", "isDefault", "characterPromptId", "tagIds", "mergedPrompt", "mergeConfig", "order", "enabled", "createdAt", "updatedAt")
SELECT 
    'Default' as "name",
    NULL as "description",
    true as "isDefault",
    id as "characterPromptId",
    '[]'::jsonb as "tagIds",
    "basic_prompt" as "mergedPrompt",
    '{"separator": "\n"}'::jsonb as "mergeConfig",
    0 as "order",
    true as "enabled",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "character_prompts";

