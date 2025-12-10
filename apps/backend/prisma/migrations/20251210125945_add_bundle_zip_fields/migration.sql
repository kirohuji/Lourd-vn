-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "chapterBundleVersion" INTEGER,
ADD COLUMN     "chapterBundleZipUrl" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "commonBundleVersion" INTEGER,
ADD COLUMN     "commonBundleZipUrl" TEXT;
