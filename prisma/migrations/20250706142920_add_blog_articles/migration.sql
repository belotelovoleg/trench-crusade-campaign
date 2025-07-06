-- AlterTable
ALTER TABLE "about_campaign" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Untitled Article';

-- CreateIndex
CREATE INDEX "idx_campaign_published" ON "about_campaign"("campaign_id", "isPublished");
