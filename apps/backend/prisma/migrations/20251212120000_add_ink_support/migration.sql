-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "bundleDirTree" JSONB,
ADD COLUMN     "chapterBundleUrl" TEXT,
ADD COLUMN     "startInkId" INTEGER;

-- CreateTable
CREATE TABLE "ink_files" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "displayName" TEXT,
    "content" TEXT,
    "compiledPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ink_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ink_files_chapterId_idx" ON "ink_files"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ink_files_chapterId_filename_key" ON "ink_files"("chapterId", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_startInkId_key" ON "chapters"("startInkId");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_projectId_order_key" ON "chapters"("projectId", "order");

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_startInkId_fkey" FOREIGN KEY ("startInkId") REFERENCES "ink_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_files" ADD CONSTRAINT "ink_files_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

