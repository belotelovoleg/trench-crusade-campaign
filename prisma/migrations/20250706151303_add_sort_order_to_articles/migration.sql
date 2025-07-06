-- AlterTable
ALTER TABLE "about_campaign" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "idx_campaign_sort_order" ON "about_campaign"("campaign_id", "sortOrder");
